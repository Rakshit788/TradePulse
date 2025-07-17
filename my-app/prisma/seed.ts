import {prisma} from "../src/app/lib/prisma"
 
function gaussianRandom(mean = 0, stdev = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}



async function seedKlines() {
  const assets = await prisma.asset.findMany();
  const now = new Date();

  for (const asset of assets) {
    console.log(`⚡ Seeding Kline data for ${asset.symbol}...`);

    let price = asset.initialPrice ?? 100;
    const klines = [];

    for (let i = 0; i < 600; i++) {
      const open = price;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.abs(gaussianRandom(0, 0.5));
      const low = Math.min(open, close) - Math.abs(gaussianRandom(0, 0.5));
      const volume = Math.random() * 1000;
      const startTime = new Date(now.getTime() - (100 - i) * 60000);
      const endTime = new Date(startTime.getTime() + 60000);

      klines.push({
        interval: '1m',
        open,
        close,
        high,
        low,
        volume,
        startTime,
        endTime,
        assetId: asset.id,
      });

      price = close;
    }

    await prisma.kline.createMany({ data: klines });
    console.log(`✅ Done with ${asset.symbol}`);
  }
}

async function main() {

  await seedKlines();
  console.log('🌱 Seeding done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
