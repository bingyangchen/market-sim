export class Individual {
    constructor(aDiv) {
        this.divControlled = aDiv;
        this._newInMkt = true;
        this._dayToLive = 20;
        this._aggressiveness = 0;
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
    get aggressiveness() {
        return this._aggressiveness;
    }
    set aggressiveness(aggr) {
        this._aggressiveness = aggr;
    }
    move(xPos, yPos) {
        this.divControlled.style.left = `${xPos - this.divControlled.offsetWidth / 2}px`;
        this.divControlled.style.top = `${yPos - this.divControlled.offsetHeight / 2}px`;
    }
    oneTailNormalSample(mu, std, side) {
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0)
            v = Math.random();
        if (side == "left") {
            return Math.abs(std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) * -1 + mu;
        }
        return Math.abs(std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) + mu;
    }
}
export class Consumer extends Individual {
    constructor(aDiv, maxPayable) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#4C8BF5";
        this._maxPayable = maxPayable;
        this._bidPrice = this.initBidPrice(false);
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
    initBidPrice(reborn) {
        this.newInMkt = true;
        this.dayToLive = 20;
        if (!reborn) {
            this.aggressiveness = this.oneTailNormalSample(this.aggressiveness, 0.25, "right");
        }
        else {
            this.aggressiveness = 0;
        }
        return this._maxPayable * Math.max(0, (1 - this.aggressiveness));
    }
    rebid() {
        this.dayToLive--;
        let delta = this._maxPayable - this._bidPrice;
        if (delta > 0) {
            this._bidPrice += Math.min(delta, delta * this.oneTailNormalSample(0, 0.5, "right"));
            this.aggressiveness = 1 - this._bidPrice / this._maxPayable;
        }
    }
}
export class Supplier extends Individual {
    constructor(aDiv, minSellable) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#DE5246";
        this._minSellable = minSellable;
        this._askPrice = this.initAskPrice(false);
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
    initAskPrice(reborn) {
        this.newInMkt = true;
        this.dayToLive = 20;
        if (!reborn) {
            this.aggressiveness = this.oneTailNormalSample(this.aggressiveness, 0.25, "right");
        }
        else {
            this.aggressiveness = 0;
        }
        return this._minSellable * (1 + this.aggressiveness);
    }
    reask() {
        this.dayToLive--;
        let delta = this._askPrice - this._minSellable;
        if (delta > 0) {
            this._askPrice -= Math.min(delta, delta * this.oneTailNormalSample(0, 0.5, "right"));
            this.aggressiveness = this._askPrice / this._minSellable - 1;
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
