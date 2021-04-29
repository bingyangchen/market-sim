export class Individual {
    constructor() {
        this._newInMkt = true;
        this._dayToLive = 20;
    }
    get newInMkt() {
        return this._newInMkt;
    }
    set newInMkt(yes) {
        this._newInMkt = yes;
    }
    get dayToLive() {
        return this._dayToLive;
    }
    set dayToLive(day) {
        this._dayToLive = day;
    }
    oneTailNormalSample(mu, std, lower) {
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
    set maxPayable(maxPayable) {
        this._maxPayable = maxPayable;
    }
    get bidPrice() {
        return this._bidPrice;
    }
    set bidPrice(aPrice) {
        this._bidPrice = aPrice;
    }
    initBidPrice() {
        this.newInMkt = true;
        this.dayToLive = 20;
        return this._maxPayable * Math.max(0, (1 + this.oneTailNormalSample(0, 0.25, true)));
    }
    rebid() {
        this.dayToLive--;
        let delta = this._maxPayable - this._bidPrice;
        if (delta > 0) {
            this._bidPrice += Math.min(delta, delta * this.oneTailNormalSample(0, 0.5, false));
        }
    }
}
export class Supplier extends Individual {
    constructor(minSellable) {
        super();
        this._minSellable = minSellable;
        this._askPrice = this.initAskPrice();
        this._consumerQueue = [];
    }
    get minSellable() {
        return this._minSellable;
    }
    set minSellable(minSellable) {
        this._minSellable = minSellable;
    }
    get askPrice() {
        return this._askPrice;
    }
    set askPrice(aPrice) {
        this._askPrice = aPrice;
    }
    get consumerQueue() {
        return this._consumerQueue;
    }
    set consumerQueue(anArray) {
        this._consumerQueue = anArray;
    }
    initAskPrice() {
        this.newInMkt = true;
        this.dayToLive = 20;
        return this._minSellable * (1 + this.oneTailNormalSample(0, 0.25, false));
    }
    reask() {
        this.dayToLive--;
        let delta = this._askPrice - this._minSellable;
        if (delta > 0) {
            this._askPrice -= Math.min(delta, delta * this.oneTailNormalSample(0, 0.5, false));
        }
    }
    descendingQueueAConsumer(c) {
        // consumer with higher bid price will be put former
        let i = 0;
        while (i < this._consumerQueue.length) {
            if (c.bidPrice > this._consumerQueue[i].bidPrice) {
                break;
            }
            i++;
        }
        this._consumerQueue.splice(i, 0, c);
    }
}
