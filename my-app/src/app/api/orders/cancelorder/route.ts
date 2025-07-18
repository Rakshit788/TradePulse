import { NextRequest ,  NextResponse } from "next/server"; 
import { prisma } from "@/app/lib/prisma";


export  async  function POST(req : NextRequest){
    const {oid , userid } =  await  req.json() ; 
    if(!oid || !userid){
        return NextResponse.json({message: "provide all details" ,  status:400}) ; 
    }

     const order = await prisma.limitOrder.findUnique({
            where: { id: oid },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found." },
                { status: 404 }
            );

              if (order?.userId !== userid) {
            return NextResponse.json(
                { error: "You are not authorized to cancel this order." },
                { status: 403 }
            );

              if (order?.status !== "open") {
            return NextResponse.json(
                { error: "Only open orders can be cancelled." },
                { status: 400 }
            );
        }

        // Cancel the order
        const cancelledOrder = await prisma.limitOrder.update({
            where: { id: oid },
            data: { status: "cancelled" },
        });

        return NextResponse.json(
            { message: "Order cancelled successfully.", order: cancelledOrder },
            { status: 200 }
        );
        }
        }
    try {
        
    } catch (error) {
         console.error("[cancel_ORDER_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 })
    }
}