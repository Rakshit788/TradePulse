// scheduler.ts
import cron from "node-cron";
import { Server } from "socket.io";
import { KlineGenerator, broadcastOrderBookAndTrades } from "./helper";
import { prisma } from "../client";


export function startSchedulers(io: Server) {
  // Generate Kline every minute for all assets
  cron.schedule("* * * * *", async () => {
    const assets = await prisma.asset.findMany();
    for (const asset of assets) {
      await KlineGenerator(asset.id, io, new Date());
    }
  });

 
  cron.schedule("*/60 * * * * *", async () => {
    const assets = await prisma.asset.findMany();
    for (const asset of assets) {
      await broadcastOrderBookAndTrades(asset.id, io);
    }
  });

  console.log("Schedulers are running ");
}
