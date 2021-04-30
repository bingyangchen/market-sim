export class Individual {
    public divControlled: HTMLElement;
    private _newInMkt: boolean;
    private _dayToLive: number;
    private _aggressiveness: number;
    constructor(aDiv: HTMLElement) {
        this.divControlled = aDiv;
        this._newInMkt = true;
        this._dayToLive = 20;
        this._aggressiveness = 0;
    }
    public get newInMkt(): boolean {
        return this._newInMkt;
    }
    public set newInMkt(yes: boolean) {
        this._newInMkt = yes;
    }
    public get dayToLive(): number {
        return this._dayToLive;
    }
    public set dayToLive(day: number) {
        this._dayToLive = day;
    }
    public get aggressiveness(): number {
        return this._aggressiveness;
    }
    public set aggressiveness(aggr: number) {
        this._aggressiveness = aggr;
    }
    public move(xPos: number, yPos: number): void {
        this.divControlled.style.left = `${xPos - this.divControlled.offsetWidth / 2}px`;
        this.divControlled.style.top = `${yPos - this.divControlled.offsetHeight / 2}px`;
    }
    public oneTailNormalSample(mu: number, std: number, side: string): number {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        if (side == "left") {
            return Math.abs(std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) * -1 + mu;
        }
        return Math.abs(std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) + mu;
    }
}
export class Consumer extends Individual {
    private _maxPayable: number;
    private _bidPrice: number;
    constructor(aDiv: HTMLElement, maxPayable: number) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#4C8BF5";
        this._maxPayable = maxPayable;
        this._bidPrice = this.initBidPrice(false);
    }
    public get maxPayable(): number {
        return this._maxPayable;
    }
    public set maxPayable(maxPayable: number) {
        this._maxPayable = maxPayable;
    }
    public get bidPrice(): number {
        return this._bidPrice;
    }
    public set bidPrice(aPrice: number) {
        this._bidPrice = aPrice;
    }
    public initBidPrice(reborn: boolean): number {
        this.newInMkt = true;
        this.dayToLive = 20;
        if (!reborn) {
            this.aggressiveness = this.oneTailNormalSample(this.aggressiveness, 0.25, "right");
        } else {
            this.aggressiveness = 0;
        }
        return this._maxPayable * Math.max(0, (1 - this.aggressiveness));
    }
    public rebid(): void {
        this.dayToLive--;
        let delta = this._maxPayable - this._bidPrice;
        if (delta > 0) {
            this._bidPrice += Math.min(delta, delta * this.oneTailNormalSample(0, 0.5, "right"));
            this.aggressiveness = 1 - this._bidPrice / this._maxPayable;
        }
    }
}
export class Supplier extends Individual {
    private _minSellable: number;
    private _askPrice: number;
    private _consumerQueue: Consumer[];
    constructor(aDiv: HTMLElement, minSellable: number) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#DE5246";
        this._minSellable = minSellable;
        this._askPrice = this.initAskPrice(false);
        this._consumerQueue = [];
    }
    public get minSellable(): number {
        return this._minSellable;
    }
    public set minSellable(minSellable: number) {
        this._minSellable = minSellable;
    }
    public get askPrice(): number {
        return this._askPrice;
    }
    public set askPrice(aPrice: number) {
        this._askPrice = aPrice;
    }
    public get consumerQueue(): Consumer[] {
        return this._consumerQueue;
    }
    public set consumerQueue(anArray: Consumer[]) {
        this._consumerQueue = anArray;
    }
    public initAskPrice(reborn: boolean): number {
        this.newInMkt = true;
        this.dayToLive = 20;
        if (!reborn) {
            this.aggressiveness = this.oneTailNormalSample(this.aggressiveness, 0.25, "right");
        } else {
            this.aggressiveness = 0;
        }
        return this._minSellable * (1 + this.aggressiveness);
    }
    public reask(): void {
        this.dayToLive--;
        let delta = this._askPrice - this._minSellable;
        if (delta > 0) {
            this._askPrice -= Math.min(delta, delta * this.oneTailNormalSample(0, 0.5, "right"));
            this.aggressiveness = this._askPrice / this._minSellable - 1;
        }
    }
    public descendingQueueAConsumer(c: Consumer): void {
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