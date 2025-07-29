import { prisma } from "../client";

export async function matchForAsset(assetId: string) {
    try {

        let buyOrders =  [] ;
        let sellOrders =  [] ;

      await  Promise.all([
        buyOrders =  await prisma.limitOrder.findMany({
            where: { status: "open", side: "buy", assetId },
            orderBy: [{ price: "desc" }, { createdAt: "asc" }],

        }) , 
        sellOrders = await prisma.limitOrder.findMany({
            where: { status: "open", side: "sell", assetId },
            orderBy: [{ price: "asc" }, { createdAt: "asc" }],
        })
      ])


        let trades = [];

        let i = 0   ,  j  = 0 ;
     while (i < buyOrders.length && j < sellOrders.length) {
    const buy = buyOrders[i];
    const sell = sellOrders[j];

    if (buy.price >= sell.price && buy.qty > 0 && sell.qty > 0) {
        if (buy.userId === sell.userId) {
            j++;
            continue;
        }

        const qty = Math.min(buy.qty, sell.qty);
        const tradePrice = sell.price;
        const totalCost = qty * tradePrice;

        const [buyer, seller, sellerPortfolio] = await prisma.$transaction([
            prisma.user.findUnique({ where: { id: buy.userId } }),
            prisma.user.findUnique({ where: { id: sell.userId } }),
            prisma.portfolioItem.findUnique({
                where: { userId_assetId: { userId: sell.userId, assetId } },
            }),
        ]);

        if (!buyer || !seller || !sellerPortfolio || sellerPortfolio.qty < qty) {
            console.error("Invalid buyer, seller, or seller portfolio");
            j++;
            continue;
        }

        if ((buyer.cashBalance ?? buyer.balance) < totalCost) {
            console.error("Buyer has insufficient funds");
            i++;
            continue;
        }

        await prisma.$transaction(async (tx) => {
            const trade = await tx.trade.create({
                data: {
                    qty,
                    price: tradePrice,
                    buyerId: buy.userId,
                    sellerId: sell.userId,
                    assetId,
                },
            });
            trades.push(trade);

            await tx.limitOrder.update({
                where: { id: buy.id },
                data: {
                    qty: buy.qty - qty,
                    status: buy.qty - qty === 0 ? "filled" : "open",
                },
            });

            await tx.limitOrder.update({
                where: { id: sell.id },
                data: {
                    qty: sell.qty - qty,
                    status: sell.qty - qty === 0 ? "filled" : "open",
                },
            });

            await tx.user.update({
                where: { id: buyer.id },
                data: {
                    cashBalance: (buyer.cashBalance ?? buyer.balance) - totalCost,
                },
            });

            await tx.user.update({
                where: { id: seller.id },
                data: {
                    cashBalance: (seller.cashBalance ?? seller.balance) + totalCost,
                },
            });

            await tx.portfolioItem.upsert({
                where: { userId_assetId: { userId: buyer.id, assetId } },
                create: { userId: buyer.id, assetId, qty },
                update: { qty: { increment: qty } },
            });

            await tx.portfolioItem.update({
                where: { userId_assetId: { userId: seller.id, assetId } },
                data: { qty: { decrement: qty } },
            });
        });

        // Update local copy to reflect remaining quantity
        buy.qty -= qty;
        sell.qty -= qty;

        if (buy.qty === 0) i++;
        if (sell.qty === 0) j++;
    } else {
        j++; // No match, try next sell order
    }
}
    } catch (error) {
        console.error(`Error in matchForAsset for ${assetId}`, error);
    }
}
