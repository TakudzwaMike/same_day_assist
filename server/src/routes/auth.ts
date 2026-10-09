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
import { initializeMembershipWithSchedule } from '../services/paymentService';

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

// POST /api/auth/onboarding — 7-Step Comprehensive Customer Onboarding
router.post('/onboarding', async (req: any, res: Response) => {
  const {
    name, email, phone, secondaryPhone, idNumber, accountType,
    companyName, companyRegNumber, vatNumber, industry, address,
    preferredContactMethod, emergencyContactName, emergencyContactPhone,
    preferredServices, communicationPreferences, password, savedLocations,
    selectedPlanId,
  } = req.body;

  if (!email || !password || !name || !phone || !address) {
    return res.status(400).json({ error: 'Name, email, phone number, physical address, and password are required.' });
  }

  const ipAddress = req.ip || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const { getPlanById } = await import('../config/plans');
    const chosenPlan = getPlanById(selectedPlanId || 'assist_plus');

    const passwordHash = await hashPassword(password);

    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const userData: any = {
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'Customer',
      name,
      phone,
      address,
      idNumber: idNumber || null,
      accountType: accountType || 'Individual',
      companyName: companyName || null,
      companyRegNumber: companyRegNumber || null,
      vatNumber: vatNumber || null,
      secondaryPhone: secondaryPhone || null,
      preferredContactMethod: preferredContactMethod || 'Email',
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      industry: industry || null,
      communicationPreferences: communicationPreferences ? JSON.stringify(communicationPreferences) : null,
      status: 'Active',
      package: chosenPlan.name,
      memberSince: now.toISOString().split('T')[0],
      repairsCount: 0,
      totalPaid: 0.0,
      lastProfileUpdateAt: now,
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true,
        },
      },
      memberships: {
        create: {
          planId: chosenPlan.id,
          planName: chosenPlan.name,
          monthlyPrice: chosenPlan.monthlyPrice,
          annualBenefit: chosenPlan.annualBenefit,
          benefitYearStart: now,
          benefitYearEnd: oneYearLater,
          status: 'Active',
          benefitTransactions: {
            create: {
              userId: '', // Will be set by Prisma nested connect/create
              reference: `OPENING-${now.getFullYear()}`,
              description: `Initial Annual Benefit Allocation (${chosenPlan.name})`,
              credit: chosenPlan.annualBenefit,
              debit: 0,
              balance: chosenPlan.annualBenefit,
              date: now,
            },
          },
        },
      },
    };

    if (savedLocations && Array.isArray(savedLocations) && savedLocations.length > 0) {
      userData.savedLocations = {
        create: savedLocations.map((loc: any) => ({
          label: loc.label || 'Primary Location',
          address: loc.address,
          lat: parseFloat(loc.lat || -26.2041),
          lng: parseFloat(loc.lng || 28.0473),
          accessNotes: loc.accessNotes || null,
        })),
      };
    }

    // Since nested BenefitTransaction references userId, we create user first then membership with transactions
    delete userData.memberships;

    const user = await prisma.user.create({
      data: userData,
      include: { savedLocations: true, notificationSettings: true },
    });

    // Initialize Membership with 3-stage payment lifecycle (Initial 20% collected, Pending Activation status)
    await initializeMembershipWithSchedule({
      userId: user.id,
      planId: chosenPlan.id,
      billingDay: 25,
      autoProcessInitial: true, // Stage 1 initial 20% collected on join
      paymentMethod: 'Card',
      startDate: now,
    });

    // Create linked Enquiry for initial onboarding record
    await prisma.enquiry.create({
      data: {
        customerName: name,
        email: email.trim().toLowerCase(),
        phone,
        address,
        serviceCategory: preferredServices && preferredServices.length > 0 ? preferredServices[0] : 'Security Services',
        notes: `Selected Plan: ${chosenPlan.name} (R${chosenPlan.monthlyPrice}/mo, R${chosenPlan.annualBenefit.toLocaleString()} annual benefit). Preferred services: ${preferredServices ? preferredServices.join(', ') : 'All On-Demand Services'}`,
        status: 'Approved',
      },
    });

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: 'Complete Onboarding',
      result: 'Success',
      details: `User ${name} completed 7-step onboarding successfully as ${accountType || 'Individual'}`,
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
        idNumber: user.idNumber,
        accountType: user.accountType,
        companyName: user.companyName,
        companyRegNumber: user.companyRegNumber,
        vatNumber: user.vatNumber,
        secondaryPhone: user.secondaryPhone,
        preferredContactMethod: user.preferredContactMethod,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        status: user.status,
        package: user.package,
        memberSince: user.memberSince,
        lastProfileUpdateAt: user.lastProfileUpdateAt,
        savedLocations: user.savedLocations,
      },
    });
  } catch (error) {
    console.error('[Auth/Onboarding]', error);
    return res.status(500).json({ error: 'Server error during customer onboarding.' });
  }
});

// PUT /api/auth/profile — Update Profile (Direct update for customer profile fields; approval routing for sensitive corporate identity fields)
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const updates = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // For customers updating personal details (name, phone, address, etc.), apply directly
    const isCustomer = user.role === 'Customer';
    const corporateSensitiveFields = ['idNumber', 'companyRegNumber'];
    const isCorporateSensitiveAttempt = !isCustomer && corporateSensitiveFields.some(field => updates[field] !== undefined && updates[field] !== (user as any)[field]);

    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const lastUpdate = user.lastProfileUpdateAt ? new Date(user.lastProfileUpdateAt) : null;
    const isLocked = !isCustomer && lastUpdate && (now.getTime() - lastUpdate.getTime() < SIXTY_DAYS_MS);

    if (isLocked || isCorporateSensitiveAttempt) {
      // Create pending ProfileUpdateRequest
      const pendingReq = await prisma.profileUpdateRequest.create({
        data: {
          userId,
          proposedChanges: JSON.stringify(updates),
          status: 'Pending',
        },
      });

      await writeAuditLog({
        userId,
        userType: user.role,
        action: 'Profile Update Requested',
        details: `Profile update submitted for Admin Approval (60-day lock active: ${isLocked}, Sensitive edit: ${isCorporateSensitiveAttempt})`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(202).json({
        pendingApproval: true,
        requestId: pendingReq.id,
        message: 'Your profile update has been submitted for Administrator Approval due to 60-day security policy or sensitive data modification.',
      });
    }

    // Direct update allowed
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.phone && { phone: updates.phone.trim() }),
        ...(updates.secondaryPhone !== undefined && { secondaryPhone: updates.secondaryPhone }),
        ...(updates.address && { address: updates.address.trim() }),
        ...(updates.emergencyContactName !== undefined && { emergencyContactName: updates.emergencyContactName }),
        ...(updates.emergencyContactPhone !== undefined && { emergencyContactPhone: updates.emergencyContactPhone }),
        ...(updates.preferredContactMethod && { preferredContactMethod: updates.preferredContactMethod }),
        ...(updates.companyName !== undefined && { companyName: updates.companyName }),
        ...(updates.industry !== undefined && { industry: updates.industry }),
        ...(isCustomer && updates.idNumber !== undefined && { idNumber: updates.idNumber }),
        lastProfileUpdateAt: now,
      },
    });

    await writeAuditLog({
      userId,
      userType: user.role,
      action: 'Profile Updated',
      details: `Profile updated directly for ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      pendingApproval: false,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        idNumber: updatedUser.idNumber,
        secondaryPhone: updatedUser.secondaryPhone,
        emergencyContactName: updatedUser.emergencyContactName,
        emergencyContactPhone: updatedUser.emergencyContactPhone,
        preferredContactMethod: updatedUser.preferredContactMethod,
        companyName: updatedUser.companyName,
        companyRegNumber: updatedUser.companyRegNumber,
        lastProfileUpdateAt: updatedUser.lastProfileUpdateAt,
      },
    });
  } catch (error) {
    console.error('[Auth/Profile]', error);
    return res.status(500).json({ error: 'Server error updating profile' });
  }
});

// POST /api/auth/change-password — Dedicated secure password change with verification
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Current password, new password, and confirmation are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters in length.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User record not found.' });

    const isValidCurrent = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidCurrent) {
      await writeAuditLog({
        userId,
        userType: user.role,
        action: 'Change Password Failed',
        result: 'Failed',
        details: 'Failed password change: current password incorrect',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(400).json({ error: 'Current password entered is incorrect.' });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await writeAuditLog({
      userId,
      userType: user.role,
      action: 'Change Password',
      result: 'Success',
      details: 'Customer successfully changed account security password',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ message: 'Password updated successfully. Please use your new password next time you sign in.' });
  } catch (err) {
    console.error('[Auth/ChangePassword]', err);
    return res.status(500).json({ error: 'Internal server error changing password.' });
  }
});

// GET /api/auth/notifications — Retrieve connected notification channels & alert preferences
router.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    let settings = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.notificationPreference.create({
        data: { userId, email: true, sms: true, push: true, inApp: true },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { communicationPreferences: true } });
    let commPrefs: any = {};
    if (user?.communicationPreferences) {
      try { commPrefs = JSON.parse(user.communicationPreferences); } catch (e) {}
    }

    return res.json({
      email: settings.email,
      sms: settings.sms,
      push: settings.push,
      inApp: settings.inApp,
      serviceUpdates: commPrefs.serviceUpdates ?? true,
      paymentAlerts: commPrefs.paymentAlerts ?? true,
      securityAlerts: commPrefs.securityAlerts ?? true,
    });
  } catch (err) {
    console.error('[Auth/Notifications GET]', err);
    return res.status(500).json({ error: 'Failed to retrieve notification settings.' });
  }
});

// PUT /api/auth/notifications — Update notification preferences across channels
router.put('/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { email, sms, push, inApp, serviceUpdates, paymentAlerts, securityAlerts } = req.body;

  try {
    const updatedSettings = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        ...(email !== undefined && { email: Boolean(email) }),
        ...(sms !== undefined && { sms: Boolean(sms) }),
        ...(push !== undefined && { push: Boolean(push) }),
        ...(inApp !== undefined && { inApp: Boolean(inApp) }),
      },
      create: {
        userId,
        email: email !== undefined ? Boolean(email) : true,
        sms: sms !== undefined ? Boolean(sms) : true,
        push: push !== undefined ? Boolean(push) : true,
        inApp: inApp !== undefined ? Boolean(inApp) : true,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { communicationPreferences: true } });
    let commPrefs: any = {};
    if (user?.communicationPreferences) {
      try { commPrefs = JSON.parse(user.communicationPreferences); } catch (e) {}
    }

    if (serviceUpdates !== undefined) commPrefs.serviceUpdates = Boolean(serviceUpdates);
    if (paymentAlerts !== undefined) commPrefs.paymentAlerts = Boolean(paymentAlerts);
    if (securityAlerts !== undefined) commPrefs.securityAlerts = Boolean(securityAlerts);

    await prisma.user.update({
      where: { id: userId },
      data: { communicationPreferences: JSON.stringify(commPrefs) },
    });

    return res.json({
      email: updatedSettings.email,
      sms: updatedSettings.sms,
      push: updatedSettings.push,
      inApp: updatedSettings.inApp,
      serviceUpdates: commPrefs.serviceUpdates ?? true,
      paymentAlerts: commPrefs.paymentAlerts ?? true,
      securityAlerts: commPrefs.securityAlerts ?? true,
    });
  } catch (err) {
    console.error('[Auth/Notifications PUT]', err);
    return res.status(500).json({ error: 'Failed to update notification settings.' });
  }
});

// PATCH /api/auth/theme — Save customer theme preference (dark navy or light)
router.patch('/theme', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { theme } = req.body;

  if (theme !== 'dark' && theme !== 'light') {
    return res.status(400).json({ error: 'Theme must be either "dark" or "light".' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { communicationPreferences: true } });
    let commPrefs: any = {};
    if (user?.communicationPreferences) {
      try { commPrefs = JSON.parse(user.communicationPreferences); } catch (e) {}
    }

    commPrefs.themePreference = theme;

    await prisma.user.update({
      where: { id: userId },
      data: { communicationPreferences: JSON.stringify(commPrefs) },
    });

    return res.json({ theme, message: 'Theme preference saved successfully.' });
  } catch (err) {
    console.error('[Auth/Theme PATCH]', err);
    return res.status(500).json({ error: 'Failed to update theme preference.' });
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
