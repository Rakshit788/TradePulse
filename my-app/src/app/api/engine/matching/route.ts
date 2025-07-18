import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const buyOrders = await prisma.limitOrder.findMany({
            where: { status: "open", side: "buy" },
            orderBy: { price: "desc" },
        });

        const sellOrders = await prisma.limitOrder.findMany({
            where: { status: "open", side: "sell" },
            orderBy: { price: "asc" },
        });

        let matches = [];

        for (const buy of buyOrders) {
            if (buy.status !== "open" || buy.qty === 0) continue;

            for (const sell of sellOrders) {
                if (sell.status !== "open" || sell.qty === 0) continue;

                if (
                    buy.assetId === sell.assetId &&
                    buy.price >= sell.price
                ) {
                    const matchQty = Math.min(buy.qty, sell.qty);

                    // Create the trade
                    const trade = await prisma.trade.create({
                        data: {
                            qty: matchQty,
                            price: sell.price,
                            buyerId: buy.userId,
                            sellerId: sell.userId,
                            assetId: buy.assetId,
                        },
                    });

                    matches.push(trade);

                    // Update buyer order
                    const remainingBuyQty = buy.qty - matchQty;
                    await prisma.limitOrder.update({
                        where: { id: buy.id },
                        data: {
                            qty: remainingBuyQty,
                            status: remainingBuyQty === 0 ? "executed" : "open",
                            executedAt: remainingBuyQty === 0 ? new Date() : null,
                        },
                    });

                    // Update seller order
                    const remainingSellQty = sell.qty - matchQty;
                    await prisma.limitOrder.update({
                        where: { id: sell.id },
                        data: {
                            qty: remainingSellQty,
                            status: remainingSellQty === 0 ? "executed" : "open",
                            executedAt: remainingSellQty === 0 ? new Date() : null,
                        },
                    });

                    // Update local quantities for subsequent iterations
                    buy.qty = remainingBuyQty;
                    sell.qty = remainingSellQty;

                    // Update buyer portfolio
                    const buyerPortfolio = await prisma.portfolioItem.findFirst({
                        where: { userId: trade.buyerId, assetId: trade.assetId },
                    });

                    if (buyerPortfolio) {
                        const newQty = buyerPortfolio.qty + trade.qty;
                        const newAvgPrice =
                            ((buyerPortfolio.qty * buyerPortfolio.avgBuyPrice) + (trade.qty * trade.price)) / newQty;

                        await prisma.portfolioItem.update({
                            where: { id: buyerPortfolio.id },
                            data: { qty: newQty, avgBuyPrice: newAvgPrice },
                        });
                    } else {
                        await prisma.portfolioItem.create({
                            data: {
                                userId: trade.buyerId,
                                assetId: trade.assetId,
                                qty: trade.qty,
                                avgBuyPrice: trade.price,
                            },
                        });
                    }

                    // Update seller portfolio
                    const sellerPortfolio = await prisma.portfolioItem.findFirst({
                        where: { userId: trade.sellerId, assetId: trade.assetId },
                    });

                    if (sellerPortfolio) {
                        const newQty = sellerPortfolio.qty - trade.qty;
                        await prisma.portfolioItem.update({
                            where: { id: sellerPortfolio.id },
                            data: { qty: newQty },
                        });
                    }

                    // If the buy order is fully executed, break inner loop to move to next buy order
                    if (buy.qty === 0) break;
                }
            }
        }

        return NextResponse.json({
            message: "Matching engine run completed",
            tradesExecuted: matches.length,
            trades: matches,
        });

    } catch (error) {
        console.error("[MATCHING_ENGINE_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
