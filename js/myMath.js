export class MyMath {
    static suffleArray(anArray) {
        for (let i = anArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = anArray[i];
            anArray[i] = anArray[j];
            anArray[j] = temp;
        }
        return anArray;
    }
    static avg(arr) {
        if (arr.length === 0)
            return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    static mid(arr) {
        if (arr.length === 0)
            return 0;
        arr.sort((a, b) => b - a);
        return arr[Math.floor((arr.length - 1) / 2)];
    }
    static normalSample(mu, std) {
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random();
        while (v === 0)
            v = Math.random();
        return std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) + mu;
    }
    static oneTailNormalSample(mu, std, side) {
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random();
        while (v === 0)
            v = Math.random();
        if (side === "left") {
            return (Math.abs(std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) *
                -1 +
                mu);
        }
        return (Math.abs(std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) + mu);
    }
}
