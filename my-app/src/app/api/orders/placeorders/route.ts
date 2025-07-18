// app/api/place-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // Ensure you have a Prisma client wrapper

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { qty, price, side, userId, assetId } = body;

        // Basic validation
        if (!qty || !price || !side || !userId || !assetId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if asset exists
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Create the LimitOrder
        const order = await prisma.limitOrder.create({
            data: {
                qty: parseFloat(qty),
                price: parseFloat(price),
                side,
                status: "open",
                userId,
                assetId,
            },
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("[PLACE_ORDER_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
