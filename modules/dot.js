export class Individual {
    constructor() {
    }
    normalSample(mu, std, lower) {
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0)
            v = Math.random();
        let result = std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) + mu;
        if (lower) {
            return Math.abs(result) * -1;
        }
        return Math.abs(result);
    }
}
export class Consumer extends Individual {
    constructor(maxPayable) {
        super();
        this._maxPayable = maxPayable;
        this._bidPrice = this.initBidPrice();
    }
    get maxPayable() {
        return this._maxPayable;
    }
    get bidPrice() {
        return this._bidPrice;
    }
    initBidPrice() {
        return this._maxPayable * Math.max(0, (1 + this.normalSample(0, 0.25, true)));
    }
    rebid() {
        if (this._maxPayable - this._bidPrice > 0) {
            this._bidPrice += Math.min(this._maxPayable - this._bidPrice, (this._maxPayable - this._bidPrice) * this.normalSample(0, 0.5, false));
        }
    }
}
export class Supplier extends Individual {
    constructor(minSellable) {
        super();
        this._minSellable = minSellable;
    }
    get minSellable() {
        return this._minSellable;
    }
}
