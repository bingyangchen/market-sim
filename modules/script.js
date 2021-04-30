import { Consumer, Supplier } from './individual.js';
import { PriceMachine } from './priceMachine.js';
const animationField = document.getElementById("animation-field");
const marketEqChart = document.getElementById("market-eq-chart");
const surplusChart = document.getElementById("surplus-chart");
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
let initialEq = 100;
let pm = new PriceMachine(initialEq);
let marketEqData = [["Day", "Given Price", "Equilibrium"]];
let consumerList = [];
let supplierList = [];
let numOfConsumer = 25;
let numOfSupplier = 25;
let consumerSurplus = 0;
let producerSurplus = 0;
let currentDay = 1;
let nodeDivSize = 0;
// decide the size of each node
if (animationField instanceof HTMLElement) {
    nodeDivSize = Math.min(animationField.offsetHeight, animationField.offsetWidth) / (numOfConsumer + numOfSupplier);
}
// initialize all consumers and supplier
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
function simulate(maxDay) {
    // suffle consumer list and supplier list before matching them together
    consumerList = suffleArray(consumerList);
    supplierList = suffleArray(supplierList);
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
                    let dealPrice = (eachConsumer.bidPrice + eachSupplier.askPrice) / 2;
                    dealPriceToday.push(dealPrice);
                    consumerSurplus += (eachConsumer.maxPayable - dealPrice);
                    producerSurplus += (dealPrice - eachSupplier.minSellable);
                    // generate a new pair of prices
                    let [a, b] = pm.genPayableSellable(true);
                    eachConsumer.maxPayable = a;
                    eachConsumer.bidPrice = eachConsumer.initBidPrice(false);
                    eachSupplier.minSellable = b;
                    eachSupplier.askPrice = eachSupplier.initAskPrice(false);
                    paired = true;
                }
            }
        }
    }
    // record equilibrium and given-costs/utility if any deal happened today 
    if (dealPriceToday.length > 0) {
        // givenPriceData.push([givenPriceData.length, pm.equilibrium]);
        marketEqData.push([marketEqData.length, pm.equilibrium, avg(dealPriceToday)]);
    }
    else {
        // givenPriceData.push([givenPriceData.length, pm.equilibrium]);
        if (marketEqData.length == 1) {
            marketEqData.push([marketEqData.length, pm.equilibrium, initialEq]);
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
                // die and reborn
                let [a, b] = pm.genPayableSellable(false);
                eachConsumer.maxPayable = a;
                eachConsumer.bidPrice = eachConsumer.initBidPrice(true);
            }
        }
    }
    for (let eachSupplier of supplierList) {
        if (!eachSupplier.newInMkt) {
            eachSupplier.reask();
            if (eachSupplier.dayToLive == 0) {
                // die and reborn
                let [a, b] = pm.genPayableSellable(false);
                eachSupplier.minSellable = b;
                eachSupplier.askPrice = eachSupplier.initAskPrice(true);
            }
        }
    }
    if (currentDay <= maxDay) {
        currentDay++;
        applyMarketEqChart(marketEqData);
        applySuplusChart(consumerSurplus, producerSurplus);
        setTimeout(() => { simulate(maxDay); }, 10);
    }
}
simulate(150);
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
function applySuplusChart(consumerSurplus, producerSurplus) {
    if (surplusChart != null) {
        google.charts.load('current', { 'packages': ['corechart', 'bar'] });
        let dataIn = [
            ["Surplus", "Value", { role: "style" }],
            ["Consumer Surplus", consumerSurplus, "#4C8BF5"],
            ["Market Value", producerSurplus, "#DE5246"],
        ];
        let options = {
            title: 'Surplus',
            titleTextStyle: {
                fontSize: 14,
                bold: true,
                color: "#000"
            },
            vAxis: {
                minValue: 0,
                maxValue: 200
            },
            bar: { groupWidth: "40%" },
            width: surplusChart.offsetWidth,
            height: surplusChart.offsetHeight,
            legend: { position: "none" }
        };
        google.charts.setOnLoadCallback(() => drawSimulatedChart(dataIn, options, "ColumnChart", surplusChart));
    }
}
function drawSimulatedChart(dataIn, options, chartType, targetDiv) {
    let data = google.visualization.arrayToDataTable(dataIn);
    let chart = new google.visualization[chartType](targetDiv);
    chart.draw(data, options);
}
