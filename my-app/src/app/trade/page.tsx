"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useState , useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ListChecks,
} from "lucide-react";

import { getSocket } from "../lib/usesocket";



type Order = {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
};

type Trade = {
  id: string;
  price: number;
  qty: number;
  executedAt: string;
  side: 'buy' | 'sell';
};



export default function AssetPage() {
    const [currentPrice  , setcurrentPrice] =  useState(410)
  const [buyQty, setBuyQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellQty, setSellQty] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [priceChange, setpriceChange] =  useState(28)
  const [priceChangePercent, setpriceChangePercent] =  useState(7)
const [orderBook, setOrderBook] = useState<{
  bids: Order[];
  asks: Order[];
}>({
  bids: [],
  asks: [],
});

const [trades, setTrades] = useState<Trade[]>([]);

 const socket = getSocket()



  const assetId = "688a183635d58c7f9c6aa0b4";  

  useEffect(() => {
    socket.emit(
      "joinAssetRoom",
      JSON.stringify({ assetId })
    );
    socket.on(
        "price:update" ,  (data)=>{
            console.log(data)
        }
        
    )

    console.log(`Joining room for asset: ${assetId}`);

    
    socket.on("orderbook:update", (data) => {
      console.log("Orderbook update received:", data);
      setOrderBook(data.orderBook);
      setTrades(data.trades);
    });

    return () => {
      socket.off("orderbook:update");
    };
  }, [assetId]);

  

  
  

  const handleBuy = () => {
    console.log("Buy Order", { buyQty, buyPrice });
    setBuyQty("");
    setBuyPrice("");
  };

  const handleSell = () => {
    console.log("Sell Order", { sellQty, sellPrice });
    setSellQty("");
    setSellPrice("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">BTC/USD</h1>
              <p className="text-gray-400 text-sm">Bitcoin to US Dollar</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold">${currentPrice}</span>
              <div
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                  priceChange >= 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {priceChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  +${priceChange} ({priceChangePercent}%)
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-1">Last updated: 15:23 UTC</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Chart */}
          <div className="xl:col-span-3">
            <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center space-x-2">
                    <Activity className="w-6 h-6 text-blue-400" />
                    <span>Price Chart</span>
                  </h2>
                </div>
                <div className="bg-gray-950 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart>
                      <defs>
                        <linearGradient
                          id="priceGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "12px",
                        }}
                        labelStyle={{ color: "#f3f4f6" }}
                        formatter={(value: any) => [`$${value}`, "Price"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#priceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Place Order + Open Orders */}
          <Card className="bg-gray-900 border border-gray-800 rounded-2xl h-full">
            <CardContent className="p-6">
              <Tabs defaultValue="place">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="place">Place Order</TabsTrigger>
                  <TabsTrigger value="open">Open Orders</TabsTrigger>
                </TabsList>

                {/* Place Order */}
                <TabsContent value="place">
                  <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                    <span>Limit Order</span>
                  </h2>
                  <Tabs defaultValue="buy">
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="buy">Buy</TabsTrigger>
                      <TabsTrigger value="sell">Sell</TabsTrigger>
                    </TabsList>
                    <TabsContent value="buy">
                      <div className="space-y-4">
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={buyQty}
                          onChange={(e) => setBuyQty(e.target.value)}
                          className="bg-gray-800 border border-gray-700 text-white"
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={buyPrice}
                          onChange={(e) => setBuyPrice(e.target.value)}
                          className="bg-gray-800 border border-gray-700 text-white"
                        />
                        <Button
                          onClick={handleBuy}
                          className="w-full py-3 text-base font-semibold"
                          disabled={!buyQty || !buyPrice}
                        >
                          Place Buy Order
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="sell">
                      <div className="space-y-4">
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={sellQty}
                          onChange={(e) => setSellQty(e.target.value)}
                          className="bg-gray-800 border border-gray-700 text-white"
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          className="bg-gray-800 border border-gray-700 text-white"
                        />
                        <Button
                          onClick={handleSell}
                          className="w-full py-3 text-base font-semibold"
                          disabled={!sellQty || !sellPrice}
                        >
                          Place Sell Order
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Open Orders */}
                <TabsContent value="open">
                  <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <ListChecks className="w-5 h-5 text-yellow-400" />
                    <span>Open Limit Orders</span>
                  </h2>
                 <div className="space-y-2">
  <h3 className="text-lg font-semibold text-green-400">Bids</h3>
  {orderBook.bids.length === 0 && (
    <p className="text-gray-400 text-sm">No open buy orders.</p>
  )}
  {orderBook.bids.map((order) => (
    <div
      key={order.id}
      className="flex justify-between px-4 py-2 bg-green-500/10 rounded-md"
    >
      <span>Price: ${order.price}</span>
      <span>Qty: {order.quantity}</span>
    </div>
  ))}

  <h3 className="text-lg font-semibold text-red-400 mt-4">Asks</h3>
  {orderBook.asks.length === 0 && (
    <p className="text-gray-400 text-sm">No open sell orders.</p>
  )}
  {orderBook.asks.map((order) => (
    <div
      key={order.id}
      className="flex justify-between px-4 py-2 bg-red-500/10 rounded-md"
    >
      <span>Price: ${order.price}</span>
      <span>Qty: {order.quantity}</span>
    </div>
  ))}
</div>
                 
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Executed Trades */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <Clock className="w-6 h-6 text-blue-400" />
                <span>Executed Trades</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-gray-200">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2">Time</th>
                   
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="py-2">{trade.
                    executedAt}</td>
                      
                      <td className="py-2 text-right">${trade.price}</td>
                      <td className="py-2 text-right">{trade.qty}</td>
                      <td className="py-2 text-right"> {trade.price*trade.qty}</td>
                     
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
