import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

interface AuditOptions {
  action: string;
  details: string;
  previousValue?: any;
  newValue?: any;
  userType?: string;
}

export function auditLog(options: AuditOptions) {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const userType = req.user?.role || options.userType || 'System';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          userType,
          action: options.action,
          details: options.details,
          ipAddress,
          userAgent,
          previousValue: options.previousValue ? JSON.stringify(options.previousValue) : null,
          newValue: options.newValue ? JSON.stringify(options.newValue) : null,
        },
      });
    } catch (e) {
      // Non-blocking — audit errors must not break the request
      console.error('[AuditLog] Failed to write audit log:', e);
    }

    next();
  };
}

export async function writeAuditLog(params: {
  userId?: string;
  userType: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  previousValue?: any;
  newValue?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userType: params.userType,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress || 'System',
        userAgent: params.userAgent || 'System',
        previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      },
    });
  } catch (e) {
    console.error('[AuditLog] Failed to write audit log:', e);
  }
}
