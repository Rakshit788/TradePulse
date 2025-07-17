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
  onTrade?: (asset: Asset, action: "buy" | "sell") => void;
}

const TradingCard = ({ asset, onTrade }: TradingCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const currentPrice = asset.currentPrice || asset.initialPrice;
  const change24h = asset.change24h ?? 0;
  const volume = asset.volume ?? Math.floor(Math.random() * 1_000_000);

  const isPositive = change24h >= 0;

  const handleTrade = async (action: "buy" | "sell") => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onTrade?.(asset, action);
    setIsLoading(false);
  };

  return (
    <Card className="group relative overflow-hidden border border-border/30 backdrop-blur-md bg-white/5 hover:shadow-xl hover:border-primary/40 transition-all duration-300 rounded-2xl">
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-wide text-white">{asset.symbol}</h3>
            <p className="text-sm text-muted-foreground">{asset.name}</p>
          </div>
          <Badge
            variant={isPositive ? "secondary" : "destructive"}
            className={`border-none ${
              isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? "+" : ""}
            {change24h.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">Price</span>
            <span className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">24h Volume</span>
            <span className="font-medium text-foreground">${volume.toLocaleString()}</span>
          </div>

          {/* Animated Chart */}
          <div className="h-16 w-full  rounded-lg flex items-end justify-between p-1 overflow-hidden bg-transparent">
            {Array.from({ length: 30 }).map((_, i) => {
              const height = Math.random() * 80 + 10;
              const isUp = Math.random() > 0.5;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-sm animate-pulse duration-1000 ${
                    isUp ? "bg-green-400/80" : "bg-red-400/80"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-green-600/80 text-white border-none hover:bg-green-500"
            onClick={() => handleTrade("buy")}
            disabled={isLoading}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Buy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 bg-red-600/80 text-white hover:bg-red-500"
            onClick={() => handleTrade("sell")}
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
