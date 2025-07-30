// seed.ts
import { prisma } from './client';

async function seed() {
  const assetId = "6877f767b58a05469553e4e0";
  const users = [
    { id: "68781b407b8f7617f3d18842", quantity: 1000 },
    { id: "687f5ba37d365cd716656c83", quantity: 0 },
  ];

  for (const user of users) {
    await prisma.portfolioItem.upsert({
      where: {
        userId_assetId: {
          userId: user.id,
          assetId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        assetId,
        qty: user.quantity,
      },
    });
  }

  console.log("Seeded test portfolios");
  process.exit(0);
}

seed();
