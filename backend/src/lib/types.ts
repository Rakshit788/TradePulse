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


export type Portfolio = {
    userId: string;
    cashBalance: number;
    balance: number;
    assets: Array<{
        assetId: string;
        assetName: string;
        assetSymbol: string;
        quantity: number;
        averagePrice: number;
        currentValue: number;
        totalReturn: number;
        totalReturnPercentage: number;
    }>;
    totalValue: number;
};


export type FirsttimeReward = {
    assetId: string;
    qty: number;
}


export type assetIdReq = {
    assetId : string
}