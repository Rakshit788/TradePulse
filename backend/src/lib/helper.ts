import { prisma } from "../client";
import { Server } from "socket.io";
import { Portfolio } from "./types";
import { it } from "node:test";






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


             const totalBoughtvalue  =  buytrades.reduce((sum , trade) => sum + (trade.qty + trade.price) , 0) 
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


 
 export  async function broadcastOrderBook(assetId: string, io: Server) {
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

        io.to(`asset:${assetId}`).emit("orderbook:update", {
            assetId,
            orderBook: {
                bids: buyOrders,
                asks: sellOrders
            }
        });
    } catch (error) {
        console.error("Error broadcasting order book:", error);
    }
}







