import { Server } from "socket.io";
import { prisma } from "./client";

export type OrderPlacePayload = {
    userId: string;
    assetId: string;
    qty: number;
    price: number;
    side: "buy" | "sell";
    status: "open" | "filled" | "cancelled";
};

export type OrderCancelPayload = {
    orderId: string;
    userId: string;
};

export function setupSocket(io: Server) {
    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        socket.on("place:orders", async (data: OrderPlacePayload) => {
            const { userId, assetId, qty, price, side, status } = data;
            if (!userId || !assetId || qty <= 0 || price <= 0 || !side || !["open", "filled", "cancelled"].includes(status)) {
                console.error(" Invalid order data", data);
                socket.emit("error", { message: "Invalid order data" });
                return;
            }

            try {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    console.error(" User not found", userId);
                    socket.emit("error", { message: "User not found" });
                    return;
                }

                const asset = await prisma.asset.findUnique({ where: { id: assetId } });
                if (!asset) {
                    console.error(" Asset not found", assetId);
                    socket.emit("error", { message: "Asset not found" });
                    return;
                }

                const order = await prisma.limitOrder.create({
                    data: { userId, assetId, qty, price, side, status, createdAt: new Date() },
                });

                console.log("Order placed", order.id);
                socket.emit("order:placed:confirmation", order);
                io.emit("order:placed", order);

            } catch (error) {
                console.error("Error placing order", error);
                socket.emit("error", { message: "Error placing order" });
            }
        });

        socket.on("cancel:orders", async (data: OrderCancelPayload) => {
            const { orderId, userId } = data;
            if (!orderId || !userId) {
                console.error("Invalid cancel order data", data);
                socket.emit("error", { message: "Invalid cancel order data" });
                return;
            }

            try {
                const order = await prisma.limitOrder.findUnique({ where: { id: orderId } });
                if (!order) {
                    console.error("Order not found", orderId);
                    socket.emit("error", { message: "Order not found" });
                    return;
                }
                if (order.userId !== userId) {
                    console.error("User does not own this order", userId, orderId);
                    socket.emit("error", { message: "You do not own this order" });
                    return;
                }
                if (order.status !== "open") {
                    console.error(" Cannot cancel non-open order", orderId);
                    socket.emit("error", { message: "Order already executed or cancelled" });
                    return;
                }

                const updatedOrder = await prisma.limitOrder.update({
                    where: { id: orderId },
                    data: { status: "cancelled" },
                });

                console.log("Order cancelled", updatedOrder.id);
                socket.emit("order:cancelled:confirmation", updatedOrder);
                io.emit("order:cancelled", updatedOrder);

            } catch (error) {
                console.error(" Error cancelling order", error);
                socket.emit("error", { message: "Error cancelling order" });
            }
        });

        socket.on("disconnect", () => {
            console.log("🔌 Client disconnected", socket.id);
        });
    });
}
