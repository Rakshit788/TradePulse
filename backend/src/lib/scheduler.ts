// scheduler.ts
import cron from "node-cron";
import { Server } from "socket.io";
import { KlineGenerator, broadcastOrderBookAndTrades ,  getCurrentMarketPrice } from "./helper";
import { prisma } from "../client";


export function startSchedulers(io: Server) {
  // Generate Kline every minute for all assets
  cron.schedule("* * * * *", async () => {
    console.log(io.sockets.adapter.rooms);
    
    console.log("Generating Kline for all assets...");
    
    const assets = await prisma.asset.findMany();
    for (const asset of assets) {
      await KlineGenerator(asset.id, io, new Date());
    }
  });

 
  cron.schedule("*/30 * * * * *", async () => {
    const assets = await prisma.asset.findMany();
    for (const asset of assets) {
      await broadcastOrderBookAndTrades(asset.id, io);
    }
  });


  cron.schedule("*/30 * * * * *", async () => {
    const assets = await prisma.asset.findMany();
    for (const asset of assets) {
      await getCurrentMarketPrice(asset.id, io);
    }
  });
  console.log("Schedulers are running ");
}
