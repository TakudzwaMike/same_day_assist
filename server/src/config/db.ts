import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

const getDbPath = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // If running in Vercel or AWS Lambda (/tmp is writable)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const tmpDbPath = path.join('/tmp', 'dev.db');
      if (!fs.existsSync(tmpDbPath)) {
        const srcDb = path.join(process.cwd(), 'prisma', 'dev.db');
        const rootDb = path.join(process.cwd(), 'dev.db');
        if (fs.existsSync(srcDb)) {
          fs.copyFileSync(srcDb, tmpDbPath);
        } else if (fs.existsSync(rootDb)) {
          fs.copyFileSync(rootDb, tmpDbPath);
        }
      }
      return `file:${tmpDbPath}`;
    } catch (e) {
      console.error('[DB Path Resolver]', e);
    }
  }
  return 'file:./prisma/dev.db';
};

const adapter = new PrismaBetterSqlite3({
  url: getDbPath(),
});

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

