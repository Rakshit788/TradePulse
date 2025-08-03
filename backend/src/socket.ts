import { Server } from "socket.io";
import { prisma } from "./client";
import { matchForAsset } from "./engine/matching";
import { OrderPlacePayload, OrderCancelPayload , Portfolio ,  assetIdReq} from "./lib/types";
import { broadcastOrderBookAndTrades, SendUserPortFolio , getCurrentMarketPrice } from "./lib/helper";


export function setupSocket(io: Server) {
    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);
        
        socket.on("authenticate", async (data) => {
            
             const d  = JSON.parse(data) 
             const userId   =  d.userId

            
            if(userId){
                socket.join(`user:${userId}`);
                console.log(`User ${userId} joined their room`);
                await SendUserPortFolio({userId, io})
            }
        })

        socket.on("place:orders", async (data: OrderPlacePayload) => {
            let parsed  : OrderPlacePayload 
            parsed =  JSON.parse(data as any)
            const { userId, assetId, qty, price, side, status } = parsed;
            console.log("Place order request received", data);
           

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

                 await  matchForAsset(assetId)
                 await SendUserPortFolio({userId, io})
                 
                   


                console.log("Order placed", order.id);
                socket.emit("order:placed:confirmation", order);
                io.emit("order:placed", order);

            } catch (error) {
                console.error("Error placing order", error);
                socket.emit("error", { message: "Error placing order" });
            }
        });

   socket.on("joinAssetRoom", async (data : assetIdReq) => {
    const d  =  JSON.parse(data as any)
    const assetId  =  d.assetId 

  socket.join(`asset:${assetId}`);
  console.log(assetId);
  


  try {
    await broadcastOrderBookAndTrades(assetId, io);
      console.log(`User joined asset room: asset:${assetId}`);
  } catch (error) {
    console.error("Failed to send initial orderbook and trades:", error);
  }
})


       
    socket.on("disconnect", () => {
            console.log(" Client disconnected", socket.id);
        });
    });
}








