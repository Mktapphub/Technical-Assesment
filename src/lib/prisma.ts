import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.ljrtekbftlbhelszsxrn:%40Afnan798081%40@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

