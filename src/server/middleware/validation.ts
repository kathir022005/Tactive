import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed for request payload',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({ error: 'Invalid input payload' });
    }
  };
}

// Validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required')
});

export const createReservationSchema = z.object({
  assetId: z.union([z.string().min(1, 'assetId is required'), z.number().int().positive()]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in format YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in format YYYY-MM-DD'),
  notes: z.string().max(500).optional()
});

export const createAssetSchema = z.object({
  name: z.string().min(2, 'Asset name is required').max(100),
  category: z.string().min(2, 'Category is required').max(50),
  serialNumber: z.string().min(2, 'Serial number is required').max(50),
  dailyPenaltyRate: z.number().positive('Daily penalty rate must be positive'),
  description: z.string().optional(),
  location: z.string().default('Main Office')
});

export const createBlackoutSchema = z.object({
  assetId: z.union([z.string().min(1, 'assetId is required'), z.number().int().positive()]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3, 'Reason is required')
});
