export class Individual {
    constructor() {
    }
    public normalSample(mu: number, std: number, lower: boolean): number {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        let result = std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) + mu;
        if (lower) {
            return Math.abs(result) * -1;
        }
        return Math.abs(result);
    }
}
export class Consumer extends Individual {
    private _maxPayable: number;
    private _bidPrice: number;
    constructor(maxPayable: number) {
        super();
        this._maxPayable = maxPayable;
        this._bidPrice = this.initBidPrice();
    }
    public get maxPayable() {
        return this._maxPayable;
    }
    public get bidPrice() {
        return this._bidPrice;
    }
    public initBidPrice(): number {
        return this._maxPayable * Math.max(0, (1 + this.normalSample(0, 0.25, true)));
    }
    public rebid(): void {
        if (this._maxPayable - this._bidPrice > 0) {
            this._bidPrice += Math.min(this._maxPayable - this._bidPrice, (this._maxPayable - this._bidPrice) * this.normalSample(0, 0.5, false));
        }
    }
}
export class Supplier extends Individual {
    private _minSellable: number;
    constructor(minSellable: number) {
        super();
        this._minSellable = minSellable;
    }
    public get minSellable() {
        return this._minSellable;
    }
}