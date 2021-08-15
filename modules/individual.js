import { MyMath } from "./myMath.js";
export class Individual {
    constructor(aDiv) {
        this.divControlled = aDiv;
        this._aggressiveness = MyMath.oneTailNormalSample(0, 0.25, "right");
        this._dealt = false;
    }
    get dealt() {
        return this._dealt;
    }
    set dealt(b) {
        this._dealt = b;
    }
    move(xPos, yPos) {
        this.divControlled.style.left = `${xPos - this.divControlled.offsetWidth / 2}px`;
        this.divControlled.style.top = `${yPos - this.divControlled.offsetHeight / 2}px`;
    }
    goToMarket(field) {
        const w = this.divControlled.offsetWidth;
        const h = this.divControlled.offsetHeight;
        const hPadding = 0.5 * this.divControlled.offsetWidth;
        const vPadding = 0.5 * this.divControlled.offsetHeight;
        const xPos = Math.random() * (field.offsetWidth - w - 2 * hPadding) + w / 2 + hPadding;
        const yPos = Math.random() * (field.offsetHeight - h - 2 * vPadding) + h / 2 + vPadding;
        this.move(xPos, yPos);
    }
    deal() {
        this._dealt = true;
        this._aggressiveness = Math.max(0.05, this._aggressiveness * 1.1);
    }
    faildToDeal() {
        this._aggressiveness *= 0.9;
    }
}
export class Consumer extends Individual {
    constructor(aDiv, maxPayable) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#4C8BF5";
        this._maxPayable = maxPayable;
        this._bidPrice = this.bid();
    }
    get maxPayable() {
        return this._maxPayable;
    }
    get bidPrice() {
        return this._bidPrice;
    }
    bid() {
        this._bidPrice = this._maxPayable * Math.max(0, (1 - this._aggressiveness));
        return this._bidPrice;
    }
    findSupplier(aSupplier) {
        const w = aSupplier.divControlled.offsetWidth;
        const h = aSupplier.divControlled.offsetHeight;
        const xPos = aSupplier.divControlled.offsetLeft - w + Math.random() * (2 + 1) * w;
        const yPos = aSupplier.divControlled.offsetTop - h + Math.random() * (2 + 1) * h;
        this.move(xPos, yPos);
    }
    goBack(field) {
        let w = this.divControlled.offsetWidth;
        let h = this.divControlled.offsetHeight;
        let hPadding = 0.5 * this.divControlled.offsetWidth;
        let vPadding = 0.5 * this.divControlled.offsetHeight;
        let xPos = (Math.random() * (field.offsetWidth - w - 2 * hPadding)) + (w / 2 + hPadding);
        let availableHeight = (field.offsetHeight - h - 2 * vPadding);
        let yPos = (Math.random() * availableHeight / 3) + (h / 2 + vPadding) + availableHeight * 2 / 3;
        this.move(xPos, yPos);
    }
}
export class Supplier extends Individual {
    constructor(aDiv, minSellable) {
        super(aDiv);
        this.divControlled.style.backgroundColor = "#DE5246";
        this._minSellable = minSellable;
        this._askPrice = this.ask();
    }
    get minSellable() {
        return this._minSellable;
    }
    get askPrice() {
        return this._askPrice;
    }
    ask() {
        this._askPrice = this._minSellable * (1 + this._aggressiveness);
        return this._askPrice;
    }
    decideWhetherToSell(c) {
        if (!this._dealt) {
            if (c.bidPrice >= this._askPrice)
                return "accept";
            return "tooLow";
        }
        return "noGoods";
    }
    goBack(field) {
        const w = this.divControlled.offsetWidth;
        const h = this.divControlled.offsetHeight;
        const hPadding = 0.5 * this.divControlled.offsetWidth;
        const vPadding = 0.5 * this.divControlled.offsetHeight;
        const xPos = Math.random() * (field.offsetWidth - w - 2 * hPadding) + (w / 2 + hPadding);
        const yPos = Math.random() * (field.offsetHeight - h - 2 * vPadding) / 3 + (h / 2 + vPadding);
        this.move(xPos, yPos);
    }
}
