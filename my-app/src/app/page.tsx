"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TradingCard from "@/components/Tradingcard";
import {
  TrendingUp,
  Zap,
  Trophy,
  Shield,
  ArrowRight,
  Users,
  DollarSign,
} from "lucide-react";

import { useSession, signIn } from "next-auth/react";
import Navbar from "../../Navbar"; // adjust this path if needed

const mockAssets = [
  { id: "1", symbol: "BTC", name: "Bitcoin", initialPrice: 45230.5, currentPrice: 46100.25, change24h: 1.92, volume: 28500000 },
  { id: "2", symbol: "ETH", name: "Ethereum", initialPrice: 3245.8, currentPrice: 3198.45, change24h: -1.46, volume: 15200000 },
  { id: "3", symbol: "AAPL", name: "Apple Inc.", initialPrice: 178.25, currentPrice: 180.45, change24h: 1.23, volume: 85600000 },
  { id: "4", symbol: "TSLA", name: "Tesla Inc.", initialPrice: 248.5, currentPrice: 245.8, change24h: -1.09, volume: 42300000 },
  { id: "5", symbol: "GOOGL", name: "Alphabet Inc.", initialPrice: 142.65, currentPrice: 145.2, change24h: 1.79, volume: 28900000 },
  { id: "6", symbol: "AMZN", name: "Amazon.com Inc.", initialPrice: 145.3, currentPrice: 148.75, change24h: 2.37, volume: 31200000 },
];

const Landing = () => {
  const [assets, setAssets] = useState(mockAssets);
  const { data: session } = useSession();

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prev) =>
        prev.map((a) => ({
          ...a,
          currentPrice: a.currentPrice + (Math.random() - 0.5) * 5,
          change24h: a.change24h + (Math.random() - 0.5) * 0.5,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTrade = (asset: any, action: "buy" | "sell") => {
    console.log(`${action.toUpperCase()} ${asset.symbol}`);
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Execute trades in milliseconds with our advanced infrastructure.",
      color: "text-yellow-400",
    },
    {
      icon: Trophy,
      title: "AI Competition",
      description: "Challenge our sophisticated AI trading bots and climb the ranks.",
      color: "text-indigo-400",
    },
    {
      icon: Shield,
      title: "Risk-Free Practice",
      description: "Learn and practice with virtual money. No real financial risk.",
      color: "text-green-400",
    },
    {
      icon: Users,
      title: "Global Leaderboard",
      description: "Compete with traders worldwide and showcase your skills.",
      color: "text-pink-400",
    },
  ];

  const stats = [
    { label: "Active Traders", value: "50K+", icon: Users },
    { label: "Daily Volume", value: "$2.5B", icon: DollarSign },
    { label: "Success Rate", value: "94%", icon: TrendingUp },
    { label: "Assets Available", value: "500+", icon: Trophy },
  ];

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#0f0f0f] text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0f0f0f] to-black opacity-80" />

          <div className="relative container mx-auto px-4 py-20 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-indigo-700/10 text-indigo-400 border border-indigo-500/30 px-4 py-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                #1 Virtual Trading Platform
              </Badge>

              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent leading-tight">
                Master Trading with <br /> TradePulse AI
              </h1>

              <p className="text-xl lg:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Practice trading, compete with AI, and climb the global leaderboard.
                All risk-free with real market data.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                {session ? (
                  <Link href="/dashboard">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" size="lg">
                      Go to Dashboard <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    size="lg"
                    onClick={() => signIn()}
                  >
                    Start Trading Now <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                )}

                <Link href="/leaderboard">
                  <Button variant="outline" size="lg" className="border-gray-600 text-white">
                    <Trophy className="h-5 w-5 mr-2" />
                    View Leaderboard
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
                    <div className="text-2xl lg:text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-[#121212]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Why Choose TradePulse?</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Advanced features designed for both beginners and experienced traders
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-[#1a1a1a] border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-lg"
                >
                  <feature.icon className={`h-12 w-12 mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Assets */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Trade Popular Assets</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Practice with real market data across crypto, stocks, and commodities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {assets.map((asset) => (
                <TradingCard key={asset.id} asset={asset} onTrade={handleTrade} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" size="lg">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View All Assets
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-[#1e1e1e] to-[#2c2c2c] relative overflow-hidden">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
              Ready to Start Your Trading Journey?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of traders already mastering the markets with TradePulse
            </p>

            {!session && (
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-black hover:bg-gray-200"
                onClick={() => signIn()}
              >
                <Trophy className="h-5 w-5 mr-2" />
                Start Trading Free
              </Button>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Landing;
