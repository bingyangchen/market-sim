import { Consumer, Supplier } from './individual.js';
import { PriceMachine } from './priceMachine.js';
import { MyMath } from './myMath.js';
import { DSCurveChart, MarketEqChart, SurplusChart } from './chart.js';
let animationField = document.getElementById("animation-field");
let marketEqChart = document.getElementById("market-eq-chart");
let marketEqChartDrawer;
let curveChart = document.getElementById("demand-supply-chart");
let curveChartDrawer;
let surplusChart = document.getElementById("surplus-chart");
let surplusChartDrawer;
let runPauseBtn = document.getElementById("run-pause-btn");
let clearBtn = document.getElementById("clear-btn");
let initialEqInput = document.getElementById("initial-eq");
let numOfConsumerInput = document.getElementById("number-of-consumer");
let numOfSupplierInput = document.getElementById("number-of-supplier");
let pauseTimeInput = document.getElementById("pause-time");
let allTabs = document.getElementsByClassName("tab");
let allInfoCharts = document.getElementsByClassName("info-chart");
let marketEqData;
let consumerList;
let supplierList;
let consumerSurplus;
let producerSurplus;
let shouldContinue;
let pm;
let nodeDivSize;
let initialEq;
let numOfConsumer;
let numOfSupplier;
let pauseTime;
function createNodeDiv() {
    let nodeDiv = document.createElement("div");
    nodeDiv.className = "node";
    nodeDiv.style.width = `${nodeDivSize}px`;
    nodeDiv.style.height = `${nodeDivSize}px`;
    nodeDiv.style.transitionDuration = `${pauseTime / 4}ms`;
    if (animationField !== null)
        animationField.appendChild(nodeDiv);
    return nodeDiv;
}
function createAllIndivuduals() {
    for (let i = 0; i < Math.max(numOfConsumer, numOfSupplier); i++) {
        let [a, b] = pm.genPayableSellable();
        if (i < numOfConsumer) {
            let nodeDiv = createNodeDiv();
            consumerList.push(new Consumer(nodeDiv, a));
        }
        if (i < numOfSupplier) {
            let nodeDiv = createNodeDiv();
            supplierList.push(new Supplier(nodeDiv, b));
        }
    }
}
function everyoneGoToMarket() {
    for (let eachConsumer of consumerList) {
        setTimeout(() => {
            if (animationField !== null)
                eachConsumer.goToMarket(animationField);
        }, 0);
    }
    for (let eachSupplier of supplierList) {
        setTimeout(() => {
            if (animationField !== null)
                eachSupplier.goToMarket(animationField);
        }, 0);
    }
}
function everyoneGoBackAndRePricing() {
    for (let eachConsumer of consumerList) {
        setTimeout(() => {
            if (animationField !== null)
                eachConsumer.goBack(animationField);
        }, pauseTime / 4 * 3);
        eachConsumer.dealt = false;
        eachConsumer.bid();
    }
    for (let eachSupplier of supplierList) {
        setTimeout(() => {
            if (animationField !== null)
                eachSupplier.goBack(animationField);
        }, pauseTime / 4 * 3);
        eachSupplier.dealt = false;
        eachSupplier.ask();
    }
}
function drawDSCurveChart() {
    // prepare demand/supply curve data
    let allBidPrices = [];
    let allAskPrices = [];
    for (let eachConsumer of consumerList)
        allBidPrices.push(eachConsumer.bidPrice);
    for (let eachSupplier of supplierList)
        allAskPrices.push(eachSupplier.askPrice);
    // sort allBidPrices in descending order
    allBidPrices.sort((a, b) => b - a);
    // sort allAskPrices in ascending order
    allAskPrices.sort((a, b) => a - b);
    // prepare demand/supply curve data
    let allPayable = [];
    let allSellable = [];
    for (let eachConsumer of consumerList)
        allPayable.push(eachConsumer.maxPayable);
    for (let eachSupplier of supplierList)
        allSellable.push(eachSupplier.minSellable);
    // sort allPayable in descending order
    allPayable.sort((a, b) => b - a);
    // sort allSellable in ascending order
    allSellable.sort((a, b) => a - b);
    let curveData = [["Q", "d", "s", "D", "S"]];
    let maxLoop = Math.max(allBidPrices.length, allAskPrices.length);
    for (let q = 0; q < maxLoop; q++) {
        let pd = 0, ps = 0;
        let payable = 0, sellable = 0;
        if (q < allBidPrices.length) {
            pd = allBidPrices[q];
            payable = allPayable[q];
        }
        else {
            pd = allBidPrices[allBidPrices.length - 1];
            payable = allPayable[allPayable.length - 1];
        }
        if (q < allAskPrices.length) {
            ps = allAskPrices[q];
            sellable = allSellable[q];
        }
        else {
            ps = allAskPrices[allAskPrices.length - 1];
            sellable = allSellable[allSellable.length - 1];
        }
        curveData.push([q, pd, ps, payable, sellable]);
    }
    curveChartDrawer.drawChart(curveData, initialEq);
}
function drawMarketEqData(dealPriceToday) {
    // Prepare Market Eq Data
    if (dealPriceToday.price > 0) {
        // marketEqData.push([marketEqData.length, MyMath.avg(dealPriceToday)]);
        marketEqData.push([marketEqData.length, dealPriceToday.price]);
    }
    else {
        if (marketEqData.length === 1)
            marketEqData.push([marketEqData.length, initialEq]);
        else {
            marketEqData.push([marketEqData.length, marketEqData[marketEqData.length - 1][2]]);
        }
    }
    marketEqChartDrawer.drawChart(marketEqData);
}
function deal(c, s) {
    c.deal();
    s.deal();
}
function match(phase, cList, sList, pauseTime, dealPriceToday) {
    // suffle consumer list and supplier list before matching
    cList = MyMath.suffleArray(cList);
    sList = MyMath.suffleArray(sList);
    let availableSupplierList = [...sList];
    for (let i = 0; i < cList.length; i++) {
        let eachConsumer = cList[i];
        let supplierFound;
        for (let j = 0; j < availableSupplierList.length; j++) {
            if (eachConsumer.bidPrice >= availableSupplierList[j].askPrice) {
                supplierFound = availableSupplierList[j];
                availableSupplierList.splice(j, 1);
                break;
            }
        }
        if (supplierFound === undefined) {
            let j = i % sList.length;
            supplierFound = sList[j];
        }
        setTimeout(() => {
            if (supplierFound !== undefined)
                eachConsumer.findSupplier(supplierFound);
        }, pauseTime / 4 * phase);
        let supplierResponse = supplierFound.decideWhetherToSell(eachConsumer);
        if (supplierResponse === "accept") {
            deal(eachConsumer, supplierFound);
            // Record Consumer and Supplier Surplus
            let dealPrice = (eachConsumer.bidPrice + supplierFound.askPrice) / 2;
            let delta = eachConsumer.bidPrice - dealPrice;
            if (delta < dealPriceToday.minDelta) {
                dealPriceToday.price = dealPrice;
                dealPriceToday.minDelta = delta;
            }
            consumerSurplus += (eachConsumer.maxPayable - dealPrice);
            producerSurplus += (dealPrice - supplierFound.minSellable);
        }
    }
    let undealtCList = [];
    let undealtSList = [];
    for (let each of consumerList) {
        if (!each.dealt)
            undealtCList.push(each);
    }
    for (let each of supplierList) {
        if (!each.dealt)
            undealtSList.push(each);
    }
    return {
        "undealtCList": undealtCList,
        "undealtSList": undealtSList,
        "dealPriceToday": dealPriceToday
    };
}
function simulate() {
    consumerSurplus = 0;
    producerSurplus = 0;
    everyoneGoToMarket();
    drawDSCurveChart();
    let dealPriceToday = { "price": 0, "minDelta": Infinity };
    // Phase 1: matching each consumer to each supplier
    let matchResult1 = match(1, consumerList, supplierList, pauseTime, dealPriceToday);
    let consumerListAfterPhase1 = matchResult1.undealtCList;
    let supplierListAfterPahse1 = matchResult1.undealtSList;
    dealPriceToday = matchResult1.dealPriceToday;
    // Phase 2: those un-dealt consumer go finding another un-dealt supplier
    let matchResult2 = match(2, consumerListAfterPhase1, supplierListAfterPahse1, pauseTime, dealPriceToday);
    let consumerListAfterPhase2 = matchResult2.undealtCList;
    let supplierListAfterPahse2 = matchResult2.undealtSList;
    dealPriceToday = matchResult2.dealPriceToday;
    // Record Fail to Deal
    for (let each of consumerListAfterPhase2)
        each.faildToDeal();
    for (let each of supplierListAfterPahse2)
        each.faildToDeal();
    everyoneGoBackAndRePricing();
    drawMarketEqData(dealPriceToday);
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
        setTimeout(() => simulate(), pauseTime);
    }
}
function enableControl() {
    if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEqInput.disabled = false;
        numOfConsumerInput.disabled = false;
        numOfSupplierInput.disabled = false;
        pauseTimeInput.disabled = false;
    }
}
function disableControl() {
    if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEqInput.disabled = true;
        numOfConsumerInput.disabled = true;
        numOfSupplierInput.disabled = true;
        pauseTimeInput.disabled = true;
    }
}
function highlightTab(e) {
    for (let i = 0; i < allTabs.length; i++) {
        if (allTabs[i] === e.currentTarget && allInfoCharts[i] instanceof HTMLElement) {
            allTabs[i].classList.add("active");
            allInfoCharts[i].classList.add("active");
        }
        else {
            allTabs[i].classList.remove("active");
            allInfoCharts[i].classList.remove("active");
        }
    }
}
function initAllUserInputs() {
    if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEqInput.value = "100";
        numOfConsumerInput.value = "30";
        numOfSupplierInput.value = "30";
        pauseTimeInput.value = "40";
    }
}
function readAllUserInputs() {
    if (initialEqInput instanceof HTMLInputElement && numOfConsumerInput instanceof HTMLInputElement && numOfSupplierInput instanceof HTMLInputElement && pauseTimeInput instanceof HTMLInputElement) {
        initialEq = parseInt(initialEqInput.value);
        numOfConsumer = parseInt(numOfConsumerInput.value);
        numOfSupplier = parseInt(numOfSupplierInput.value);
        pauseTime = parseInt(pauseTimeInput.value);
    }
}
function start(e) {
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
        createAllIndivuduals();
        shouldContinue = true;
        changeRunBtnToPauseBtn();
        simulate(); //recursive function
    }
}
function pause(e) {
    shouldContinue = false;
    changePauseBtnToContinueBtn();
}
function continueToRun(e) {
    shouldContinue = true;
    changeRunBtnToPauseBtn();
    simulate(); //recursive function
}
function changeRunBtnToPauseBtn() {
    if (runPauseBtn instanceof HTMLButtonElement) {
        runPauseBtn.removeEventListener("click", start);
        runPauseBtn.removeEventListener("click", continueToRun);
        runPauseBtn.innerHTML = "PAUSE";
        runPauseBtn.addEventListener("click", pause);
    }
}
function changePauseBtnToContinueBtn() {
    if (runPauseBtn instanceof HTMLButtonElement) {
        runPauseBtn.removeEventListener("click", pause);
        runPauseBtn.innerHTML = "RUN";
        runPauseBtn.addEventListener("click", continueToRun);
    }
}
function addAllEventListeners() {
    for (let each of allTabs) {
        if (each instanceof HTMLElement)
            each.addEventListener("click", highlightTab);
    }
    if (runPauseBtn !== null && clearBtn !== null) {
        runPauseBtn.addEventListener("click", start);
        clearBtn.addEventListener("click", () => location.reload());
    }
}
initAllUserInputs();
addAllEventListeners();
