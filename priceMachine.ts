import { MyMath } from "./myMath.js";
export class PriceMachine {
    private _equilibrium: number;
    constructor(initialEq: number) {
        this._equilibrium = initialEq;
    }
    public genPayableSellable(): [number, number] {
        const a = Math.max(1, MyMath.normalSample(this._equilibrium, this._equilibrium / 2));
        const b = Math.max(1, MyMath.normalSample(this._equilibrium, this._equilibrium / 2));
        return [a, b];
    }
}