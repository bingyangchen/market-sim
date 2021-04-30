import { Consumer, Supplier } from './individual.js';
import { PriceMachine } from './priceMachine.js';

const animationField = document.getElementById("animation-field");
const marketEqChart = document.getElementById("market-eq-chart");
const surplusChart = document.getElementById("surplus-chart");

function suffleArray(anArray: any[]): any[] {
    for (let i = anArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = anArray[i];
        anArray[i] = anArray[j];
        anArray[j] = temp;
    }
    return anArray;
}

function avg(arr: number[]): number {
    return arr.reduce((prev: number, curr: number) => prev + curr, 0) / arr.length;
}

let initialEq: number = 100;
let pm: PriceMachine = new PriceMachine(initialEq);
let marketEqData: (number | string)[][] = [["Day", "Given Price", "Equilibrium"]];
let consumerList: Consumer[] = [];
let supplierList: Supplier[] = [];
let numOfConsumer: number = 10;
let numOfSupplier: number = 10;
let consumerSurplus: number = 0;
let producerSurplus: number = 0;

let currentDay: number = 1;

let nodeDivSize: number = 0;
// decide the size of each node
if (animationField instanceof HTMLElement) {
    nodeDivSize = Math.min(animationField.offsetHeight, animationField.offsetWidth) / (numOfConsumer + numOfSupplier);
}

let pauseTime: number = 1000;

// initialize all consumers and supplier
for (let i = 0; i < Math.max(numOfConsumer, numOfSupplier); i++) {
    let [a, b] = pm.genPayableSellable(false);
    if (i < numOfConsumer) {
        if (animationField instanceof HTMLElement) {
            let nodeDiv = document.createElement("div");
            nodeDiv.className = "node";
            nodeDiv.style.width = `${nodeDivSize}px`;
            nodeDiv.style.height = `${nodeDivSize}px`;
            nodeDiv.style.transitionDuration = `${pauseTime / 2}ms`;
            animationField.appendChild(nodeDiv);
            let c: Consumer = new Consumer(nodeDiv, a);
            consumerList.push(c);
        }
    }
    if (i < numOfSupplier) {
        if (animationField instanceof HTMLElement) {
            let nodeDiv = document.createElement("div");
            nodeDiv.className = "node";
            nodeDiv.style.width = `${nodeDivSize}px`;
            nodeDiv.style.height = `${nodeDivSize}px`;
            nodeDiv.style.transitionDuration = `${pauseTime / 2}ms`;
            animationField.appendChild(nodeDiv);
            let s: Supplier = new Supplier(nodeDiv, b);
            supplierList.push(s);
        }

    }
}

function simulate(maxDay: number, pauseTime: number) {
    if (animationField != null) {
        // suffle consumer list and supplier list before matching them together
        consumerList = suffleArray(consumerList);
        supplierList = suffleArray(supplierList);

        // matching each consumer to each supplier
        for (let i = 0; i < consumerList.length; i++) {
            supplierList[i % supplierList.length].descendingQueueAConsumer(consumerList[i]);
            setTimeout(() => { consumerList[i].move(supplierList[i % supplierList.length].divControlled.offsetLeft, supplierList[i % supplierList.length].divControlled.offsetTop); }, pauseTime / 2)
        }

        let dealPriceToday: number[] = [];
        // check if deal
        for (let eachSupplier of supplierList) {
            eachSupplier.newInMkt = false;
            let paired: boolean = false;
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
        } else {
            // givenPriceData.push([givenPriceData.length, pm.equilibrium]);
            if (marketEqData.length == 1) {
                marketEqData.push([marketEqData.length, pm.equilibrium, initialEq]);
            } else {
                marketEqData.push([marketEqData.length, pm.equilibrium, marketEqData[marketEqData.length - 1][2]]);
            }
        }

        // clear the consumer queue of all supplier
        for (let eachSupplier of supplierList) {
            eachSupplier.consumerQueue = [];
        }

        // go back to rest and rebid/reask 
        for (let eachConsumer of consumerList) {
            const xPos = Math.random() * (animationField.offsetWidth - eachConsumer.divControlled.offsetWidth) + eachConsumer.divControlled.offsetWidth / 2;
            const yPos = Math.random() * (animationField.offsetHeight - eachConsumer.divControlled.offsetHeight) + eachConsumer.divControlled.offsetHeight / 2;
            eachConsumer.move(xPos, yPos);
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
            const xPos = Math.random() * (animationField.offsetWidth - eachSupplier.divControlled.offsetWidth) + eachSupplier.divControlled.offsetWidth / 2;
            const yPos = Math.random() * (animationField.offsetHeight - eachSupplier.divControlled.offsetHeight) + eachSupplier.divControlled.offsetHeight / 2;
            eachSupplier.move(xPos, yPos);
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
            setTimeout(() => { simulate(maxDay, pauseTime) }, pauseTime);
        }
    }
}

simulate(50, pauseTime);

function applyMarketEqChart(dataIn: (string | number)[][]): void {
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

function applySuplusChart(consumerSurplus: number, producerSurplus: number): void {
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
                maxValue: 30
            },
            bar: { groupWidth: "40%" },
            width: surplusChart.offsetWidth,
            height: surplusChart.offsetHeight,
            legend: { position: "none" }
        };
        google.charts.setOnLoadCallback(() => drawSimulatedChart(dataIn, options, "ColumnChart", surplusChart));
    }
}

function drawSimulatedChart(dataIn: any[][], options: any, chartType: string, targetDiv: HTMLElement | null): void {
    let data = google.visualization.arrayToDataTable(dataIn);
    let chart = new google.visualization[chartType](targetDiv);
    chart.draw(data, options);
}