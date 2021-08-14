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
let runPauseBtn = document.getElementById("run-pause-btn");
let clearBtn = document.getElementById("clear-btn");
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
let initialEq: number;
let pauseTime: number;

function createNodeDiv(): HTMLElement {
    let nodeDiv = document.createElement("div");
    nodeDiv.className = "node";
    nodeDiv.style.width = `${nodeDivSize}px`;
    nodeDiv.style.height = `${nodeDivSize}px`;
    nodeDiv.style.transitionDuration = `${pauseTime / 4}ms`;
    if (animationField !== null) animationField.appendChild(nodeDiv);
    return nodeDiv;
}

function createIndivuduals(cNum: number, sNum: number): void {
    for (let i = 0; i < Math.max(cNum, sNum); i++) {
        let [a, b] = pm.genPayableSellable();
        if (i < cNum) {
            let nodeDiv = createNodeDiv();
            consumerList.push(new Consumer(nodeDiv, a));
        }
        if (i < sNum) {
            let nodeDiv = createNodeDiv();
            supplierList.push(new Supplier(nodeDiv, b));
        }
    }
}

function everyoneGoToMarket(): void {
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
}

function everyoneGoBackAndRePricing(): void {
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
}

function drawDSCurveChart(): void {
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

function drawMarketEqData(dealPriceToday: number[]): void {
    // Prepare Market Eq Data
    if (dealPriceToday.length > 0) {
        // marketEqData.push([marketEqData.length, MyMath.avg(dealPriceToday)]);
        marketEqData.push([marketEqData.length, MyMath.mid(dealPriceToday)]);
    } else {
        if (marketEqData.length === 1) marketEqData.push([marketEqData.length, initialEq]);
        else {
            marketEqData.push([marketEqData.length, marketEqData[marketEqData.length - 1][2]]);
        }
    }
    marketEqChartDrawer.drawChart(marketEqData);
}

function deal(c: Consumer, s: Supplier): void {
    c.deal();
    s.deal();
}

function match(phase: number, cList: Consumer[], sList: Supplier[], pauseTime: number, dealPriceToday: number[]): { "undealtCList": Consumer[], "undealtSList": Supplier[], "dealPriceToday": number[] } {
    // suffle consumer list and supplier list before matching
    cList = MyMath.suffleArray(cList);
    sList = MyMath.suffleArray(sList);
    let availableSupplierList = [...sList];
    for (let i = 0; i < cList.length; i++) {
        let eachConsumer: Consumer = cList[i];
        let supplierFound: Supplier | undefined;
        for (let j = 0; j < availableSupplierList.length; j++) {
            if (eachConsumer.bidPrice >= availableSupplierList[j].askPrice) {
                supplierFound = availableSupplierList[j];
                availableSupplierList.splice(j, 1);
                break;
            }
        }
        if (supplierFound === undefined && sList.length > 0) {
            let j = i % sList.length;
            supplierFound = sList[j];
        }
        setTimeout(() => {
            if (supplierFound !== undefined) eachConsumer.findSupplier(supplierFound);
        }, pauseTime / 4 * phase);
        if (supplierFound !== undefined) {
            let supplierResponse = supplierFound.decideWhetherToSell(eachConsumer);
            if (supplierResponse === "accept") {
                deal(eachConsumer, supplierFound);

                // Record Consumer and Supplier Surplus
                let dealPrice = (eachConsumer.bidPrice + supplierFound.askPrice) / 2;
                dealPriceToday.push(dealPrice);
                consumerSurplus += (eachConsumer.maxPayable - dealPrice);
                producerSurplus += (dealPrice - supplierFound.minSellable);
            }
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

function simulate(): void {
    checkConsumerAndSupplierNum();
    consumerSurplus = 0;
    producerSurplus = 0;
    everyoneGoToMarket();
    drawDSCurveChart();
    let dealPriceToday: number[] = [];

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

    everyoneGoBackAndRePricing();
    drawMarketEqData(dealPriceToday);
    surplusChartDrawer.drawChart(consumerSurplus, producerSurplus);

    if (shouldContinue) {
        // prevent memory leak
        consumerListAfterPhase1.length = 0;
        consumerListAfterPhase2.length = 0;
        supplierListAfterPahse1.length = 0;
        supplierListAfterPahse2.length = 0;
        dealPriceToday.length = 0;
        matchResult1 = undefined;
        matchResult1 = undefined;

        setTimeout(() => simulate(), pauseTime);
    }
}

function enableControl(): void {
    if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEqInput.disabled = false;
        numOfConsumerInput.disabled = false;
        numOfSupplierInput.disabled = false;
        pauseTimeInput.disabled = false;
    }
}

function disableControl(): void {
    if (initialEqInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEqInput.disabled = true;
        pauseTimeInput.disabled = true;
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

function initAllUserInputs(): void {
    if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEqInput.value = "100";

        numOfConsumerInput.min = "1";
        numOfConsumerInput.max = "300";
        numOfConsumerInput.step = "1";
        numOfConsumerInput.value = "30";

        numOfSupplierInput.min = "1";
        numOfSupplierInput.max = "300";
        numOfSupplierInput.step = "1";
        numOfSupplierInput.value = "30";

        pauseTimeInput.value = "40";
    }
}

function readAllUserInputs(): void {
    if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEq = parseInt(initialEqInput.value);
        pauseTime = parseInt(pauseTimeInput.value);
    }
}

function start(e: Event): void {
    if (animationField !== null && marketEqChart instanceof HTMLElement && surplusChart instanceof HTMLElement && curveChart instanceof HTMLElement) {
        readAllUserInputs();
        disableControl();
        pm = new PriceMachine(initialEq);
        marketEqChartDrawer = new MarketEqChart(marketEqChart);
        curveChartDrawer = new DSCurveChart(curveChart);
        surplusChartDrawer = new SurplusChart(surplusChart);
        animationField.innerHTML = "";
        marketEqData = [["Day", "Mkt. Eq."]];
        consumerList = [];
        supplierList = [];
        consumerSurplus = 0;
        producerSurplus = 0;
        nodeDivSize = 20;
        shouldContinue = true;
        changeRunBtnToPauseBtn();
        simulate(); //recursive function
    }
}

function checkConsumerAndSupplierNum(): void {
    if (numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement) {
        let consumerNumDiff = parseInt(numOfConsumerInput.value) - consumerList.length;
        let supplierNumDiff = parseInt(numOfSupplierInput.value) - supplierList.length;
        createIndivuduals(consumerNumDiff, supplierNumDiff);
        while (consumerList.length > parseInt(numOfConsumerInput.value)) {
            consumerList.pop()?.divControlled.remove();
        }
        while (supplierList.length > parseInt(numOfSupplierInput.value)) {
            supplierList.pop()?.divControlled.remove();
        }
    }
}

function pause(e: Event): void {
    shouldContinue = false;
    changePauseBtnToContinueBtn();
}

function continueToRun(e: Event): void {
    shouldContinue = true;
    changeRunBtnToPauseBtn();
    simulate(); //recursive function
}

function changeRunBtnToPauseBtn(): void {
    if (runPauseBtn instanceof HTMLButtonElement) {
        runPauseBtn.removeEventListener("click", start);
        runPauseBtn.removeEventListener("click", continueToRun);
        runPauseBtn.innerHTML = "PAUSE";
        runPauseBtn.addEventListener("click", pause);
    }
}

function changePauseBtnToContinueBtn(): void {
    if (runPauseBtn instanceof HTMLButtonElement) {
        runPauseBtn.removeEventListener("click", pause);
        runPauseBtn.innerHTML = "RUN";
        runPauseBtn.addEventListener("click", continueToRun);
    }
}

function addAllEventListeners(): void {
    for (let each of allTabs) {
        if (each instanceof HTMLElement) each.addEventListener("click", highlightTab);
    }
    if (runPauseBtn !== null && clearBtn !== null && numOfConsumerInput !== null) {
        runPauseBtn.addEventListener("click", start);
        clearBtn.addEventListener("click", () => location.reload());
    }
}

initAllUserInputs();
addAllEventListeners();
