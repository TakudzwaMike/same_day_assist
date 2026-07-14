import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

// Common validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  address: z.string().min(5, 'Address is required').max(500),
  serviceCategory: z.enum(['Security', 'Electrical', 'Plumbing', 'Construction']),
  notes: z.string().max(1000).optional(),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const enquirySchema = z.object({
  customerName: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().min(5).max(500),
  serviceCategory: z.enum(['Security', 'Electrical', 'Plumbing', 'Construction']),
  notes: z.string().max(1000).optional().default(''),
});

export const assessmentUploadSchema = z.object({
  enquiryId: z.string().uuid(),
  contractorId: z.string().uuid(),
  issuesFound: z.array(z.string().min(1)).min(0),
  estimatedCost: z.number().positive(),
  contractorNotes: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

export const quotationSchema = z.object({
  enquiryId: z.string().uuid(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    cost: z.number().positive(),
  })).min(1, 'At least one line item required'),
});

export const jobCreateSchema = z.object({
  serviceType: z.enum(['Security', 'Electrical', 'Plumbing', 'Construction']),
  description: z.string().min(10, 'Please describe the emergency in detail').max(2000),
  photoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

export const jobStatusSchema = z.object({
  status: z.enum(['Submitted', 'Assigned', 'Accepted', 'En Route', 'Arrived', 'Assessment', 'Awaiting Quote Approval', 'Repair In Progress', 'Quality Inspection', 'Completed', 'Closed', 'Archived']),
});

export const completionSchema = z.object({
  contractorNotes: z.string().max(2000),
  contractorSignature: z.string().min(1, 'Digital signature required'),
  completionPhoto: z.string().optional(),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  ratingComment: z.string().max(500).optional(),
});

export const notificationPrefSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
});
