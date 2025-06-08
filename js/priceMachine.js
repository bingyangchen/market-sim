import { MyMath } from "./myMath.js";
export class PriceMachine {
    constructor(initialEq) {
        this._equilibrium = initialEq;
    }
    genPayableSellable() {
        const a = Math.min(this._equilibrium * 2, Math.max(1, MyMath.normalSample(this._equilibrium, this._equilibrium / 2)));
        const b = Math.min(this._equilibrium * 2, Math.max(1, MyMath.normalSample(this._equilibrium, this._equilibrium / 2)));
        return [a, b];
    }
}
