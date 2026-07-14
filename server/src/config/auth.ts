import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'sda-access-secret-key-12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sda-refresh-secret-key-67890';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}
