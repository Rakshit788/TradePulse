import { prisma } from "../client";
import { Server } from "socket.io";
import { Portfolio } from "./types";
import { startOfMinute, subMinutes } from "date-fns";
import { FirsttimeReward } from "./types";








export  async  function SendUserPortFolio(data : {userId : string ,  io: Server}){
    const {userId ,  io} =  data  ; 
    console.log(userId);
  try {
      
    const user  =  await prisma.user.findUnique({
        where : {id : userId}

    })

    if(!user) return 

    const portfolioItems  =  await prisma.portfolioItem.findMany({
        where : {userId: userId }
    })

    const ValidItems =  [] 

    for(const item of portfolioItems){
        if(item.qty && item.qty>0){
            ValidItems.push(item)
        }
    }

    let totalassetValue  = 0 ; 

   const assets  =  await Promise.all(
     ValidItems.map(async(item) =>{
        const asset  =  await prisma.asset.findUnique({
            where : {id: item.assetId}
        })

             if (!asset || !item.qty || item.qty <= 0) return null;

             const buytrades  =  await prisma.trade.findMany({
                where : {buyerId: userId  ,  assetId: item.assetId}
             })


             const totalBoughtvalue  =  buytrades.reduce((sum , trade) => sum + (trade.qty * trade.price) , 0) 
             const totalBoughtQty = buytrades.reduce((sum, trade) => sum + trade.qty, 0);
            const averagePrice = totalBoughtQty > 0 ? totalBoughtvalue / totalBoughtQty : 0;

                const currentPrice = await getCurrentMarketPrice(item.assetId);
                const currentValue =  currentPrice* item.qty ;
                const totalReturn = currentValue - (item.qty * averagePrice);
                const totalReturnPercentage = averagePrice > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;

                totalassetValue += currentValue;

                return {
                    assetId: item.assetId,
                    assetName: asset.name,
                    assetSymbol: asset.symbol,
                    quantity: item.qty,
                    averagePrice,
                    currentValue,
                    totalReturn,
                    totalReturnPercentage
                };

     }) )


       const validAssets = assets.filter(asset => asset !== null);

        const portfolio: Portfolio = {
            userId,
            cashBalance: user.cashBalance ?? user.balance,
            balance: user.balance,
            assets: validAssets,
            totalValue: (user.cashBalance ?? user.balance) + totalassetValue
        };

        // Send to specific user only
        io.to(`user:${userId}`).emit("portfolio:update", portfolio);
    
  } catch (error) {
    console.log(error)
  }
    
    
 
}




export async function getCurrentMarketPrice(assetId: string, io?: Server): Promise<number> {
  try {
    // 1. Last trade price
    const latestTrade = await prisma.trade.findFirst({
      where: { assetId },
      orderBy: { executedAt: "desc" },
    });

    if (latestTrade) {
      io?.to(`asset:${assetId}`).emit("price:update", {
        assetId,
        price: latestTrade.price,
        source: "trade",
      });
      return latestTrade.price;
    }

    // 2. Mid-price from best bid and best ask
    const [bestBid, bestAsk] = await Promise.all([
      prisma.limitOrder.findFirst({
        where: { assetId, side: "buy", status: "open" },
        orderBy: { price: "desc" },
      }),
      prisma.limitOrder.findFirst({
        where: { assetId, side: "sell", status: "open" },
        orderBy: { price: "asc" },
      }),
    ]);

    const bestBidprice = bestBid?.price ?? 0;
    const bestaskprice = bestAsk?.price ?? 0;

    if (bestBidprice > 0 && bestaskprice > 0) {
      const actualprice = (bestBidprice + bestaskprice) / 2;
      io?.to(`asset:${assetId}`).emit("price:update", {
        assetId,
        price: actualprice,
        source: "orderbook",
      });
      return actualprice;
    }

    // 3. Initial fallback
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });

    if (asset) {
      io?.to(`asset:${assetId}`).emit("price:update", {
        assetId,
        price: asset.initialPrice,
        source: "initial",
      });
      return asset.initialPrice;
    }

    return 0;
  } catch (error) {
    console.error("Error fetching market price:", error);
    return 0;
  }
}



 
 export  async function broadcastOrderBookAndTrades(assetId: string, io: Server) {
    try {
        const buyOrders = await prisma.limitOrder.findMany({
            where: { assetId, status: 'open', side: 'buy' },
            orderBy: { price: 'desc' },
            take: 20
        });

        const sellOrders = await prisma.limitOrder.findMany({
            where: { assetId, status: 'open', side: 'sell' },
            orderBy: { price: 'asc' },
            take: 20
        });

        const trades  =  await  prisma.trade.findMany({
            where: {assetId: assetId} , 
            orderBy : {executedAt : 'desc'} , 
            take: 20
        })


        io.to(`asset:${assetId}`).emit("orderbook:update", {
            assetId,
            orderBook: {
                bids: buyOrders,
                asks: sellOrders
            } , 
            trades: trades
        });
    } catch (error) {
        console.error("Error broadcasting order book:", error);
    }
}


export async function KlineGenerator(assetId: string, io: Server, timestamp: Date) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    console.error("Asset not found:", assetId);
    return;
  }

  
  const interval = "1h";
  const endtime = startOfMinute(timestamp);
  const startTime = subMinutes(endtime, 60);

  const trades = await prisma.trade.findMany({
    where: {
      assetId: assetId,
      executedAt: { gte: startTime, lt: endtime },
    },
    orderBy: { executedAt: "asc" },
  });

  if (trades.length === 0) {
    console.warn("No trades found for asset:", assetId);
    return;
  }

  const prices = trades.map(t => t.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const open = trades[0].price;
  const close = trades[trades.length - 1].price;
  const volume = trades.reduce((sum, t) => sum + t.qty, 0);

  await prisma.kline.upsert({
    where: {
      assetId_interval_startTime: {
        assetId: assetId,
        interval: interval,
        startTime: startTime,
      },
    },
    update: {
      open,
      close,
      high,
      low,
      volume,
      endTime: endtime,
    },
    create: {
      assetId: assetId,
      interval: interval,
      startTime: startTime,
      endTime: endtime,
      open,
      close,
      high,
      low,
      volume,
    },
  });

  io.to(`asset:${assetId}`).emit("kline:update", {
    assetId,
    interval,
    startTime,
    endtime,
    open,
    close,
    high,
    low,
    volume,
  });

  console.log(` Kline generated for ${assetId} at ${startTime.toISOString()}`);
}





export async function  firsttimeTreward(data: FirsttimeReward[], userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      console.error(" User not found:", userId);
      return;
    }

    if (user.claimedStarterPack) {
      console.warn(" User has already claimed the starter pack");
      return;
    }

    const totalQty = data.reduce((sum, item) => sum + item.qty, 0);
    if (totalQty !== 100) {
      console.error(" Total quantity must be exactly 100. Provided:", totalQty);
      return;
    }

    for (const reward of data) {
      const { assetId, qty } = reward;

      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      if (!asset) {
        console.error(" Asset not found:", assetId);
        continue;
      }

      const existingItem = await prisma.portfolioItem.findUnique({
        where: { userId_assetId: { userId, assetId } },
      });

      if (existingItem) {
        await prisma.portfolioItem.update({
          where: { userId_assetId: { userId, assetId } },
          data: { qty: existingItem.qty + qty },
        });
      } else {
        await prisma.portfolioItem.create({
          data: { userId, assetId, qty },
        });
      }
    }

    
    await prisma.user.update({
      where: { id: userId },
      data: { claimedStarterPack: true },
    });

    console.log("Starter pack successfully claimed!");

  } catch (error) {
    console.error(" Error processing first time function:", error);
  }
}










