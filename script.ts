import { Consumer } from './dot.js';
let c: Consumer = new Consumer(10);
console.log(c.maxPayable);
console.log(c.bidPrice);
c.rebid();
console.log(c.bidPrice);
c.rebid();
console.log(c.bidPrice);