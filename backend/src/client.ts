import { PrismaClient } from "@prisma/client";


declare global {
  // Prevent multiple instances in development
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: ['query'], // optional: shows queries in console
  });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;