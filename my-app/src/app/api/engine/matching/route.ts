// app/api/match/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * POST /api/match
 * Runs your matching engine
 */
export async function POST(req: NextRequest) {
    const lockAcquired = await acquireMatchingLock();

    if (!lockAcquired) {
        return NextResponse.json({ error: "Matching engine is already running" }, { status: 409 });
    }

    try {
        const matches = await runMatchingEngine();
        return NextResponse.json({
            message: "Matching engine completed",
            tradesExecuted: matches.length,
            trades: matches,
        });
    } catch (error) {
        console.error("[MATCHING_ENGINE_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        await releaseMatchingLock();
    }
}

async function runMatchingEngine() {
    const matches = [];

    // Get distinct assets with open orders
    const assets = await prisma.limitOrder.findMany({
        where: { status: "open", qty: { gt: 0 } },
        distinct: ["assetId"],
        select: { assetId: true },
    });

    for (const { assetId } of assets) {
        const assetMatches = await matchOrdersForAsset(assetId);
        matches.push(...assetMatches);
    }

    return matches;
}

async function matchOrdersForAsset(assetId: string) {
    return await prisma.$transaction(async (tx) => {
        const buyOrders = await tx.limitOrder.findMany({
            where: { status: "open", side: "buy", assetId, qty: { gt: 0 } },
            orderBy: [{ price: "desc" }, { createdAt: "asc" }],
        });

        const sellOrders = await tx.limitOrder.findMany({
            where: { status: "open", side: "sell", assetId, qty: { gt: 0 } },
            orderBy: [{ price: "asc" }, { createdAt: "asc" }],
        });

        const matches = [];

        for (const buy of buyOrders) {
            let remainingBuyQty = buy.qty;

            for (const sell of sellOrders) {
                let remainingSellQty = sell.qty;

                if (remainingBuyQty <= 0) break;
                if (remainingSellQty <= 0) continue;

                if (buy.price >= sell.price) {
                    const matchQty = Math.min(remainingBuyQty, remainingSellQty);
                    const tradePrice = sell.price;
                    const tradeValue = tradePrice * matchQty;

                    // Check balances
                    const buyer = await tx.user.findUnique({ where: { id: buy.userId } });
                    const sellerPortfolio = await tx.portfolioItem.findFirst({
                        where: { userId: sell.userId, assetId },
                    });

                    if (!buyer || buyer.balance < tradeValue) {
                        console.log(`Skipping: Buyer ${buy.userId} insufficient funds`);
                        continue;
                    }

                    if (!sellerPortfolio || sellerPortfolio.qty < matchQty) {
                        console.log(`Skipping: Seller ${sell.userId} insufficient asset`);
                        continue;
                    }

                    // Create trade
                    const trade = await tx.trade.create({
                        data: {
                            qty: matchQty,
                            price: tradePrice,
                            assetId,
                            buyerId: buy.userId,
                            sellerId: sell.userId,
                        },
                    });
                    matches.push(trade);

                    // Update orders
                    remainingBuyQty -= matchQty;
                    remainingSellQty -= matchQty;

                    await tx.limitOrder.update({
                        where: { id: buy.id },
                        data: {
                            qty: remainingBuyQty,
                            status: remainingBuyQty === 0 ? "executed" : "open",
                            executedAt: remainingBuyQty === 0 ? new Date() : null,
                        },
                    });

                    await tx.limitOrder.update({
                        where: { id: sell.id },
                        data: {
                            qty: remainingSellQty,
                            status: remainingSellQty === 0 ? "executed" : "open",
                            executedAt: remainingSellQty === 0 ? new Date() : null,
                        },
                    });

                    // Update buyer's portfolio
                    const buyerPortfolio = await tx.portfolioItem.findFirst({
                        where: { userId: buy.userId, assetId },
                    });

                    if (buyerPortfolio) {
                        const newQty = buyerPortfolio.qty + matchQty;
                        const newAvgPrice = ((buyerPortfolio.avgBuyPrice * buyerPortfolio.qty) + (matchQty * tradePrice)) / newQty;
                        await tx.portfolioItem.update({
                            where: { id: buyerPortfolio.id },
                            data: { qty: newQty, avgBuyPrice: newAvgPrice },
                        });
                    } else {
                        await tx.portfolioItem.create({
                            data: {
                                userId: buy.userId,
                                assetId,
                                qty: matchQty,
                                avgBuyPrice: tradePrice,
                            },
                        });
                    }

                    // Update seller's portfolio
                    await tx.portfolioItem.update({
                        where: { id: sellerPortfolio.id },
                        data: { qty: sellerPortfolio.qty - matchQty },
                    });

                    // Transfer cash
                    await tx.user.update({
                        where: { id: buy.userId },
                        data: { balance: { decrement: tradeValue } },
                    });

                    await tx.user.update({
                        where: { id: sell.userId },
                        data: { balance: { increment: tradeValue } },
                    });
                }
            }
        }

        return matches;
    });
}

// Lock acquisition
async function acquireMatchingLock(): Promise<boolean> {
    try {
        const expiresAt = new Date(Date.now() + 60_000); // 1 min lock
        const now = new Date();

        await prisma.matchingLock.upsert({
            where: { id: "matching_engine_lock" },
            update: { acquiredAt: now, expiresAt },
            create: { id: "matching_engine_lock", acquiredAt: now, expiresAt },
        });

        const lock = await prisma.matchingLock.findUnique({ where: { id: "matching_engine_lock" } });
        if (!lock || !lock.expiresAt) {
            return false;
        }
        return lock.expiresAt > now;
    } catch (e) {
        console.error("Lock acquisition error:", e);
        return false;
    }
}


// Lock release
async function releaseMatchingLock() {
    try {
        await prisma.matchingLock.delete({ where: { id: "matching_engine_lock" } });
    } catch (e) {
        console.log("Lock release error (likely already expired):", e);
    }
}
