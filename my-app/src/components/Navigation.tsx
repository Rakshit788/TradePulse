import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  initialPrice: number;
  currentPrice?: number;
  change24h?: number;
  volume?: number;
}

interface TradingCardProps {
  asset: Asset;
  onTrade?: (asset: Asset, action: 'buy' | 'sell') => void;
}

const TradingCard = ({ asset, onTrade }: TradingCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const currentPrice = asset.currentPrice || asset.initialPrice;
  const change24h = asset.change24h ?? (Math.random() - 0.5) * 10;
  const volume = asset.volume ?? Math.floor(Math.random() * 1000000);

  const isPositive = change24h >= 0;

  const handleTrade = async (action: 'buy' | 'sell') => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onTrade?.(asset, action);
    setIsLoading(false);
  };

  return (
    <Card className="group relative overflow-hidden rounded-xl bg-[#1a1a1a] text-white border border-gray-700 transition-all duration-300 hover:border-indigo-500 shadow-sm hover:shadow-xl">
      {/* Optional background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/5 to-pink-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{asset.symbol}</h3>
            <p className="text-sm text-gray-400">{asset.name}</p>
          </div>
          <Badge
            variant={isPositive ? "secondary" : "destructive"}
            className={`${isPositive ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'} border-none`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative pb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Price</span>
            <span className="text-2xl font-mono font-bold text-white">
              ${currentPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-sm text-gray-300">24h Volume</span>
            <span className="font-medium text-gray-200">
              ${volume.toLocaleString()}
            </span>
          </div>

          {/* Price chart placeholder */}
          <div className="h-16 w-full bg-gray-800 rounded-lg flex items-end justify-between px-2 py-1 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => {
              const height = Math.random() * 70 + 10; // more visibility
              const isUp = Math.random() > 0.5;
              return (
                <div
                  key={i}
                  className={`w-[2px] rounded-sm ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative pt-0">
        <div className="flex w-full space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none"
            onClick={() => handleTrade('buy')}
            disabled={isLoading}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Buy
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
            onClick={() => handleTrade('sell')}
            disabled={isLoading}
          >
            <TrendingDown className="h-4 w-4 mr-1" />
            Sell
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TradingCard;
