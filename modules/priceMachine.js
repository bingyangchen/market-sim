export class PriceMachine {
    constructor(initialEq) {
        this._numOfPairOut = 0;
        this._equilibrium = initialEq;
    }
    get numOfPairOut() {
        return this._numOfPairOut;
    }
    set numOfPairOut(num) {
        this._numOfPairOut = num;
    }
    get equilibrium() {
        return this._equilibrium;
    }
    normalSample(mu, std) {
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0)
            v = Math.random();
        return std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) + mu;
    }
    genPayableSellable(needCount) {
        if (this._numOfPairOut > 0 && this._numOfPairOut % 1 == 0) {
            // random walking equilibrium
            this._equilibrium *= this.normalSample(1, 0.033);
        }
        if (needCount) {
            this._numOfPairOut++;
        }
        return [this.normalSample(this._equilibrium, 0.25), this.normalSample(this._equilibrium, 0.25)];
    }
    genPayableSellableAssigned(targetPayable, targetSellable) {
        this._numOfPairOut++;
        return [this.normalSample(targetPayable, 0.25), this.normalSample(targetSellable, 0.25)];
    }
}
