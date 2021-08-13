import { Consumer, Individual, Supplier } from './individual.js';
import { PriceMachine } from './priceMachine.js';
import { MyMath } from './myMath.js';
import { DSCurveChart, MarketEqChart, SurplusChart } from './chart.js';

let animationField = document.getElementById("animation-field");
let marketEqChart = document.getElementById("market-eq-chart");
let marketEqChartDrawer: MarketEqChart;
let curveChart = document.getElementById("demand-supply-chart");
let curveChartDrawer: DSCurveChart;
let surplusChart = document.getElementById("surplus-chart");
let surplusChartDrawer: SurplusChart;
let startBtn = document.getElementById("start-btn");
let pauseBtn = document.getElementById("pause-btn");
let resetBtn = document.getElementById("reset-btn");
let initialEqInput = document.getElementById("initial-eq");
let numOfConsumerInput = document.getElementById("number-of-consumer");
let numOfSupplierInput = document.getElementById("number-of-supplier");
let pauseTimeInput = document.getElementById("pause-time");
let allTabs = document.getElementsByClassName("tab");
let allInfoCharts = document.getElementsByClassName("info-chart");

let marketEqData: (number | string)[][];
let consumerList: Consumer[];
let supplierList: Supplier[];
let consumerSurplus: number;
let producerSurplus: number;
let shouldContinue: boolean;
let pm: PriceMachine;
let nodeDivSize: number;

function createNodeDiv(pauseTime: number): HTMLElement {
    let nodeDiv = document.createElement("div");
    nodeDiv.className = "node";
    nodeDiv.style.width = `${nodeDivSize}px`;
    nodeDiv.style.height = `${nodeDivSize}px`;
    nodeDiv.style.transitionDuration = `${pauseTime / 4}ms`;
    if (animationField !== null) animationField.appendChild(nodeDiv);
    return nodeDiv;
}

function initAllIndivuduals(numOfConsumer: number, numOfSupplier: number, pauseTime: number): void {
    for (let i = 0; i < Math.max(numOfConsumer, numOfSupplier); i++) {
        let [a, b] = pm.genPayableSellable();
        if (i < numOfConsumer) {
            let nodeDiv = createNodeDiv(pauseTime);
            consumerList.push(new Consumer(nodeDiv, a));
        }
        if (i < numOfSupplier) {
            let nodeDiv = createNodeDiv(pauseTime);
            supplierList.push(new Supplier(nodeDiv, b));
        }
    }
}

function drawDSCurveChart(initialEq: number): void {
    // prepare demand/supply curve data
    let allBidPrices: number[] = [];
    let allAskPrices: number[] = [];
    for (let eachConsumer of consumerList) allBidPrices.push(eachConsumer.bidPrice);
    for (let eachSupplier of supplierList) allAskPrices.push(eachSupplier.askPrice);

    // sort allBidPrices in descending order
    allBidPrices.sort((a: number, b: number) => b - a);
    // sort allAskPrices in ascending order
    allAskPrices.sort((a: number, b: number) => a - b);

    // prepare demand/supply curve data
    let allPayable: number[] = [];
    let allSellable: number[] = [];
    for (let eachConsumer of consumerList) allPayable.push(eachConsumer.maxPayable);
    for (let eachSupplier of supplierList) allSellable.push(eachSupplier.minSellable);

    // sort allPayable in descending order
    allPayable.sort((a: number, b: number) => b - a);
    // sort allSellable in ascending order
    allSellable.sort((a: number, b: number) => a - b);

    let curveData: (number[] | string[])[] = [["Q", "d", "s", "D", "S"]];
    let maxLoop = Math.max(allBidPrices.length, allAskPrices.length);
    for (let q = 0; q < maxLoop; q++) {
        let pd = 0, ps = 0;
        let payable = 0, sellable = 0;
        if (q < allBidPrices.length) {
            pd = allBidPrices[q];
            payable = allPayable[q];
        } else {
            pd = allBidPrices[allBidPrices.length - 1];
            payable = allPayable[allPayable.length - 1];
        }
        if (q < allAskPrices.length) {
            ps = allAskPrices[q];
            sellable = allSellable[q];
        } else {
            ps = allAskPrices[allAskPrices.length - 1];
            sellable = allSellable[allSellable.length - 1];
        }
        curveData.push([q, pd, ps, payable, sellable]);
    }
    curveChartDrawer.drawChart(curveData, initialEq);
}

function deal(c: Consumer, s: Supplier): void {
    c.deal();
    s.deal();
}

function match(phase: number, cList: Consumer[], sList: Supplier[], pauseTime: number, dealPriceToday: { "price": number, "minDelta": number }): { "undealtCList": Consumer[], "undealtSList": Supplier[], "dealPriceToday": { "price": number, "minDelta": number } } {
    // suffle consumer list and supplier list before matching
    cList = MyMath.suffleArray(cList);
    sList = MyMath.suffleArray(sList);
    for (let i = 0; i < cList.length; i++) {
        let consumerSelected = cList[i];
        let j = i % sList.length;
        let supplierFound = sList[j];
        setTimeout(() => {
            consumerSelected.findSupplier(supplierFound);
        }, pauseTime / 4 * phase);
        let supplierResponse = supplierFound.decideWhetherToSell(consumerSelected);
        if (supplierResponse === "accept") {
            deal(consumerSelected, supplierFound);

            // Record Consumer and Supplier Surplus
            let dealPrice = (consumerSelected.bidPrice + supplierFound.askPrice) / 2;
            let delta = consumerSelected.bidPrice - dealPrice;
            if (delta < dealPriceToday.minDelta) {
                dealPriceToday.price = dealPrice;
                dealPriceToday.minDelta = delta;
            }
            consumerSurplus += (consumerSelected.maxPayable - dealPrice);
            producerSurplus += (dealPrice - supplierFound.minSellable);
        }
    }
    let undealtCList: Consumer[] = [];
    let undealtSList: Supplier[] = [];
    for (let each of consumerList) {
        if (!each.dealt) undealtCList.push(each);
    }
    for (let each of supplierList) {
        if (!each.dealt) undealtSList.push(each);
    }
    return {
        "undealtCList": undealtCList,
        "undealtSList": undealtSList,
        "dealPriceToday": dealPriceToday
    }
}

function simulate(initialEq: number, pauseTime: number): void {
    consumerSurplus = 0;
    producerSurplus = 0;
    if (animationField !== null) {
        // everyone go to the market
        for (let eachConsumer of consumerList) {
            setTimeout(() => {
                if (animationField !== null) eachConsumer.goToMarket(animationField);
            }, 0);
        }
        for (let eachSupplier of supplierList) {
            setTimeout(() => {
                if (animationField !== null) eachSupplier.goToMarket(animationField);
            }, 0);
        }

        drawDSCurveChart(initialEq);
        let dealPriceToday: any = { "price": 0, "minDelta": Infinity };

        // Phase 1: matching each consumer to each supplier
        let matchResult1: any = match(1, consumerList, supplierList, pauseTime, dealPriceToday);
        let consumerListAfterPhase1: Consumer[] = matchResult1.undealtCList;
        let supplierListAfterPahse1: Supplier[] = matchResult1.undealtSList;
        dealPriceToday = matchResult1.dealPriceToday;

        // Phase 2: those un-dealt consumer go finding another un-dealt supplier
        let matchResult2: any = match(2, consumerListAfterPhase1, supplierListAfterPahse1, pauseTime, dealPriceToday);
        let consumerListAfterPhase2: Consumer[] = matchResult2.undealtCList;
        let supplierListAfterPahse2: Supplier[] = matchResult2.undealtSList;
        dealPriceToday = matchResult2.dealPriceToday;

        // Record Fail to Deal
        for (let each of consumerListAfterPhase2) each.faildToDeal();
        for (let each of supplierListAfterPahse2) each.faildToDeal();

        // Everyone go back and rebid/reask 
        for (let eachConsumer of consumerList) {
            setTimeout(() => {
                if (animationField !== null) eachConsumer.goBack(animationField);
            }, pauseTime / 4 * 3);
            eachConsumer.dealt = false;
            eachConsumer.bid();
        }
        for (let eachSupplier of supplierList) {
            setTimeout(() => {
                if (animationField !== null) eachSupplier.goBack(animationField);
            }, pauseTime / 4 * 3);
            eachSupplier.dealt = false;
            eachSupplier.ask();
        }

        // Record Market Equillibrium
        if (dealPriceToday.price > 0) {
            // marketEqData.push([marketEqData.length, MyMath.avg(dealPriceToday)]);
            marketEqData.push([marketEqData.length, dealPriceToday.price]);
        } else {
            if (marketEqData.length === 1) marketEqData.push([marketEqData.length, initialEq]);
            else {
                marketEqData.push([marketEqData.length, marketEqData[marketEqData.length - 1][2]]);
            }
        }
        marketEqChartDrawer.drawChart(marketEqData);
        surplusChartDrawer.drawChart(consumerSurplus, producerSurplus);
        if (shouldContinue) {
            // prevent memory leak
            consumerListAfterPhase1.length = 0;
            consumerListAfterPhase2.length = 0;
            supplierListAfterPahse1.length = 0;
            supplierListAfterPahse2.length = 0;
            dealPriceToday = undefined;
            matchResult1 = undefined;
            matchResult1 = undefined;
            setTimeout(() => simulate(initialEq, pauseTime), pauseTime);
        } else enableControl();
    }
}

function enableControl(): void {
    if (startBtn instanceof HTMLButtonElement && initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        startBtn.disabled = false;
        initialEqInput.disabled = false;
        numOfConsumerInput.disabled = false;
        numOfSupplierInput.disabled = false;
        pauseTimeInput.disabled = false;
    }
}

function controlTab(): void {
    for (let each of allTabs) {
        if (each instanceof HTMLElement) each.addEventListener("click", highlightTab);
    }
}

function highlightTab(e: Event): void {
    for (let i = 0; i < allTabs.length; i++) {
        if (allTabs[i] === e.currentTarget && allInfoCharts[i] instanceof HTMLElement) {
            allTabs[i].classList.add("active");
            allInfoCharts[i].classList.add("active");
        } else {
            allTabs[i].classList.remove("active");
            allInfoCharts[i].classList.remove("active");
        }
    }
}
function start(): void {
    if (startBtn instanceof HTMLButtonElement && animationField !== null && marketEqChart instanceof HTMLElement && surplusChart instanceof HTMLElement && curveChart instanceof HTMLElement) {
        marketEqChartDrawer = new MarketEqChart(marketEqChart);
        curveChartDrawer = new DSCurveChart(curveChart);
        surplusChartDrawer = new SurplusChart(surplusChart);
        animationField.innerHTML = "";
        marketEqData = [["Day", "Mkt. Eq."]];
        consumerList = [];
        supplierList = [];
        consumerSurplus = 0;
        producerSurplus = 0;
        shouldContinue = true;
        nodeDivSize = 20;
        startBtn.disabled = true;
        if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
            let initialEq: number = parseInt(initialEqInput.value);
            let numOfConsumer: number = parseInt(numOfConsumerInput.value);
            let numOfSupplier: number = parseInt(numOfSupplierInput.value);
            let pauseTime: number = parseInt(pauseTimeInput.value);
            initialEqInput.disabled = true;
            numOfConsumerInput.disabled = true;
            numOfSupplierInput.disabled = true;
            pauseTimeInput.disabled = true;
            pm = new PriceMachine(initialEq);
            initAllIndivuduals(numOfConsumer, numOfSupplier, pauseTime);
            simulate(initialEq, pauseTime);
        }
    }
}
if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
    initialEqInput.value = "100";
    numOfConsumerInput.value = "30";
    numOfSupplierInput.value = "30";
    pauseTimeInput.value = "40";
}
if (startBtn !== null && resetBtn !== null && pauseBtn !== null) {
    startBtn.addEventListener("click", () => start());
    pauseBtn.addEventListener("click", () => shouldContinue = false);
    resetBtn.addEventListener("click", () => location.reload());
}
controlTab();