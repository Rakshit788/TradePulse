import { prisma } from "../client";
import { Server } from "socket.io";
import { Portfolio } from "./types";
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



export async function  getCurrentMarketPrice(assetId : string) : Promise<number>{
   
  try {
      const latesttrade  =  await prisma.trade.findFirst({
          where : {assetId : assetId} ,
          orderBy : {executedAt : "desc"}
      })
  
        if (latesttrade) {
              return latesttrade.price;
          }
  
            const latestOrder = await prisma.limitOrder.findFirst({
              where: { assetId, status: 'open' },
              orderBy: { createdAt: 'desc' }
          });
  
          if (latestOrder) {
              return latestOrder.price;
          }
  
          // Fallback to asset initial price
          const asset = await prisma.asset.findUnique({ where: { id: assetId } });
         if(asset)  return asset?.initialPrice 

         return 0 ;

        
  
  
  } catch (error) {
    console.log("error of getting asset value" ,  error ) 
    return 0 ; 
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




export async function firsttimeFunction(data: FirsttimeReward[], userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      console.error(" User not found:", userId);
      return;
    }

    if (user.claimedStarterPack) {
      console.warn("⚠️ User has already claimed the starter pack");
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







