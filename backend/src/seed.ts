import { prisma } from "./client";

async function main() {
  const assets = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      description: "Digital gold and the first cryptocurrency.",
      initialPrice: 60000,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      description: "Smart contract platform for decentralized apps.",
      initialPrice: 4000,
    },
    {
      name: "Solana",
      symbol: "SOL",
      description: "High-performance blockchain supporting fast transactions.",
      initialPrice: 150,
    },
    {
      name: "Cardano",
      symbol: "ADA",
      description: "Proof-of-stake blockchain for smart contracts.",
      initialPrice: 2.5,
    },
    {
      name: "Polkadot",
      symbol: "DOT",
      description: "Multichain network connecting various blockchains.",
      initialPrice: 35,
    },
  ];

  for (const asset of assets) {
    await prisma.asset.create({ data: asset });
  }

  console.log("Seeded assets successfully");
}

main()
  .catch((e) => {
    console.error(" Error seeding assets:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
