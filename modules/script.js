import { Consumer, Supplier } from './individual.js';
import { PriceMachine } from './priceMachine.js';
const animationField = document.getElementById("animation-field");
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
let marketEqData = [["Day", "Given Price", "Equilibrium"]];
let consumerList = [];
let supplierList = [];
let numOfConsumer = 5;
let numOfSupplier = 5;
// initialize consumers and supplier
let nodeDivSize = 0;
if (animationField instanceof HTMLElement) {
    nodeDivSize = Math.min(animationField.offsetHeight, animationField.offsetWidth) / (numOfConsumer + numOfSupplier);
}
for (let i = 0; i < Math.max(numOfConsumer, numOfSupplier); i++) {
    let [a, b] = pm.genPayableSellable(false);
    if (i < numOfConsumer) {
        if (animationField instanceof HTMLElement) {
            let nodeDiv = document.createElement("div");
            nodeDiv.className = "node";
            nodeDiv.style.width = `${nodeDivSize}px`;
            nodeDiv.style.height = `${nodeDivSize}px`;
            animationField.appendChild(nodeDiv);
            let c = new Consumer(nodeDiv, a);
            c.move(Math.random() * (animationField.offsetWidth - nodeDiv.offsetWidth) + nodeDiv.offsetWidth / 2, Math.random() * (animationField.offsetHeight - nodeDiv.offsetHeight) + nodeDiv.offsetHeight / 2);
            consumerList.push(c);
        }
    }
    if (i < numOfSupplier) {
        if (animationField instanceof HTMLElement) {
            let nodeDiv = document.createElement("div");
            nodeDiv.className = "node";
            nodeDiv.style.width = `${nodeDivSize}px`;
            nodeDiv.style.height = `${nodeDivSize}px`;
            animationField.appendChild(nodeDiv);
            let s = new Supplier(nodeDiv, b);
            s.move(Math.random() * (animationField.offsetWidth - nodeDiv.offsetWidth) + nodeDiv.offsetWidth / 2, Math.random() * (animationField.offsetHeight - nodeDiv.offsetHeight) + nodeDiv.offsetHeight / 2);
            supplierList.push(s);
        }
    }
}
for (let i = 1; i <= 300; i++) {
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
        if (marketEqData.length == 1) {
            marketEqData.push([marketEqData.length, pm.equilibrium, initialGivenPrice]);
        }
        else {
            marketEqData.push([marketEqData.length, pm.equilibrium, marketEqData[marketEqData.length - 1][2]]);
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
applyMarketEqChart(marketEqData);
