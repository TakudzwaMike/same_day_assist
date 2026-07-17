import { Router, Response } from 'express';
import { prisma } from '../config/db';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashPassword,
} from '../config/auth';
import { validate, loginSchema, registerSchema } from '../middleware/validation';
import { writeAuditLog } from '../middleware/auditLog';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: any, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      await writeAuditLog({
        userType: 'Unknown',
        action: 'Failed Login',
        details: `Failed login attempt for email: ${email}`,
        ipAddress,
        userAgent,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      await writeAuditLog({
        userId: user.id,
        userType: user.role,
        action: 'Failed Login',
        details: `Incorrect password for ${user.email}`,
        ipAddress,
        userAgent,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: 'User Login',
      details: `${user.role} ${user.name} logged in successfully`,
      ipAddress,
      userAgent,
    });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        address: user.address,
        status: user.status,
        package: user.package,
        memberSince: user.memberSince,
        repairsCount: user.repairsCount,
        totalPaid: user.totalPaid,
        specialty: user.specialty,
        isAvailable: user.isAvailable,
        rating: user.rating,
        lat: user.lat,
        lng: user.lng,
        certifications: user.certifications ? JSON.parse(user.certifications) : [],
      },
    });
  } catch (error) {
    console.error('[Auth/Login]', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/register — Dynamic, business-oriented onboarding
router.post('/register', validate(registerSchema), async (req: any, res: Response) => {
  const { name, email, phone, address, serviceCategory, notes, password, role, adminSecret } = req.body;
  const ipAddress = req.ip || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    // 1. Enforce admin secret verification
    if (role === 'Administrator') {
      const systemSecret = process.env.ADMIN_REGISTRATION_SECRET;
      if (!systemSecret || adminSecret !== systemSecret) {
        await writeAuditLog({
          userType: 'Administrator',
          action: 'Failed Registration',
          result: 'Failed',
          details: `Attempted Administrator signup for ${email} with invalid security token.`,
          ipAddress,
          userAgent,
        });
        return res.status(403).json({ error: 'Invalid admin authorization key. Registration restricted.' });
      }
    } else if (role === 'Super Administrator') {
      const systemSecret = process.env.SUPER_ADMIN_SECRET;
      if (!systemSecret || adminSecret !== systemSecret) {
        await writeAuditLog({
          userType: 'Super Administrator',
          action: 'Failed Registration',
          result: 'Failed',
          details: `Attempted Super Administrator signup for ${email} with invalid security token.`,
          ipAddress,
          userAgent,
        });
        return res.status(403).json({ error: 'Invalid super admin security key. Registration restricted.' });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    
    // 2. Build role-specific user details
    const userData: any = {
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      name,
      phone,
      address,
      notificationSettings: {
        create: { email: true, sms: true, push: true, inApp: true },
      },
    };

    if (role === 'Customer') {
      const packageName = serviceCategory === 'Security' || serviceCategory === 'Construction' ? 'Diamond' : 'Platinum';
      userData.status = 'Prospect';
      userData.package = packageName;
    } else if (role === 'Contractor') {
      userData.specialty = serviceCategory || 'Security';
      userData.isAvailable = true;
      userData.rating = 5.0;
      userData.lat = -26.2041;
      userData.lng = 28.0473;
      userData.certifications = notes ? JSON.stringify([notes]) : JSON.stringify([]);
    }

    const user = await prisma.user.create({ data: userData });

    // 3. Create linked Enquiry for Customer role
    if (role === 'Customer') {
      await prisma.enquiry.create({
        data: {
          customerName: name,
          email: email.trim().toLowerCase(),
          phone,
          address,
          serviceCategory: serviceCategory || 'Security',
          notes: notes || 'Registered new Client / Property Owner profile.',
          status: 'Pending',
        },
      });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: 'User Registration',
      result: 'Success',
      details: `Account of type ${user.role} registered successfully for ${name}`,
      ipAddress,
      userAgent,
    });

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        address: user.address,
        status: user.status,
        package: user.package,
        specialty: user.specialty,
        isAvailable: user.isAvailable,
        rating: user.rating,
      },
    });
  } catch (error) {
    console.error('[Auth/Register]', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', async (req: any, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  await writeAuditLog({
    userId: user.id,
    userType: user.role,
    action: 'User Logout',
    details: `${user.role} ${user.email} signed out`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  return res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: any, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Always return success to prevent enumeration attacks
  await writeAuditLog({
    userId: user?.id,
    userType: user?.role || 'Unknown',
    action: 'Password Reset Request',
    details: `Password reset requested for ${email}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: 'If an account exists, a reset link has been sent' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { notificationSettings: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      address: user.address,
      status: user.status,
      package: user.package,
      memberSince: user.memberSince,
      repairsCount: user.repairsCount,
      totalPaid: user.totalPaid,
      specialty: user.specialty,
      isAvailable: user.isAvailable,
      rating: user.rating,
      lat: user.lat,
      lng: user.lng,
      certifications: user.certifications ? JSON.parse(user.certifications) : [],
      notificationSettings: user.notificationSettings,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/system/reseed — Full system database reset (Super Admin only, password confirmed)
router.post('/system/reseed', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { password } = req.body;
  const ipAddress = req.ip || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  if (user.role !== 'Super Administrator') {
    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: 'Database Reset',
      result: 'Failed',
      details: 'Unauthorized attempt to reset database by non-Super Administrator',
      ipAddress,
      userAgent,
    });
    return res.status(403).json({ error: 'Access forbidden: Super Administrator credentials required.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password confirmation is required.' });
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return res.status(404).json({ error: 'User record not found.' });

    const isValid = await comparePassword(password, dbUser.passwordHash);
    if (!isValid) {
      await writeAuditLog({
        userId: user.id,
        userType: user.role,
        action: 'Database Reset',
        result: 'Failed',
        details: 'Failed database reset attempt: incorrect confirmation password',
        ipAddress,
        userAgent,
      });
      return res.status(401).json({ error: 'Invalid confirmation password.' });
    }

    // Execute database seed
    const { exec } = await import('child_process');
    exec('npm run db:setup', async (error, stdout, stderr) => {
      if (error) {
        console.error('[System Reseed Failed]', error, stderr);
        await writeAuditLog({
          userId: user.id,
          userType: user.role,
          action: 'Database Reset',
          result: 'Failed',
          details: `Database reseed failed: ${error.message}`,
          ipAddress,
          userAgent,
        });
        return;
      }

      console.log('[System Reseed Success]', stdout);
      await writeAuditLog({
        userId: user.id,
        userType: user.role,
        action: 'Database Reset',
        result: 'Success',
        details: 'Database reseeded successfully by Super Administrator',
        ipAddress,
        userAgent,
      });
    });

    return res.json({ message: 'System re-seed triggered successfully. The database will reset shortly.' });
  } catch (err: any) {
    console.error('[Reseed API Error]', err);
    return res.status(500).json({ error: 'Internal server error during system reseed.' });
  }
});

export default router;
