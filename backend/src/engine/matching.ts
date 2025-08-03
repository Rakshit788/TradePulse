import { prisma } from "../client";

export async function matchForAsset(assetId: string) {
    try {
        const buyOrders = await prisma.limitOrder.findMany({
            where: { status: "open", side: "buy", assetId },
            orderBy: [{ price: "desc" }, { createdAt: "asc" }],
        });
         console.log(`buy orders for ${assetId}`, buyOrders);
         
        const sellOrders = await prisma.limitOrder.findMany({
            where: { status: "open", side: "sell", assetId },
            orderBy: [{ price: "asc" }, { createdAt: "asc" }],
        });
        console.log(`sell orders for ${assetId}`, sellOrders);


        let trades = [];

        for (const buy of buyOrders) {
            for (const sell of sellOrders) {
                if (buy.price >= sell.price && buy.qty > 0 && sell.qty > 0) {
                    if (buy.userId === sell.userId) {
                        continue;
                    }

                    console.log(`Matching buy order ${buy.id} with sell order ${sell.id}`);
                    

                    const qty = Math.min(buy.qty, sell.qty);
                    const tradePrice = sell.price;
                    const totalCost = qty * tradePrice;

                    // Fetch buyer, seller, sellerPortfolio
                    const [buyer, seller, sellerPortfolio] = await prisma.$transaction([
                        prisma.user.findUnique({ where: { id: buy.userId } }),
                        prisma.user.findUnique({ where: { id: sell.userId } }),
                        prisma.portfolioItem.findUnique({
                            where: { userId_assetId: { userId: sell.userId, assetId } },
                        }),
                    ]);
                    console.log(`Buyer: ${buyer?.id}, Seller: ${seller?.id}, Portfolio: ${sellerPortfolio?.qty}`);


                    if (!buyer || !seller || !sellerPortfolio || sellerPortfolio.qty < qty) {
                        console.error("Buyer, seller, or seller's portfolio invalid");
                        continue;
                    }

                    if ((buyer.cashBalance ) < totalCost) {
                        console.error("Buyer has insufficient funds");
                        continue;
                    }
                    console.log(`Executing trade for ${qty} units at ${tradePrice} each`);

                    
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
                        console.log(`Trade created: ${trade}`);

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
                                cashBalance: (buyer.cashBalance ) - totalCost,
                            },
                        });

                        await tx.user.update({
                            where: { id: seller.id },
                            data: {
                                cashBalance: (seller.cashBalance ) + totalCost,
                            },
                        });

                        await tx.portfolioItem.upsert({
                            where: { userId_assetId: { userId: buyer.id, assetId } },
                            create: { userId: buyer.id, assetId, qty },
                            update: { qty: { increment: qty } },
                        });
                        console.log(`Portfolio updated for buyer ${buyer.id} with qty ${qty}`);
                        

                        await tx.portfolioItem.update({
                            where: { userId_assetId: { userId: seller.id, assetId } },
                            data: { qty: { decrement: qty } },
                        });
                    });
                    console.log(`Trade executed for ${qty} units at ${tradePrice} each`);

                }
            }
        }

    } catch (error) {
        console.error(`Error in matchForAsset for ${assetId}`, error);
    }
}
