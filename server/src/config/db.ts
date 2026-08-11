import { PrismaClient } from '@prisma/client';
import path from 'path';

let prismaInstance: PrismaClient;

const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION;

if (isVercel) {
  process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${path.join('/tmp', 'dev.db')}`;
  prismaInstance = new PrismaClient({
    log: ['error'],
  });
} else {
  try {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    });
    prismaInstance = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  } catch (e) {
    prismaInstance = new PrismaClient({
      log: ['error'],
    });
  }
}

export const prisma = prismaInstance;
