"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react";
import { TrendingUp } from "lucide-react";

const Navbar = () => {
  const { data: session, status } = useSession();

  return (
    <nav className="w-full bg-[#0f0f0f] border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <TrendingUp className="text-indigo-400 w-6 h-6" />
        <span className="text-white font-bold text-xl">TradePulse</span>
      </Link>

      {/* Navigation & Auth */}
      <div className="flex items-center gap-4">
        <Link href="/leaderboard">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500">
            Leaderboard
          </Button>
        </Link>

        {status === "loading" ? null : session ? (
          <>
            <span className="text-gray-300 hidden sm:block">Hello, {session.user?.name?.split(" ")[0] || "Trader"}</span>
            <Button
              variant="secondary"
              onClick={() => signOut()}
              className="bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={() => signIn()}
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
