import { Consumer, Supplier } from './individual.js';
import { PriceMachine } from './priceMachine.js';
const priceMachineChart = document.getElementById("price-machine-chart");
const marketEqChart = document.getElementById("market-eq-chart");
function suffleArray(anArray) {
    for (let i = anArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = anArray[i];
        anArray[i] = anArray[j];
        anArray[j] = temp;
    }
    return anArray;
}
function avg(arr) {
    return arr.reduce((prev, curr) => prev + curr, 0) / arr.length;
}
let initialGivenPrice = 100;
let pm = new PriceMachine(initialGivenPrice);
let givenPriceData = [["Day", "Given Price"]];
let marketEqData = [["Day", "Given Price", "Equilibrium"]];
let consumerList = [];
let supplierList = [];
let numOfConsumer = 100;
let numOfSupplier = 5;
// initialize consumers and supplier
for (let i = 0; i < Math.max(numOfConsumer, numOfSupplier); i++) {
    let [a, b] = pm.genPayableSellable(false);
    if (i < numOfConsumer) {
        let c = new Consumer(a);
        consumerList.push(c);
    }
    if (i < numOfSupplier) {
        let s = new Supplier(b);
        supplierList.push(s);
    }
}
for (let i = 1; i <= 500; i++) {
    // suffle consumer list before matching them to suppliers
    consumerList = suffleArray(consumerList);
    // matching each consumer to each supplier
    for (let i = 0; i < consumerList.length; i++) {
        supplierList[i % supplierList.length].descendingQueueAConsumer(consumerList[i]);
    }
    let dealPriceToday = [];
    // check if deal
    for (let eachSupplier of supplierList) {
        eachSupplier.newInMkt = false;
        let paired = false;
        for (let eachConsumer of eachSupplier.consumerQueue) {
            eachConsumer.newInMkt = false;
            if (!paired) {
                if (eachConsumer.bidPrice > eachSupplier.askPrice) {
                    dealPriceToday.push((eachConsumer.bidPrice + eachSupplier.askPrice) / 2);
                    // generate a new pair of prices
                    let [a, b] = pm.genPayableSellable(true);
                    eachConsumer.maxPayable = a;
                    eachConsumer.bidPrice = eachConsumer.initBidPrice();
                    eachSupplier.minSellable = b;
                    eachSupplier.askPrice = eachSupplier.initAskPrice();
                    paired = true;
                }
            }
        }
    }
    // record equilibrium and given costs/utility if any deal happened today 
    if (dealPriceToday.length > 0) {
        // givenPriceData.push([givenPriceData.length, pm.equilibrium]);
        marketEqData.push([marketEqData.length, pm.equilibrium, avg(dealPriceToday)]);
    }
    else {
        // givenPriceData.push([givenPriceData.length, pm.equilibrium]);
        if (typeof marketEqData[marketEqData.length - 1][1] == "number") {
            marketEqData.push([marketEqData.length, pm.equilibrium, marketEqData[marketEqData.length - 1][1]]);
        }
        else {
            marketEqData.push([marketEqData.length, pm.equilibrium, initialGivenPrice]);
        }
    }
    // clear the consumer queue of all supplier
    for (let eachSupplier of supplierList) {
        eachSupplier.consumerQueue = [];
    }
    // rebid and reask, prepare to go back to rest
    for (let eachConsumer of consumerList) {
        if (!eachConsumer.newInMkt) {
            eachConsumer.rebid();
            if (eachConsumer.dayToLive == 0) {
                // generate a new pair of prices
                let [a, b] = pm.genPayableSellable(false);
                eachConsumer.maxPayable = a;
                eachConsumer.bidPrice = eachConsumer.initBidPrice();
            }
        }
    }
    for (let eachSupplier of supplierList) {
        if (!eachSupplier.newInMkt) {
            eachSupplier.reask();
            if (eachSupplier.dayToLive == 0) {
                // generate a new pair of prices
                let [a, b] = pm.genPayableSellable(false);
                eachSupplier.minSellable = b;
                eachSupplier.askPrice = eachSupplier.initAskPrice();
            }
        }
    }
}
function applyPriceMachineChart(dataIn) {
    if (priceMachineChart != null) {
        google.charts.load('current', { 'packages': ["corechart"] });
        let options = {
            title: 'Cost/Utility Given',
            titleTextStyle: {
                fontSize: 16,
                bold: false,
                color: "#777"
            },
            curveType: 'none',
            width: priceMachineChart.offsetWidth - 1,
            height: priceMachineChart.offsetHeight - 1,
            legend: { position: 'none' },
        };
        google.charts.setOnLoadCallback(() => drawSimulatedChart(dataIn, options, "LineChart", priceMachineChart));
    }
}
function applyMarketEqChart(dataIn) {
    if (marketEqChart != null) {
        google.charts.load('current', { 'packages': ["corechart"] });
        let options = {
            title: 'Given Price vs. Market Equilibrium',
            titleTextStyle: {
                fontSize: 16,
                bold: false,
                color: "#777"
            },
            curveType: 'none',
            width: marketEqChart.offsetWidth,
            height: marketEqChart.offsetHeight,
        };
        google.charts.setOnLoadCallback(() => drawSimulatedChart(dataIn, options, "LineChart", marketEqChart));
    }
}
function drawSimulatedChart(dataIn, options, chartType, targetDiv) {
    let data = google.visualization.arrayToDataTable(dataIn);
    let chart = new google.visualization[chartType](targetDiv);
    chart.draw(data, options);
}
// applyPriceMachineChart(givenPriceData);
applyMarketEqChart(marketEqData);
