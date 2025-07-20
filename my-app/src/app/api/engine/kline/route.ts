// app/api/cron/klines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';



// Define supported intervals (in minutes)
const INTERVALS = {
  '1m': 1,
  '1h': 60,
  '1d': 1440,
} as const;

type IntervalKey = keyof typeof INTERVALS;

function roundToInterval(date: Date, intervalMinutes: number): Date {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

function getNextInterval(date: Date, intervalMinutes: number): Date {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(date.getTime() + ms);
}

async function generateKlinesForAsset(assetId: string, interval: IntervalKey) {
  const intervalMinutes = INTERVALS[interval];

  // Get the last kline to determine where to start
  const lastKline = await prisma.kline.findFirst({
    where: { assetId, interval },
    orderBy: { endTime: 'desc' },
  });

  let startTime: Date;
  if (lastKline) {
    startTime = lastKline.endTime;
  } else {
    // If no previous klines, start from the first trade of this asset
    const firstTrade = await prisma.trade.findFirst({
      where: { assetId },
      orderBy: { executedAt: 'asc' },
    });

    if (!firstTrade) {
      console.log(`No trades found for asset ${assetId}`);
      return;
    }
    startTime = roundToInterval(firstTrade.executedAt, intervalMinutes);
  }

  const now = new Date();
  const currentIntervalStart = roundToInterval(now, intervalMinutes);

  const klinesToGenerate = [];

  let currentTime = startTime;

  while (currentTime < currentIntervalStart) {
    const intervalEnd = getNextInterval(currentTime, intervalMinutes);

    const trades = await prisma.trade.findMany({
      where: {
        assetId,
        executedAt: { gte: currentTime, lt: intervalEnd },
      },
      orderBy: { executedAt: 'asc' },
    });

    if (trades.length > 0) {
      const prices = trades.map(t => t.price);
      const volumes = trades.map(t => t.qty);

      klinesToGenerate.push({
        interval,
        startTime: currentTime,
        endTime: intervalEnd,
        assetId,
        open: trades[0].price,
        close: trades[trades.length - 1].price,
        high: Math.max(...prices),
        low: Math.min(...prices),
        volume: volumes.reduce((sum, vol) => sum + vol, 0),
      });
    } else if (lastKline && currentTime.getTime() === startTime.getTime()) {
      klinesToGenerate.push({
        interval,
        startTime: currentTime,
        endTime: intervalEnd,
        assetId,
        open: lastKline.close,
        close: lastKline.close,
        high: lastKline.close,
        low: lastKline.close,
        volume: 0,
      });
    }

    currentTime = intervalEnd;
  }

  if (klinesToGenerate.length > 0) {
    await prisma.kline.createMany({
      data: klinesToGenerate,
     
    });
    console.log(`Generated ${klinesToGenerate.length} klines for asset ${assetId}, interval ${interval}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron job request (optional security)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting kline generation job...');

    // Get all assets
    const assets = await prisma.asset.findMany({
      select: { id: true, symbol: true },
    });

    const intervals: IntervalKey[] = ['1m',  '1h', '1d'];
    
    // Generate klines for each asset and interval
    for (const asset of assets) {
      for (const interval of intervals) {
        await generateKlinesForAsset(asset.id, interval);
      }
    }

    // Clean up old klines (optional - keep last 1000 candles per interval per asset)
    for (const asset of assets) {
      for (const interval of intervals) {
        const klineCount = await prisma.kline.count({
          where: {
            assetId: asset.id,
            interval,
          },
        });

        if (klineCount > 1000) {
          const oldKlines = await prisma.kline.findMany({
            where: {
              assetId: asset.id,
              interval,
            },
            orderBy: {
              endTime: 'asc',
            },
            take: klineCount - 1000,
            select: { id: true },
          });

          await prisma.kline.deleteMany({
            where: {
              id: {
                in: oldKlines.map(k => k.id),
              },
            },
          });

          console.log(`Cleaned up ${oldKlines.length} old klines for ${asset.symbol} ${interval}`);
        }
      }
    }

    console.log('Kline generation job completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${assets.length} assets across ${intervals.length} intervals`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in kline generation:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate klines',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } 
}

// Optional GET endpoint for manual testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const assetId = url.searchParams.get('assetId');
  const interval = url.searchParams.get('interval') as IntervalKey;
  
  if (!assetId || !interval || !(interval in INTERVALS)) {
    return NextResponse.json(
      { error: 'Missing or invalid assetId or interval parameter' },
      { status: 400 }
    );
  }

  try {
    await generateKlinesForAsset(assetId, interval);
    
    return NextResponse.json({ 
      success: true, 
      message: `Generated klines for asset ${assetId}, interval ${interval}`,
    });
  } catch (error) {
    console.error('Error generating klines:', error);
    return NextResponse.json(
      { error: 'Failed to generate klines' },
      { status: 500 }
    );
  } 
}