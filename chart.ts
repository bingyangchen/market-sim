export class MyGoogleChart {
    protected _chartDiv: HTMLElement;
    protected _chartType: string;
    protected _chart: any;
    public constructor(chartDiv: HTMLElement) {
        this._chartDiv = chartDiv;
        this._chartType = "";
    }
}

export class MarketEqChart extends MyGoogleChart {
    public constructor(chartDiv: HTMLElement) {
        super(chartDiv);
        this._chartType = "LineChart";
        google.charts.load('current', { 'packages': ["corechart"] });
        google.charts.setOnLoadCallback(() => {
            this._chart = new google.visualization[this._chartType](chartDiv);
        });
    }
    public drawChart(dataIn: any[][]): void {
        if (google.visualization !== undefined && this._chart !== undefined) {
            let data = google.visualization.arrayToDataTable(dataIn);
            let option = {
                // title: 'Given Price vs. Market Equilibrium',
                // titleTextStyle: {
                //     fontSize: 16,
                //     bold: false,
                //     color: "#777"
                // },
                curveType: 'none',
                width: this._chartDiv.offsetWidth,
                height: this._chartDiv.offsetHeight,
                chartArea: { left: "10%", top: "5%", width: '70%', height: '80%' }
            };
            this._chart.draw(data, option);
        } else setTimeout(() => this.drawChart(dataIn), 50);
    }
}
export class DSCurveChart extends MyGoogleChart {
    public constructor(chartDiv: HTMLElement) {
        super(chartDiv);
        this._chartType = "LineChart";
        google.charts.load('current', { 'packages': ["corechart"] });
        google.charts.setOnLoadCallback(() => {
            this._chart = new google.visualization[this._chartType](chartDiv);
        });
    }
    public drawChart(dataIn: any[][], initialEq: number): void {
        if (google.visualization !== undefined && this._chart !== undefined) {
            let data = google.visualization.arrayToDataTable(dataIn);
            let option = {
                curveType: 'none',
                width: this._chartDiv.offsetWidth,
                height: this._chartDiv.offsetHeight,
                vAxis: {
                    title: 'P',
                    viewWindow: {
                        max: initialEq * 2,
                        min: initialEq * 0
                    }
                },
                hAxis: { title: 'Q' },
                chartArea: { left: "10%", top: "5%", width: '75%', height: '80%' }
            };
            this._chart.draw(data, option);
        } else setTimeout(() => this.drawChart(dataIn, initialEq), 50);
    }
}
export class SurplusChart extends MyGoogleChart {
    public constructor(chartDiv: HTMLElement) {
        super(chartDiv);
        this._chartType = "ColumnChart";
        google.charts.load('current', { 'packages': ['corechart', 'bar'] });
        google.charts.setOnLoadCallback(() => {
            this._chart = new google.visualization[this._chartType](chartDiv);
        });
    }
    public drawChart(consumerSurplus: number, producerSurplus: number): void {
        if (google.visualization !== undefined && this._chart !== undefined) {
            let dataIn = [
                ["Surplus", "Value", { role: "style" }],
                ["Consumer Surplus", consumerSurplus, "#4C8BF5"],
                ["Producer Surplus", producerSurplus, "#DE5246"],
            ];
            let data = google.visualization.arrayToDataTable(dataIn);
            let option = {
                vAxis: {
                    minValue: 0,
                    maxValue: 30
                },
                bar: { groupWidth: "40%" },
                width: this._chartDiv.offsetWidth,
                height: this._chartDiv.offsetHeight,
                legend: { position: "none" },
                chartArea: { left: "10%", top: "5%", width: '80%', height: '85%' }
            };
            this._chart.draw(data, option);
        } else setTimeout(() => this.drawChart(consumerSurplus, producerSurplus), 50);
    }
}