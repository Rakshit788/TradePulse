import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";



 async function PriceSimulation(assetId: string ,  time: Date ) {
    const asset = await prisma.asset.findUnique({
        where: { id: assetId }})

    if (!asset) {
        throw new Error(`Asset with ID ${assetId} not found`);
    }

    const trades  =  await  prisma.trade.findMany({
        where: { assetId: asset.id  , 
            executedAt: {
                gte: new Date(time.getTime() - 1.5*60*1000 ) 
                
            }
        },
        orderBy: { executedAt: 'asc' },
       })

    if (trades.length === 0) {
        throw new Error(`No trades found for asset ${assetId} in the last 1.5 minutes`);}

        const originalprice  =  trades[0].price;

     const prices =  trades.map(t => t.price);
     const volumes = trades.map(t => t.qty);
        const open = trades[0].price;   
        const close = trades[trades.length - 1].price;
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const volume = volumes.reduce((sum, vol) => sum + vol, 0);

        



}