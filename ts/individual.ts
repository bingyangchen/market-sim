import { MyMath } from "./myMath.js";
export class Individual {
    public divControlled: HTMLElement;
    protected _aggressiveness: number;
    protected _dealt: boolean;
    constructor(aDiv: HTMLElement) {
        this.divControlled = aDiv;
        this._aggressiveness = MyMath.oneTailNormalSample(0, 0.25, "right");
        this._dealt = false;
    }
    public get dealt(): boolean {
        return this._dealt;
    }
    public set dealt(b: boolean) {
        this._dealt = b;
    }
    public move(xPos: number, yPos: number): void {
        this.divControlled.style.left = `${
            xPos - this.divControlled.offsetWidth / 2
        }px`;
        this.divControlled.style.top = `${
            yPos - this.divControlled.offsetHeight / 2
        }px`;
    }
    public goToMarket(field: HTMLElement): void {
        const w = this.divControlled.offsetWidth;
        const h = this.divControlled.offsetHeight;
        const hPadding = 0.5 * this.divControlled.offsetWidth;
        const vPadding = 0.5 * this.divControlled.offsetHeight;
        const xPos =
            Math.random() * (field.offsetWidth - w - 2 * hPadding) +
            w / 2 +
            hPadding;
        const yPos =
            Math.random() * (field.offsetHeight - h - 2 * vPadding) +
            h / 2 +
            vPadding;
        this.move(xPos, yPos);
    }
    public deal(): void {
        this._dealt = true;
        this._aggressiveness = Math.max(0.05, this._aggressiveness * 1.1);
    }
    public faildToDeal(): void {
        this._aggressiveness *= 0.9;
    }
}
export class Consumer extends Individual {
    private _maxPayable: number;
    private _bidPrice: number;
    constructor(aDiv: HTMLElement, maxPayable: number) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#4C8BF5";
        this._maxPayable = maxPayable;
        this._bidPrice = this.bid();
    }
    public get maxPayable(): number {
        return this._maxPayable;
    }
    public get bidPrice(): number {
        return this._bidPrice;
    }
    public bid(): number {
        this._bidPrice =
            this._maxPayable * Math.max(0, 1 - this._aggressiveness);
        return this._bidPrice;
    }
    public findSupplier(aSupplier: Supplier): void {
        const w = aSupplier.divControlled.offsetWidth;
        const h = aSupplier.divControlled.offsetHeight;
        const xPos =
            aSupplier.divControlled.offsetLeft -
            w +
            Math.random() * (2 + 1) * w;
        const yPos =
            aSupplier.divControlled.offsetTop - h + Math.random() * (2 + 1) * h;
        this.move(xPos, yPos);
    }
    public goBack(field: HTMLElement): void {
        let w = this.divControlled.offsetWidth;
        let h = this.divControlled.offsetHeight;
        let hPadding = 0.5 * this.divControlled.offsetWidth;
        let vPadding = 0.5 * this.divControlled.offsetHeight;
        let xPos =
            Math.random() * (field.offsetWidth - w - 2 * hPadding) +
            (w / 2 + hPadding);
        let availableHeight = field.offsetHeight - h - 2 * vPadding;
        let yPos =
            (Math.random() * availableHeight) / 3 +
            (h / 2 + vPadding) +
            (availableHeight * 2) / 3;
        this.move(xPos, yPos);
    }
}
export class Supplier extends Individual {
    private _minSellable: number;
    private _askPrice: number;
    constructor(aDiv: HTMLElement, minSellable: number) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#DE5246";
        this._minSellable = minSellable;
        this._askPrice = this.ask();
    }
    public get minSellable(): number {
        return this._minSellable;
    }
    public get askPrice(): number {
        return this._askPrice;
    }
    public ask(): number {
        this._askPrice = this._minSellable * (1 + this._aggressiveness);
        return this._askPrice;
    }
    public decideWhetherToSell(c: Consumer): "accept" | "tooLow" | "noGoods" {
        if (!this._dealt) {
            if (c.bidPrice >= this._askPrice) return "accept";
            return "tooLow";
        }
        return "noGoods";
    }
    public goBack(field: HTMLElement): void {
        const w = this.divControlled.offsetWidth;
        const h = this.divControlled.offsetHeight;
        const hPadding = 0.5 * this.divControlled.offsetWidth;
        const vPadding = 0.5 * this.divControlled.offsetHeight;
        const xPos =
            Math.random() * (field.offsetWidth - w - 2 * hPadding) +
            (w / 2 + hPadding);
        const yPos =
            (Math.random() * (field.offsetHeight - h - 2 * vPadding)) / 3 +
            (h / 2 + vPadding);
        this.move(xPos, yPos);
    }
}
