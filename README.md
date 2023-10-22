# MarketSim

This project trys to simulate the transactions happeneing in the market. You can see how the market organize itself, that is, run into equilibrium, and the difference of consumer surplus and producer surplus under different situations.

## Mechanism Descriptions

* We have a preset fair value, and each consumer and each supplier get their *max willingness to pay* / *min willingness to sell* from a normal distribution whose mean is the preset fair value.

* Upon receiving the *max willingness to pay*, the consumer will then choose an *bid price* that falls at somewhere below the *max willingness to pay*. The *bid price* is determined by both the *max willingness to pay* and the *aggressiveness*. The more aggressive the consumer is, the bigger will the gap between the *max willingness to pay* and the *bid price*.

* On the other hand, upon receiving the *min willingness to sell*, the supplier will then choose an *ask price* that falls at somewhere above the *min willingness to sell*. The *ask price* is, similarly, determined by both the *min willingness to sell* and the *aggressiveness*. The more aggressive the consumer is, the bigger will the gap between the *min willingness to sell* and the *ask price*.

* After deciding the bis/ask price, all the consumers and suppliers then go to the market. We randomly match each consumer to each supplier. However, it's not truely random because we will try to let each supplier confront the same amount of consumers. That is, we assume that the consumer won't choose a supplier that already has lots of consumers in front of it if there is some other suppliers with less consumers. So, for example, if there is 10 consumers and 2 suppliers in the market, it will end up with each supplier having 5 consumers in front.

* The matching stage is divided into two phases. The first phase was described above, and if some comsumers didn't make deal, they will enter the second phase, in which they can go to find another supplier that also didn't make deal in the first phase. However, it's not guarantee that thes individuals will make deal in the second phase.

* If a supplier or a consumer fail to deal after the two matching phases, it will become less aggressive. In contrast, if a consumer or a supplier keep making deal, it will become more aggressive. The *agggressiveness* is reflected when that consumer/supplier bid/ask a price.

* You can arbitrarily choose two numbers as the amount of consumers and suppliers, and furthermore check if the consumer surplus and producer surplus differ over each combination of amounts. You will hopefully acquire such conclusion that says if consumers is more than suppliers, the producer surplus will be higher than the consumer surplus; and if suppliers is more than consumers, the consumer surplus will be higher than the producer surplus. We can explain this phenomenon as that: the more "competitive" it is between consumers, the less surplus will each of them end up acquiring, and same story for suppliers.

## Questions You Might Have

1. Why is the final equillibrium quantity less than where the demand Ccrve and the supply curve actually cross?

* It's because that we let the consumers randomly find the suppliers, and each comsumer only has two chances to find a supplier willing to sell, so some *possible* matching result may not realize.
