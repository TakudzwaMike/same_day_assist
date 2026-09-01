// server/src/vercel-handler.ts
import express from "express";
import cors from "cors";
import path3 from "path";
import dotenv from "dotenv";

// server/src/config/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";
var getDbPath = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const tmpDbPath = path.join("/tmp", "dev.db");
      if (!fs.existsSync(tmpDbPath)) {
        const srcDb = path.join(process.cwd(), "prisma", "dev.db");
        const rootDb = path.join(process.cwd(), "dev.db");
        if (fs.existsSync(srcDb)) {
          fs.copyFileSync(srcDb, tmpDbPath);
        } else if (fs.existsSync(rootDb)) {
          fs.copyFileSync(rootDb, tmpDbPath);
        }
      }
      return `file:${tmpDbPath}`;
    } catch (e) {
      console.error("[DB Path Resolver]", e);
    }
  }
  return "file:./prisma/dev.db";
};
var adapter = new PrismaBetterSqlite3({
  url: getDbPath()
});
var prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"]
});

// server/src/vercel-handler.ts
import fs3 from "fs";

// server/src/routes/auth.ts
import { Router } from "express";

// server/src/config/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
var JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "sda-access-secret-key-12345";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "sda-refresh-secret-key-67890";
var ACCESS_TOKEN_EXPIRY = "15m";
var REFRESH_TOKEN_EXPIRY = "7d";
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

// server/src/middleware/validation.ts
import { z } from "zod";
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    req.body = result.data;
    next();
  };
}
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters")
});
var registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number must be at least 5 characters").max(30),
  address: z.string().min(2, "Address is required").max(500),
  serviceCategory: z.string().optional().default("Security"),
  notes: z.string().max(1e3).optional(),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum(["Customer", "Contractor", "Dispatcher", "Administrator", "Super Administrator"]).optional().default("Customer"),
  adminSecret: z.string().optional()
});
var enquirySchema = z.object({
  customerName: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  address: z.string().min(1).max(500),
  serviceCategory: z.string().optional().default("Security"),
  notes: z.string().max(1e3).optional().default("")
});
var assessmentUploadSchema = z.object({
  enquiryId: z.string().uuid(),
  contractorId: z.string().uuid(),
  issuesFound: z.array(z.string().min(1)).min(0),
  estimatedCost: z.number().positive(),
  contractorNotes: z.string().max(2e3).optional(),
  photoUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional()
});
var quotationSchema = z.object({
  enquiryId: z.string().uuid(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    cost: z.number().positive()
  })).min(1, "At least one line item required")
});
var jobCreateSchema = z.object({
  serviceType: z.enum(["Security", "Electrical", "Plumbing", "Construction"]),
  description: z.string().min(10, "Please describe the emergency in detail").max(2e3),
  photoUrl: z.string().optional(),
  videoUrl: z.string().optional()
});
var jobStatusSchema = z.object({
  status: z.enum(["Submitted", "Assigned", "Accepted", "En Route", "Arrived", "Assessment", "Awaiting Quote Approval", "Repair In Progress", "Quality Inspection", "Completed", "Closed", "Archived"])
});
var completionSchema = z.object({
  contractorNotes: z.string().max(2e3),
  contractorSignature: z.string().min(1, "Digital signature required"),
  completionPhoto: z.string().optional()
});
var ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  ratingComment: z.string().max(500).optional()
});
var notificationPrefSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean()
});

// server/src/middleware/auditLog.ts
async function writeAuditLog(params) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userType: params.userType,
        action: params.action,
        result: params.result || "Success",
        details: params.details,
        ipAddress: params.ipAddress || "System",
        userAgent: params.userAgent || "System",
        previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null
      }
    });
  } catch (e) {
    console.error("[AuditLog] Failed to write audit log:", e);
  }
}

// server/src/middleware/auth.ts
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication token required (Bearer)" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access forbidden for role: ${req.user.role}` });
    }
    next();
  };
}

// server/src/routes/auth.ts
var router = Router();
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";
  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      await writeAuditLog({
        userType: "Unknown",
        action: "Failed Login",
        details: `Failed login attempt for email: ${email}`,
        ipAddress,
        userAgent
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      await writeAuditLog({
        userId: user.id,
        userType: user.role,
        action: "Failed Login",
        details: `Incorrect password for ${user.email}`,
        ipAddress,
        userAgent
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: "User Login",
      details: `${user.role} ${user.name} logged in successfully`,
      ipAddress,
      userAgent
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
        certifications: user.certifications ? JSON.parse(user.certifications) : []
      }
    });
  } catch (error) {
    console.error("[Auth/Login]", error);
    return res.status(500).json({ error: "Server error during login" });
  }
});
router.post("/register", validate(registerSchema), async (req, res) => {
  const { name, email, phone, address, serviceCategory, notes, password, role, adminSecret } = req.body;
  const ipAddress = req.ip || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";
  try {
    if (role === "Administrator") {
      const systemSecret = process.env.ADMIN_REGISTRATION_SECRET;
      if (!systemSecret || adminSecret !== systemSecret) {
        await writeAuditLog({
          userType: "Administrator",
          action: "Failed Registration",
          result: "Failed",
          details: `Attempted Administrator signup for ${email} with invalid security token.`,
          ipAddress,
          userAgent
        });
        return res.status(403).json({ error: "Invalid admin authorization key. Registration restricted." });
      }
    } else if (role === "Super Administrator") {
      const systemSecret = process.env.SUPER_ADMIN_SECRET;
      if (!systemSecret || adminSecret !== systemSecret) {
        await writeAuditLog({
          userType: "Super Administrator",
          action: "Failed Registration",
          result: "Failed",
          details: `Attempted Super Administrator signup for ${email} with invalid security token.`,
          ipAddress,
          userAgent
        });
        return res.status(403).json({ error: "Invalid super admin security key. Registration restricted." });
      }
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const passwordHash = await hashPassword(password);
    const userData = {
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      name,
      phone,
      address,
      notificationSettings: {
        create: { email: true, sms: true, push: true, inApp: true }
      }
    };
    if (role === "Customer") {
      const packageName = serviceCategory === "Security" || serviceCategory === "Construction" ? "Diamond" : "Platinum";
      userData.status = "Prospect";
      userData.package = packageName;
    } else if (role === "Contractor") {
      userData.specialty = serviceCategory || "Security";
      userData.isAvailable = true;
      userData.rating = 5;
      userData.lat = -26.2041;
      userData.lng = 28.0473;
      userData.certifications = notes ? JSON.stringify([notes]) : JSON.stringify([]);
    }
    const user = await prisma.user.create({ data: userData });
    if (role === "Customer") {
      await prisma.enquiry.create({
        data: {
          customerName: name,
          email: email.trim().toLowerCase(),
          phone,
          address,
          serviceCategory: serviceCategory || "Security",
          notes: notes || "Registered new Client / Property Owner profile.",
          status: "Pending"
        }
      });
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: "User Registration",
      result: "Success",
      details: `Account of type ${user.role} registered successfully for ${name}`,
      ipAddress,
      userAgent
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
        rating: user.rating
      }
    });
  } catch (error) {
    console.error("[Auth/Register]", error);
    return res.status(500).json({ error: "Server error during registration" });
  }
});
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});
router.post("/onboarding", async (req, res) => {
  const {
    name,
    email,
    phone,
    secondaryPhone,
    idNumber,
    accountType,
    companyName,
    companyRegNumber,
    vatNumber,
    industry,
    address,
    preferredContactMethod,
    emergencyContactName,
    emergencyContactPhone,
    preferredServices,
    communicationPreferences,
    password,
    savedLocations
  } = req.body;
  if (!email || !password || !name || !phone || !address) {
    return res.status(400).json({ error: "Name, email, phone number, physical address, and password are required." });
  }
  const ipAddress = req.ip || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";
  try {
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email address already exists." });
    }
    const passwordHash = await hashPassword(password);
    const userData = {
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "Customer",
      name,
      phone,
      address,
      idNumber: idNumber || null,
      accountType: accountType || "Individual",
      companyName: companyName || null,
      companyRegNumber: companyRegNumber || null,
      vatNumber: vatNumber || null,
      secondaryPhone: secondaryPhone || null,
      preferredContactMethod: preferredContactMethod || "Email",
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      industry: industry || null,
      communicationPreferences: communicationPreferences ? JSON.stringify(communicationPreferences) : null,
      status: "Active",
      package: "Diamond",
      memberSince: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      repairsCount: 0,
      totalPaid: 0,
      lastProfileUpdateAt: /* @__PURE__ */ new Date(),
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true
        }
      }
    };
    if (savedLocations && Array.isArray(savedLocations) && savedLocations.length > 0) {
      userData.savedLocations = {
        create: savedLocations.map((loc) => ({
          label: loc.label || "Primary Location",
          address: loc.address,
          lat: parseFloat(loc.lat || -26.2041),
          lng: parseFloat(loc.lng || 28.0473),
          accessNotes: loc.accessNotes || null
        }))
      };
    }
    const user = await prisma.user.create({
      data: userData,
      include: { savedLocations: true, notificationSettings: true }
    });
    await prisma.enquiry.create({
      data: {
        customerName: name,
        email: email.trim().toLowerCase(),
        phone,
        address,
        serviceCategory: preferredServices && preferredServices.length > 0 ? preferredServices[0] : "Security Services",
        notes: `Completed comprehensive 7-step onboarding. Preferred services: ${preferredServices ? preferredServices.join(", ") : "All On-Demand Services"}`,
        status: "Approved"
      }
    });
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: "Complete Onboarding",
      result: "Success",
      details: `User ${name} completed 7-step onboarding successfully as ${accountType || "Individual"}`,
      ipAddress,
      userAgent
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
        savedLocations: user.savedLocations
      }
    });
  } catch (error) {
    console.error("[Auth/Onboarding]", error);
    return res.status(500).json({ error: "Server error during customer onboarding." });
  }
});
router.put("/profile", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1e3;
    const now = /* @__PURE__ */ new Date();
    const lastUpdate = user.lastProfileUpdateAt ? new Date(user.lastProfileUpdateAt) : null;
    const isLocked = lastUpdate && now.getTime() - lastUpdate.getTime() < SIXTY_DAYS_MS;
    const sensitiveFields = ["idNumber", "companyRegNumber", "name", "email"];
    const isSensitiveAttempt = sensitiveFields.some((field) => updates[field] !== void 0 && updates[field] !== user[field]);
    if (isLocked || isSensitiveAttempt) {
      const pendingReq = await prisma.profileUpdateRequest.create({
        data: {
          userId,
          proposedChanges: JSON.stringify(updates),
          status: "Pending"
        }
      });
      await writeAuditLog({
        userId,
        userType: user.role,
        action: "Profile Update Requested",
        details: `Profile update submitted for Admin Approval (60-day lock active: ${isLocked}, Sensitive edit: ${isSensitiveAttempt})`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      return res.status(202).json({
        pendingApproval: true,
        requestId: pendingReq.id,
        message: "Your profile update has been submitted for Administrator Approval due to 60-day security policy or sensitive data modification."
      });
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        lastProfileUpdateAt: now
      }
    });
    await writeAuditLog({
      userId,
      userType: user.role,
      action: "Profile Updated",
      details: `Profile updated directly for ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
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
        companyName: updatedUser.companyName,
        companyRegNumber: updatedUser.companyRegNumber,
        lastProfileUpdateAt: updatedUser.lastProfileUpdateAt
      }
    });
  } catch (error) {
    console.error("[Auth/Profile]", error);
    return res.status(500).json({ error: "Server error updating profile" });
  }
});
router.post("/logout", requireAuth, async (req, res) => {
  const user = req.user;
  await writeAuditLog({
    userId: user.id,
    userType: user.role,
    action: "User Logout",
    details: `${user.role} ${user.email} signed out`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "Logged out successfully" });
});
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  await writeAuditLog({
    userId: user?.id,
    userType: user?.role || "Unknown",
    action: "Password Reset Request",
    details: `Password reset requested for ${email}`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
  });
  return res.json({ message: "If an account exists, a reset link has been sent" });
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { notificationSettings: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
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
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});
router.post("/system/reseed", requireAuth, async (req, res) => {
  const user = req.user;
  const { password } = req.body;
  const ipAddress = req.ip || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";
  if (user.role !== "Super Administrator") {
    await writeAuditLog({
      userId: user.id,
      userType: user.role,
      action: "Database Reset",
      result: "Failed",
      details: "Unauthorized attempt to reset database by non-Super Administrator",
      ipAddress,
      userAgent
    });
    return res.status(403).json({ error: "Access forbidden: Super Administrator credentials required." });
  }
  if (!password) {
    return res.status(400).json({ error: "Password confirmation is required." });
  }
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return res.status(404).json({ error: "User record not found." });
    const isValid = await comparePassword(password, dbUser.passwordHash);
    if (!isValid) {
      await writeAuditLog({
        userId: user.id,
        userType: user.role,
        action: "Database Reset",
        result: "Failed",
        details: "Failed database reset attempt: incorrect confirmation password",
        ipAddress,
        userAgent
      });
      return res.status(401).json({ error: "Invalid confirmation password." });
    }
    const { exec } = await import("child_process");
    exec("npm run db:setup", async (error, stdout, stderr) => {
      if (error) {
        console.error("[System Reseed Failed]", error, stderr);
        await writeAuditLog({
          userId: user.id,
          userType: user.role,
          action: "Database Reset",
          result: "Failed",
          details: `Database reseed failed: ${error.message}`,
          ipAddress,
          userAgent
        });
        return;
      }
      console.log("[System Reseed Success]", stdout);
      await writeAuditLog({
        userId: user.id,
        userType: user.role,
        action: "Database Reset",
        result: "Success",
        details: "Database reseeded successfully by Super Administrator",
        ipAddress,
        userAgent
      });
    });
    return res.json({ message: "System re-seed triggered successfully. The database will reset shortly." });
  } catch (err) {
    console.error("[Reseed API Error]", err);
    return res.status(500).json({ error: "Internal server error during system reseed." });
  }
});
var auth_default = router;

// server/src/routes/enquiries.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.get("/", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher"), async (req, res) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      include: { assessments: true, quotations: true },
      orderBy: { createdAt: "desc" }
    });
    return res.json(enquiries);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve enquiries" });
  }
});
router2.get("/:id", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher"), async (req, res) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: req.params.id },
      include: { assessments: { include: { contractor: true } }, quotations: true }
    });
    if (!enquiry) return res.status(404).json({ error: "Enquiry not found" });
    return res.json(enquiry);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve enquiry" });
  }
});
router2.post("/", validate(enquirySchema), async (req, res) => {
  try {
    const enquiry = await prisma.enquiry.create({ data: req.body });
    await writeAuditLog({
      userType: "Customer",
      action: "Enquiry Created",
      details: `Prospective customer ${req.body.customerName} submitted onboarding enquiry for ${req.body.serviceCategory}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return res.status(201).json(enquiry);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create enquiry" });
  }
});
router2.patch("/:id/schedule", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher"), async (req, res) => {
  const { contractorId } = req.body;
  if (!contractorId) return res.status(400).json({ error: "contractorId is required" });
  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) return res.status(404).json({ error: "Enquiry not found" });
    const contractor = await prisma.user.findUnique({ where: { id: contractorId } });
    if (!contractor || contractor.role !== "Contractor") {
      return res.status(400).json({ error: "Invalid contractor" });
    }
    const [updatedEnquiry, assessment] = await prisma.$transaction([
      prisma.enquiry.update({
        where: { id: req.params.id },
        data: { status: "Scheduled" }
      }),
      prisma.assessment.create({
        data: {
          enquiryId: req.params.id,
          contractorId,
          scheduledAt: /* @__PURE__ */ new Date(),
          estimatedCost: 0,
          issuesFound: JSON.stringify([]),
          status: "Scheduled"
        }
      })
    ]);
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Assessment Scheduled",
      details: `Administrator scheduled property survey for ${enquiry.customerName} with contractor ${contractor.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      previousValue: { status: enquiry.status },
      newValue: { status: "Scheduled", assessmentId: assessment.id }
    });
    return res.json({ enquiry: updatedEnquiry, assessment });
  } catch (error) {
    console.error("[Enquiries/Schedule]", error);
    return res.status(500).json({ error: "Failed to schedule assessment" });
  }
});
var enquiries_default = router2;

// server/src/routes/assessments.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.get("/", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: { contractor: { select: { id: true, name: true, email: true, specialty: true } }, enquiry: true },
      orderBy: { scheduledAt: "desc" }
    });
    return res.json(assessments.map((a) => ({
      ...a,
      issuesFound: JSON.parse(a.issuesFound)
    })));
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve assessments" });
  }
});
router3.get("/my", requireAuth, requireRoles("Contractor"), async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { contractorId: req.user.id },
      include: { enquiry: true },
      orderBy: { scheduledAt: "asc" }
    });
    return res.json(assessments.map((a) => ({
      ...a,
      issuesFound: JSON.parse(a.issuesFound)
    })));
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve assessments" });
  }
});
router3.patch("/:id/start", requireAuth, requireRoles("Contractor"), async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });
    if (assessment.contractorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this assessment" });
    }
    const updated = await prisma.assessment.update({
      where: { id: req.params.id },
      data: { status: "Assessing" }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Compliance Survey Started",
      details: `Contractor arrived at property and commenced safety compliance assessment (ID: ${req.params.id})`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      previousValue: { status: assessment.status },
      newValue: { status: "Assessing" }
    });
    return res.json({ ...updated, issuesFound: JSON.parse(updated.issuesFound) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to start assessment" });
  }
});
router3.post("/:id/upload", requireAuth, requireRoles("Contractor"), async (req, res) => {
  const { issuesFound, estimatedCost, contractorNotes, photoUrl, videoUrl } = req.body;
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true }
    });
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });
    if (assessment.contractorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to upload this assessment" });
    }
    const [updatedAssessment, updatedEnquiry, newQuotation] = await prisma.$transaction([
      prisma.assessment.update({
        where: { id: req.params.id },
        data: {
          issuesFound: JSON.stringify(issuesFound),
          estimatedCost,
          contractorNotes,
          photoUrl,
          videoUrl,
          status: "Uploaded",
          completedAt: /* @__PURE__ */ new Date()
        }
      }),
      prisma.enquiry.update({
        where: { id: assessment.enquiryId },
        data: { status: "Assessed" }
      }),
      prisma.quotation.create({
        data: {
          enquiryId: assessment.enquiryId,
          amount: estimatedCost,
          lineItems: JSON.stringify(
            issuesFound.map((issue, i) => ({
              id: `li-${i}`,
              description: issue,
              cost: Math.round(estimatedCost / issuesFound.length)
            }))
          ),
          status: "Pending"
        }
      })
    ]);
    const enquiry = assessment.enquiry;
    const customer = await prisma.user.findFirst({ where: { email: enquiry.email, role: "Customer" } });
    if (customer) {
      await prisma.user.update({
        where: { id: customer.id },
        data: { status: "Awaiting Quotation" }
      });
    }
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Compliance Survey Uploaded",
      details: `Contractor uploaded ${issuesFound.length} defects requiring R${estimatedCost} in pre-membership repairs`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      newValue: { issuesCount: issuesFound.length, estimatedCost, quotationId: newQuotation.id }
    });
    return res.json({
      assessment: { ...updatedAssessment, issuesFound },
      enquiry: updatedEnquiry,
      quotation: { ...newQuotation, lineItems: JSON.parse(newQuotation.lineItems) }
    });
  } catch (error) {
    console.error("[Assessments/Upload]", error);
    return res.status(500).json({ error: "Failed to upload assessment" });
  }
});
var assessments_default = router3;

// server/src/routes/quotations.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.get("/", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher"), async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { enquiry: true },
      orderBy: { createdAt: "desc" }
    });
    return res.json(quotations.map((q) => ({ ...q, lineItems: JSON.parse(q.lineItems) })));
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve quotations" });
  }
});
router4.get("/my", requireAuth, requireRoles("Customer"), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const quotations = await prisma.quotation.findMany({
      where: {
        enquiry: { email: user.email }
      },
      include: { enquiry: true },
      orderBy: { createdAt: "desc" }
    });
    return res.json(quotations.map((q) => ({ ...q, lineItems: JSON.parse(q.lineItems) })));
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve quotations" });
  }
});
router4.post("/", requireAuth, requireRoles("Administrator", "Super Administrator"), validate(quotationSchema), async (req, res) => {
  const { enquiryId, lineItems } = req.body;
  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) return res.status(404).json({ error: "Enquiry not found" });
    const amount = lineItems.reduce((sum, item) => sum + item.cost, 0);
    const formattedItems = lineItems.map((item, i) => ({
      id: `li-${i}`,
      description: item.description,
      cost: item.cost
    }));
    const quotation = await prisma.quotation.create({
      data: {
        enquiryId,
        amount,
        lineItems: JSON.stringify(formattedItems),
        status: "Pending"
      }
    });
    await prisma.enquiry.update({ where: { id: enquiryId }, data: { status: "Quoted" } });
    const customer = await prisma.user.findFirst({ where: { email: enquiry.email, role: "Customer" } });
    if (customer) {
      await prisma.user.update({ where: { id: customer.id }, data: { status: "Awaiting Approval" } });
    }
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Quotation Dispatched",
      details: `Administrator finalized pre-compliance quote of R${amount} for ${enquiry.customerName}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      newValue: { quotationId: quotation.id, amount }
    });
    return res.status(201).json({ ...quotation, lineItems: formattedItems });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create quotation" });
  }
});
router4.patch("/:id/approve", requireAuth, requireRoles("Customer"), async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true }
    });
    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    if (quotation.enquiry.email.toLowerCase() !== customer.email.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized to approve this quotation" });
    }
    if (quotation.status !== "Pending") {
      return res.status(400).json({ error: `Quotation is already ${quotation.status}` });
    }
    const [updatedQuotation] = await prisma.$transaction([
      prisma.quotation.update({
        where: { id: req.params.id },
        data: { status: "Approved", approvedAt: /* @__PURE__ */ new Date() }
      }),
      prisma.enquiry.update({
        where: { id: quotation.enquiryId },
        data: { status: "Approved" }
      }),
      prisma.user.update({
        where: { id: customer.id },
        data: { status: "Awaiting Repairs" }
      })
    ]);
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Quotation Approved",
      details: `Customer approved quotation ${req.params.id} for pre-membership repairs`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      previousValue: { status: "Pending" },
      newValue: { status: "Approved" }
    });
    return res.json({ ...updatedQuotation, lineItems: JSON.parse(updatedQuotation.lineItems) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to approve quotation" });
  }
});
router4.patch("/:id/decline", requireAuth, requireRoles("Customer"), async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true }
    });
    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!customer || quotation.enquiry.email.toLowerCase() !== customer.email.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: "Declined" }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Quotation Declined",
      details: `Customer declined quotation ${req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return res.json({ ...updated, lineItems: JSON.parse(updated.lineItems) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to decline quotation" });
  }
});
var quotations_default = router4;

// server/src/routes/payments.ts
import { Router as Router5 } from "express";
import crypto from "crypto";
var router5 = Router5();
var PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "SANDBOX_MERCHANT_ID";
var PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "SANDBOX_MERCHANT_KEY";
var PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
var APP_URL = process.env.APP_URL || "http://localhost:3000";
router5.get("/", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { customer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve payments" });
  }
});
router5.get("/my", requireAuth, requireRoles("Customer"), async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { customerId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve payments" });
  }
});
router5.post("/initiate", requireAuth, requireRoles("Customer"), async (req, res) => {
  const { type, amount } = req.body;
  if (!type || !amount) return res.status(400).json({ error: "type and amount are required" });
  try {
    const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const payment = await prisma.payment.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        type,
        amount,
        status: "Pending",
        date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      }
    });
    const pfData = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: `${APP_URL}/payment/success?paymentId=${payment.id}`,
      cancel_url: `${APP_URL}/payment/cancelled`,
      notify_url: `${APP_URL}/api/payments/webhook`,
      name_first: customer.name.split(" ")[0],
      name_last: customer.name.split(" ").slice(1).join(" ") || "Client",
      email_address: customer.email,
      m_payment_id: payment.id,
      amount: amount.toFixed(2),
      item_name: `Same Day Assist - ${type}`
    };
    if (PAYFAST_PASSPHRASE) pfData.passphrase = PAYFAST_PASSPHRASE;
    const pfString = Object.keys(pfData).filter((k) => k !== "passphrase" || PAYFAST_PASSPHRASE).map((k) => `${k}=${encodeURIComponent(pfData[k].trim())}`).join("&");
    const signature = crypto.createHash("md5").update(pfString).digest("hex");
    pfData.signature = signature;
    const isSandbox = !process.env.PAYFAST_MERCHANT_ID;
    const pfHost = isSandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";
    return res.json({
      paymentId: payment.id,
      pfHost,
      pfData,
      checkoutUrl: `https://${pfHost}/eng/process`
    });
  } catch (error) {
    console.error("[Payments/Initiate]", error);
    return res.status(500).json({ error: "Failed to initiate payment" });
  }
});
router5.post("/webhook", async (req, res) => {
  try {
    const pfData = req.body;
    const paymentId = pfData.m_payment_id;
    if (!paymentId) return res.status(400).send("Missing payment ID");
    const pfParamString = Object.keys(pfData).filter((k) => k !== "signature").map((k) => `${k}=${encodeURIComponent(pfData[k].trim())}`).join("&");
    const calculatedSignature = crypto.createHash("md5").update(pfParamString).digest("hex");
    if (pfData.payment_status !== "COMPLETE" || calculatedSignature !== pfData.signature) {
      console.warn("[Payments/Webhook] Signature mismatch or incomplete payment");
      return res.status(400).send("Invalid payment");
    }
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).send("Payment not found");
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "Paid" } });
    const customer = await prisma.user.findUnique({ where: { id: payment.customerId } });
    if (customer && payment.type === "Onboarding Fee") {
      await prisma.user.update({
        where: { id: payment.customerId },
        data: {
          status: "Active Member",
          memberSince: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          totalPaid: { increment: payment.amount }
        }
      });
      await writeAuditLog({
        userId: payment.customerId,
        userType: "Customer",
        action: "Membership Activated",
        details: `Customer ${customer.name} completed onboarding payment of R${payment.amount}. Membership is now ACTIVE.`,
        newValue: { status: "Active Member", paymentId }
      });
    }
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[Payments/Webhook]", error);
    return res.status(500).send("Server error");
  }
});
var payments_default = router5;

// server/src/routes/auditLogs.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/", requireAuth, requireRoles("Super Administrator"), async (req, res) => {
  try {
    const { limit = "50", offset = "0", action, userId } = req.query;
    const where = {};
    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { timestamp: "desc" },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.auditLog.count({ where })
    ]);
    return res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve audit logs" });
  }
});
var auditLogs_default = router6;

// server/src/routes/files.ts
import { Router as Router7 } from "express";
import multer from "multer";

// server/src/services/storage.ts
import path2 from "path";
import fs2 from "fs";
var UPLOAD_DIR = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? path2.join("/tmp", "uploads") : path2.join(process.cwd(), "uploads");
try {
  if (!fs2.existsSync(UPLOAD_DIR)) {
    fs2.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[Storage] mkdir warning:", e);
}
async function saveFile(buffer, originalName, mimeType) {
  const ext = originalName.split(".").pop() || "bin";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path2.join(UPLOAD_DIR, uniqueName);
  fs2.writeFileSync(filePath, buffer);
  return `/uploads/${uniqueName}`;
}

// server/src/routes/files.ts
var router7 = Router7();
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
var ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf"
];
router7.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `File type ${req.file.mimetype} not permitted` });
    }
    const { jobId, assessmentId, quotationId, customerId } = req.body;
    const savedUrl = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const record = await prisma.fileRecord.create({
      data: {
        filename: savedUrl.split("/").pop() || req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
        url: savedUrl,
        uploadedById: req.user.id,
        customerId: customerId || null,
        jobId: jobId || null,
        assessmentId: assessmentId || null,
        quotationId: quotationId || null
      }
    });
    return res.status(201).json(record);
  } catch (error) {
    console.error("[Files/Upload]", error);
    return res.status(500).json({ error: "Failed to upload file" });
  }
});
router7.get("/:id", requireAuth, async (req, res) => {
  try {
    const record = await prisma.fileRecord.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ error: "File not found" });
    return res.json(record);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve file" });
  }
});
var files_default = router7;

// server/src/routes/reports.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.get("/dashboard", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const [
      totalCustomers,
      activeMembers,
      pendingEnquiries,
      openJobs,
      completedJobs,
      totalRevenue,
      availableContractors,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count({ where: { role: "Customer" } }),
      prisma.user.count({ where: { role: "Customer", status: "Active Member" } }),
      prisma.enquiry.count({ where: { status: "Pending" } }),
      prisma.job.count({ where: { status: { notIn: ["Completed", "Closed", "Archived"] } } }),
      prisma.job.count({ where: { status: { in: ["Completed", "Closed"] } } }),
      prisma.payment.aggregate({ where: { status: "Paid" }, _sum: { amount: true } }),
      prisma.user.count({ where: { role: "Contractor", isAvailable: true } }),
      prisma.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 10 })
    ]);
    const totalJobs = openJobs + completedJobs;
    const completionRate = totalJobs > 0 ? Math.round(completedJobs / totalJobs * 100) : 0;
    const contractors = await prisma.user.findMany({
      where: { role: "Contractor", rating: { not: null } },
      select: { rating: true }
    });
    const avgContractorRating = contractors.length > 0 ? Math.round(contractors.reduce((sum, c) => sum + (c.rating || 0), 0) / contractors.length * 10) / 10 : 0;
    const pendingQuotations = await prisma.quotation.count({ where: { status: "Pending" } });
    const now = /* @__PURE__ */ new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthlyRevenue = await prisma.payment.aggregate({
      where: { status: "Paid", date: { gte: monthStart } },
      _sum: { amount: true }
    });
    return res.json({
      totalCustomers,
      activeMembers,
      pendingEnquiries,
      openJobs,
      completedJobs,
      completionRate,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      availableContractors,
      pendingQuotations,
      avgContractorRating,
      recentAuditLogs
    });
  } catch (error) {
    console.error("[Reports/Dashboard]", error);
    return res.status(500).json({ error: "Failed to generate dashboard report" });
  }
});
router8.get("/contractors", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const contractors = await prisma.user.findMany({
      where: { role: "Contractor" },
      select: {
        id: true,
        name: true,
        specialty: true,
        rating: true,
        isAvailable: true,
        workload: true,
        certifications: true,
        jobsAsContractor: {
          select: { id: true, status: true, rating: true, createdAt: true, completedAt: true }
        }
      }
    });
    const report = contractors.map((c) => {
      const totalJobs = c.jobsAsContractor.length;
      const completedJobs = c.jobsAsContractor.filter((j) => ["Completed", "Closed"].includes(j.status)).length;
      const avgResponseTime = completedJobs > 0 ? c.jobsAsContractor.filter((j) => j.completedAt).reduce((sum, j) => {
        const diff = new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime();
        return sum + diff / 6e4;
      }, 0) / completedJobs : 0;
      return {
        id: c.id,
        name: c.name,
        specialty: c.specialty,
        rating: c.rating,
        isAvailable: c.isAvailable,
        workload: c.workload,
        certifications: c.certifications ? JSON.parse(c.certifications) : [],
        totalJobs,
        completedJobs,
        completionRate: totalJobs > 0 ? Math.round(completedJobs / totalJobs * 100) : 0,
        avgResponseTimeMinutes: Math.round(avgResponseTime)
      };
    });
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate contractor report" });
  }
});
router8.get("/revenue", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { status: "Paid" };
    if (from) where.date = { ...where.date, gte: from };
    if (to) where.date = { ...where.date, lte: to };
    const payments = await prisma.payment.findMany({
      where,
      include: { customer: { select: { name: true, package: true } } },
      orderBy: { date: "desc" }
    });
    const byType = payments.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount;
      return acc;
    }, {});
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    return res.json({ payments, byType, total });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate revenue report" });
  }
});
router8.get("/customers/:id/timeline", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        jobsAsCustomer: {
          include: {
            assignedContractor: { select: { name: true, specialty: true } },
            fileRecords: true
          },
          orderBy: { createdAt: "desc" }
        },
        payments: { orderBy: { createdAt: "desc" } },
        auditLogs: { orderBy: { timestamp: "desc" }, take: 50 },
        fileRecords: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const enquiries = await prisma.enquiry.findMany({
      where: { email: customer.email },
      include: {
        assessments: { include: { contractor: { select: { name: true } } } },
        quotations: true
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ customer, enquiries });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve customer timeline" });
  }
});
var reports_default = router8;

// server/src/routes/locations.ts
import { Router as Router9 } from "express";
var router9 = Router9();
router9.get("/", requireAuth, async (req, res) => {
  try {
    const locations = await prisma.savedLocation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    return res.json(locations);
  } catch (error) {
    console.error("[Locations/GET]", error);
    return res.status(500).json({ error: "Failed to fetch saved locations" });
  }
});
router9.post("/", requireAuth, async (req, res) => {
  const { label, address, lat, lng, accessNotes } = req.body;
  if (!label || !address || lat === void 0 || lng === void 0) {
    return res.status(400).json({ error: "Label, address, latitude, and longitude are required." });
  }
  try {
    const location = await prisma.savedLocation.create({
      data: {
        userId: req.user.id,
        label,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        accessNotes: accessNotes || null
      }
    });
    return res.status(201).json(location);
  } catch (error) {
    console.error("[Locations/POST]", error);
    return res.status(500).json({ error: "Failed to create saved location" });
  }
});
router9.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await prisma.savedLocation.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Saved location not found" });
    }
    await prisma.savedLocation.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Saved location deleted successfully" });
  } catch (error) {
    console.error("[Locations/DELETE]", error);
    return res.status(500).json({ error: "Failed to delete saved location" });
  }
});
var locations_default = router9;

// server/src/routes/contacts.ts
import { Router as Router10 } from "express";
var router10 = Router10();
router10.get("/", requireAuth, async (req, res) => {
  try {
    const contacts = await prisma.authorisedContact.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    return res.json(contacts);
  } catch (error) {
    console.error("[Contacts/GET]", error);
    return res.status(500).json({ error: "Failed to fetch authorised contacts" });
  }
});
router10.post("/", requireAuth, async (req, res) => {
  const { name, email, phone, position, permissions } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Name, email, and phone number are required." });
  }
  try {
    const contact = await prisma.authorisedContact.create({
      data: {
        userId: req.user.id,
        name,
        email: email.trim().toLowerCase(),
        phone,
        position: position || "Representative",
        permissions: permissions || "Full"
      }
    });
    return res.status(201).json(contact);
  } catch (error) {
    console.error("[Contacts/POST]", error);
    return res.status(500).json({ error: "Failed to create authorised contact" });
  }
});
router10.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await prisma.authorisedContact.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Authorised contact not found" });
    }
    await prisma.authorisedContact.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Authorised contact removed successfully" });
  } catch (error) {
    console.error("[Contacts/DELETE]", error);
    return res.status(500).json({ error: "Failed to delete contact" });
  }
});
var contacts_default = router10;

// server/src/routes/profileRequests.ts
import { Router as Router11 } from "express";
var router11 = Router11();
router11.get("/", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const requests = await prisma.profileUpdateRequest.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, phone: true }
        }
      },
      orderBy: { requestedAt: "desc" }
    });
    const parsed = requests.map((r) => ({
      ...r,
      proposedChanges: JSON.parse(r.proposedChanges)
    }));
    return res.json(parsed);
  } catch (error) {
    console.error("[ProfileRequests/GET]", error);
    return res.status(500).json({ error: "Failed to fetch profile requests" });
  }
});
router11.post("/:id/approve", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const profileReq = await prisma.profileUpdateRequest.findUnique({ where: { id: req.params.id } });
    if (!profileReq) return res.status(404).json({ error: "Profile update request not found" });
    if (profileReq.status !== "Pending") {
      return res.status(400).json({ error: `Request has already been ${profileReq.status}` });
    }
    const proposed = JSON.parse(profileReq.proposedChanges);
    await prisma.user.update({
      where: { id: profileReq.userId },
      data: {
        ...proposed,
        lastProfileUpdateAt: /* @__PURE__ */ new Date()
      }
    });
    const updatedReq = await prisma.profileUpdateRequest.update({
      where: { id: req.params.id },
      data: {
        status: "Approved",
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedBy: req.user.id
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Approve Profile Update",
      details: `Approved profile update request ${profileReq.id} for user ${profileReq.userId}`
    });
    return res.json({ success: true, request: updatedReq });
  } catch (error) {
    console.error("[ProfileRequests/Approve]", error);
    return res.status(500).json({ error: "Failed to approve profile update" });
  }
});
router11.post("/:id/reject", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  const { rejectionReason } = req.body;
  try {
    const profileReq = await prisma.profileUpdateRequest.findUnique({ where: { id: req.params.id } });
    if (!profileReq) return res.status(404).json({ error: "Profile update request not found" });
    const updatedReq = await prisma.profileUpdateRequest.update({
      where: { id: req.params.id },
      data: {
        status: "Rejected",
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedBy: req.user.id,
        rejectionReason: rejectionReason || "Information provided could not be verified."
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Reject Profile Update",
      details: `Rejected profile update request ${profileReq.id} for user ${profileReq.userId}`
    });
    return res.json({ success: true, request: updatedReq });
  } catch (error) {
    console.error("[ProfileRequests/Reject]", error);
    return res.status(500).json({ error: "Failed to reject profile update" });
  }
});
router11.post("/override-lock/:userId", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    await prisma.user.update({
      where: { id: req.params.userId },
      data: { lastProfileUpdateAt: null }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Override Profile Lock",
      details: `Administrator ${req.user.email} bypassed 60-day profile edit lock for user ${targetUser.email}`
    });
    return res.json({ success: true, message: `Profile edit lock successfully bypassed for ${targetUser.name}` });
  } catch (error) {
    console.error("[ProfileRequests/OverrideLock]", error);
    return res.status(500).json({ error: "Failed to override profile lock" });
  }
});
var profileRequests_default = router11;

// server/src/routes/jobs.ts
import { Router as Router12 } from "express";
var router12 = Router12();
function createJobsRouter(io) {
  router12.get("/", requireAuth, requireRoles("Administrator", "Super Administrator", "Contractor", "Dispatcher"), async (req, res) => {
    try {
      let jobs;
      if (req.user.role === "Contractor") {
        jobs = await prisma.job.findMany({
          where: { assignedContractorId: req.user.id },
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } }
          },
          orderBy: { createdAt: "desc" }
        });
      } else {
        jobs = await prisma.job.findMany({
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } }
          },
          orderBy: { createdAt: "desc" }
        });
      }
      const formatted = jobs.map((j) => ({
        ...j,
        customerName: j.customer?.name || "Valued Member",
        customerAddress: j.customer?.address || "Sandton, Johannesburg",
        customerPhone: j.customer?.phone || ""
      }));
      return res.json(formatted);
    } catch (error) {
      return res.status(500).json({ error: "Failed to retrieve jobs" });
    }
  });
  router12.get("/my", requireAuth, requireRoles("Customer"), async (req, res) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { customerId: req.user.id },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      const formatted = jobs.map((j) => ({
        ...j,
        customerName: j.customer?.name || "Valued Member",
        customerAddress: j.customer?.address || "Sandton, Johannesburg",
        customerPhone: j.customer?.phone || ""
      }));
      return res.json(formatted);
    } catch (error) {
      return res.status(500).json({ error: "Failed to retrieve jobs" });
    }
  });
  router12.post("/", requireAuth, requireRoles("Customer"), validate(jobCreateSchema), async (req, res) => {
    try {
      const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      const statusUpper = (customer.status || "").toUpperCase();
      if (statusUpper !== "ACTIVE MEMBER" && statusUpper !== "ACTIVE") {
        return res.status(403).json({ error: "Your account is still undergoing onboarding." });
      }
      const job = await prisma.job.create({
        data: {
          customerId: req.user.id,
          serviceType: req.body.serviceType,
          description: req.body.description,
          photoUrl: req.body.photoUrl,
          status: "Requested",
          trackerProgress: 10
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } }
        }
      });
      const formattedJob = {
        ...job,
        customerName: customer.name,
        customerAddress: customer.address,
        customerPhone: customer.phone
      };
      io?.to("admin-room").emit("new-job", formattedJob);
      await writeAuditLog({
        userId: req.user.id,
        userType: "Customer",
        action: "On-Demand Service Requested",
        details: `Customer ${customer.name} requested service: ${req.body.serviceType} \u2014 "${req.body.description}"`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { jobId: job.id, serviceType: job.serviceType }
      });
      return res.status(201).json(formattedJob);
    } catch (error) {
      console.error("[Jobs/Create]", error);
      return res.status(500).json({ error: "Failed to create job request" });
    }
  });
  router12.patch("/:id/assign", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher"), async (req, res) => {
    const { contractorId } = req.body;
    if (!contractorId) return res.status(400).json({ error: "contractorId is required" });
    try {
      const [job, contractor] = await Promise.all([
        prisma.job.findUnique({ where: { id: req.params.id }, include: { customer: true } }),
        prisma.user.findUnique({ where: { id: contractorId } })
      ]);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (!contractor || contractor.role !== "Contractor") return res.status(400).json({ error: "Invalid contractor" });
      const prevStatus = job.status;
      const vehicleInfo = JSON.stringify({
        make: "Toyota",
        model: "Hilux 4x4 Response Unit",
        licensePlate: "SDA-01-GP",
        color: "White"
      });
      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          assignedContractorId: contractorId,
          status: "Service Provider Assigned",
          trackerProgress: 35,
          assignedAt: /* @__PURE__ */ new Date(),
          vehicleInfo,
          currentLat: contractor.lat || -26.2041,
          currentLng: contractor.lng || 28.0473,
          estimatedArrivalMinutes: 15,
          distanceRemainingKm: 4.5
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true } }
        }
      });
      await prisma.user.update({ where: { id: contractorId }, data: { workload: { increment: 1 } } });
      io.to(`contractor-${contractorId}`).emit("job-assigned", updated);
      io.to(`customer-${job.customerId}`).emit("job-updated", updated);
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Service Provider Assigned",
        details: `Dispatched ${contractor.name} to Job ${req.params.id} for ${job.customer.name}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        previousValue: { status: prevStatus },
        newValue: { status: "Service Provider Assigned", contractorId, contractorName: contractor.name }
      });
      return res.json(updated);
    } catch (error) {
      console.error("[Jobs/Assign]", error);
      return res.status(500).json({ error: "Failed to assign contractor" });
    }
  });
  router12.patch("/:id/status", requireAuth, async (req, res) => {
    const { status } = req.body;
    const progressMap = {
      "Request Received": 10,
      "Request Under Review": 20,
      "Service Provider Assigned": 35,
      "Preparing for Dispatch": 45,
      "Dispatched": 60,
      "En Route": 75,
      "Arrived": 85,
      "Service In Progress": 95,
      "Service Completed": 100
    };
    if (progressMap[status] === void 0) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }
    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: "Job not found" });
      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          status,
          trackerProgress: progressMap[status],
          completedAt: status === "Service Completed" ? /* @__PURE__ */ new Date() : job.completedAt
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, lat: true, lng: true } }
        }
      });
      io.to(`customer-${job.customerId}`).emit("job-updated", updated);
      io.to("admin-room").emit("job-updated", updated);
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Job Status Updated",
        details: `Updated job ${req.params.id} status to "${status}"`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        previousValue: { status: job.status },
        newValue: { status }
      });
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update job status" });
    }
  });
  router12.patch("/:id/location", requireAuth, async (req, res) => {
    const { lat, lng, estimatedArrivalMinutes, distanceRemainingKm } = req.body;
    if (lat === void 0 || lng === void 0) return res.status(400).json({ error: "lat and lng are required" });
    try {
      const job = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          currentLat: parseFloat(lat),
          currentLng: parseFloat(lng),
          estimatedArrivalMinutes: estimatedArrivalMinutes !== void 0 ? parseInt(estimatedArrivalMinutes) : void 0,
          distanceRemainingKm: distanceRemainingKm !== void 0 ? parseFloat(distanceRemainingKm) : void 0
        }
      });
      const locationPayload = {
        jobId: req.params.id,
        currentLat: parseFloat(lat),
        currentLng: parseFloat(lng),
        estimatedArrivalMinutes: job.estimatedArrivalMinutes,
        distanceRemainingKm: job.distanceRemainingKm
      };
      io.to(`customer-${job.customerId}`).emit("contractor-location", locationPayload);
      io.to("admin-room").emit("contractor-location", locationPayload);
      return res.json({ success: true, location: locationPayload });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update live GPS location" });
    }
  });
  router12.post("/:id/complete", requireAuth, requireRoles("Contractor"), validate(completionSchema), async (req, res) => {
    const { contractorNotes, contractorSignature, completionPhoto } = req.body;
    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { customer: true } });
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.assignedContractorId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
      if (!["Arrived", "Repair In Progress", "Quality Inspection"].includes(job.status)) {
        return res.status(400).json({ error: `Cannot complete job in status: ${job.status}` });
      }
      const [updated] = await prisma.$transaction([
        prisma.job.update({
          where: { id: req.params.id },
          data: {
            status: "Completed",
            trackerProgress: 100,
            completedAt: /* @__PURE__ */ new Date(),
            contractorNotes,
            contractorSignature,
            completionPhoto
          },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            assignedContractor: { select: { id: true, name: true } }
          }
        }),
        // Decrement contractor workload
        prisma.user.update({
          where: { id: req.user.id },
          data: { workload: { decrement: 1 } }
        })
      ]);
      io.to(`customer-${job.customerId}`).emit("job-updated", updated);
      io.to("admin-room").emit("job-updated", updated);
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Job Completed",
        details: `Contractor resolved Job ${req.params.id} for ${job.customer.name}. Digital signature and completion report uploaded.`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { status: "Completed", hasSignature: !!contractorSignature }
      });
      return res.json(updated);
    } catch (error) {
      console.error("[Jobs/Complete]", error);
      return res.status(500).json({ error: "Failed to complete job" });
    }
  });
  router12.post("/:id/rate", requireAuth, requireRoles("Customer"), validate(ratingSchema), async (req, res) => {
    const { rating, ratingComment } = req.body;
    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.customerId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
      if (job.status !== "Completed") return res.status(400).json({ error: "Job must be Completed before rating" });
      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: "Closed", rating, ratingComment, closedAt: /* @__PURE__ */ new Date() }
      });
      if (job.assignedContractorId) {
        const contractorJobs = await prisma.job.findMany({
          where: { assignedContractorId: job.assignedContractorId, rating: { not: null } },
          select: { rating: true }
        });
        const avgRating = contractorJobs.reduce((sum, j) => sum + (j.rating || 0), 0) / contractorJobs.length;
        await prisma.user.update({
          where: { id: job.assignedContractorId },
          data: { rating: Math.round(avgRating * 10) / 10 }
        });
      }
      io.to("admin-room").emit("job-updated", updated);
      await writeAuditLog({
        userId: req.user.id,
        userType: "Customer",
        action: "Job Rated",
        details: `Customer rated Job ${req.params.id} with ${rating}/5 stars`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { rating, ratingComment, status: "Closed" }
      });
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to rate job" });
    }
  });
  router12.patch("/:id/close", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher"), async (req, res) => {
    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: "Job not found" });
      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: "Closed", closedAt: /* @__PURE__ */ new Date() }
      });
      io.to("admin-room").emit("job-updated", updated);
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Job Closed",
        details: `Administrator officially closed Job Card ${req.params.id}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        previousValue: { status: job.status },
        newValue: { status: "Closed" }
      });
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to close job" });
    }
  });
  return router12;
}

// server/src/routes/verification.ts
import { Router as Router13 } from "express";
var router13 = Router13();
router13.post("/apply", requireAuth, requireRoles("Contractor"), async (req, res) => {
  const {
    yearsOfExperience,
    businessLicenseUrl,
    taxClearanceUrl,
    insuranceProofUrl,
    policeClearanceUrl,
    tradeQualificationsUrl,
    coverageAreas
  } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        verificationStatus: "Pending Review",
        yearsOfExperience: parseInt(yearsOfExperience || "1", 10),
        businessLicenseUrl: businessLicenseUrl || null,
        taxClearanceUrl: taxClearanceUrl || null,
        insuranceProofUrl: insuranceProofUrl || null,
        policeClearanceUrl: policeClearanceUrl || null,
        tradeQualificationsUrl: tradeQualificationsUrl || null,
        coverageAreaJson: Array.isArray(coverageAreas) ? JSON.stringify(coverageAreas) : JSON.stringify([coverageAreas])
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Submit Verification Documents",
      details: `Service Provider ${req.user.email} submitted compliance documentation for vetting review.`
    });
    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error("[Verification/Apply]", error);
    return res.status(500).json({ error: "Failed to submit verification application" });
  }
});
router13.get("/applications", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher"), async (req, res) => {
  try {
    const contractors = await prisma.user.findMany({
      where: { role: "Contractor" },
      include: { providerAwards: true },
      orderBy: { createdAt: "desc" }
    });
    return res.json(contractors);
  } catch (error) {
    console.error("[Verification/Applications]", error);
    return res.status(500).json({ error: "Failed to fetch verification applications" });
  }
});
router13.post("/:id/approve", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  try {
    const contractor = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: "Approved",
        verifiedAt: /* @__PURE__ */ new Date(),
        isAvailable: true
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Approve Contractor Vetting",
      details: `Administrator ${req.user.email} approved compliance documents for contractor ${contractor.email}`
    });
    return res.json({ success: true, contractor });
  } catch (error) {
    console.error("[Verification/Approve]", error);
    return res.status(500).json({ error: "Failed to approve contractor application" });
  }
});
router13.post("/:id/request-info", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  const { notes } = req.body;
  try {
    const contractor = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: "Information Requested",
        verificationNotes: notes || "Additional documents or clarifications required."
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Request Additional Info for Vetting",
      details: `Requested info for contractor ${contractor.email}: ${notes}`
    });
    return res.json({ success: true, contractor });
  } catch (error) {
    console.error("[Verification/RequestInfo]", error);
    return res.status(500).json({ error: "Failed to request info" });
  }
});
router13.post("/:id/reject", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  const { reason } = req.body;
  try {
    const contractor = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: "Rejected",
        verificationNotes: reason || "Application did not meet compliance requirements.",
        isAvailable: false
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Reject Contractor Vetting",
      details: `Rejected contractor ${contractor.email}: ${reason}`
    });
    return res.json({ success: true, contractor });
  } catch (error) {
    console.error("[Verification/Reject]", error);
    return res.status(500).json({ error: "Failed to reject application" });
  }
});
router13.post("/:id/award-badge", requireAuth, requireRoles("Administrator", "Super Administrator"), async (req, res) => {
  const { title, category, iconName } = req.body;
  try {
    const award = await prisma.providerAward.create({
      data: {
        contractorId: req.params.id,
        title: title || "Certificated Top Performer",
        category: category || "Performance Excellence",
        iconName: iconName || "Award"
      }
    });
    const contractor = await prisma.user.findUnique({ where: { id: req.params.id }, include: { providerAwards: true } });
    if (contractor) {
      const titles = contractor.providerAwards.map((a) => a.title);
      await prisma.user.update({
        where: { id: req.params.id },
        data: {
          badgeTitles: JSON.stringify(titles),
          isFeatured: true
        }
      });
    }
    return res.json({ success: true, award });
  } catch (error) {
    console.error("[Verification/AwardBadge]", error);
    return res.status(500).json({ error: "Failed to award badge" });
  }
});
var verification_default = router13;

// server/src/routes/ratings.ts
import { Router as Router14 } from "express";
var router14 = Router14();
router14.post("/job/:jobId", requireAuth, requireRoles("Customer"), async (req, res) => {
  const {
    professionalism,
    punctuality,
    responseTime,
    communication,
    qualityOfWork,
    friendliness,
    problemResolution,
    overallSatisfaction,
    writtenFeedback,
    photoBeforeUrl,
    photoAfterUrl
  } = req.body;
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      include: { assignedContractor: true }
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.customerId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to rate this job" });
    }
    if (!job.assignedContractorId) {
      return res.status(400).json({ error: "No contractor assigned to this job" });
    }
    const rating = await prisma.jobRating.create({
      data: {
        jobId: job.id,
        customerId: req.user.id,
        contractorId: job.assignedContractorId,
        professionalism: parseInt(professionalism || "5", 10),
        punctuality: parseInt(punctuality || "5", 10),
        responseTime: parseInt(responseTime || "5", 10),
        communication: parseInt(communication || "5", 10),
        qualityOfWork: parseInt(qualityOfWork || "5", 10),
        friendliness: parseInt(friendliness || "5", 10),
        problemResolution: parseInt(problemResolution || "5", 10),
        overallSatisfaction: parseInt(overallSatisfaction || "5", 10),
        writtenFeedback: writtenFeedback || null,
        photoBeforeUrl: photoBeforeUrl || null,
        photoAfterUrl: photoAfterUrl || null
      }
    });
    const overall = parseInt(overallSatisfaction || "5", 10);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        rating: overall,
        ratingComment: writtenFeedback || null,
        photoBeforeUrl: photoBeforeUrl || job.photoBeforeUrl,
        photoAfterUrl: photoAfterUrl || job.photoAfterUrl
      }
    });
    const contractorRatings = await prisma.jobRating.findMany({
      where: { contractorId: job.assignedContractorId }
    });
    if (contractorRatings.length > 0) {
      const avgScore = contractorRatings.reduce((sum, r) => sum + r.overallSatisfaction, 0) / contractorRatings.length;
      await prisma.user.update({
        where: { id: job.assignedContractorId },
        data: { rating: parseFloat(avgScore.toFixed(2)) }
      });
    }
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Submit Job Rating",
      details: `Customer submitted 8-D rating for job ${job.id} (Satisfaction: ${overall}/5 stars).`
    });
    return res.json({ success: true, rating });
  } catch (error) {
    console.error("[Ratings/Job]", error);
    return res.status(500).json({ error: "Failed to submit rating" });
  }
});
router14.get("/contractor/:contractorId", requireAuth, async (req, res) => {
  try {
    const ratings = await prisma.jobRating.findMany({
      where: { contractorId: req.params.contractorId },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
    const contractor = await prisma.user.findUnique({
      where: { id: req.params.contractorId },
      include: { providerAwards: true, jobsAsContractor: true }
    });
    if (!contractor) return res.status(404).json({ error: "Contractor not found" });
    const count = ratings.length || 1;
    const metrics = {
      professionalism: (ratings.reduce((sum, r) => sum + r.professionalism, 0) / count).toFixed(1),
      punctuality: (ratings.reduce((sum, r) => sum + r.punctuality, 0) / count).toFixed(1),
      responseTime: (ratings.reduce((sum, r) => sum + r.responseTime, 0) / count).toFixed(1),
      communication: (ratings.reduce((sum, r) => sum + r.communication, 0) / count).toFixed(1),
      qualityOfWork: (ratings.reduce((sum, r) => sum + r.qualityOfWork, 0) / count).toFixed(1),
      friendliness: (ratings.reduce((sum, r) => sum + r.friendliness, 0) / count).toFixed(1),
      problemResolution: (ratings.reduce((sum, r) => sum + r.problemResolution, 0) / count).toFixed(1),
      overallSatisfaction: (ratings.reduce((sum, r) => sum + r.overallSatisfaction, 0) / count).toFixed(1)
    };
    const completedJobs = contractor.jobsAsContractor.filter((j) => j.status === "Service Completed").length;
    const totalAssigned = contractor.jobsAsContractor.length || 1;
    const completionRate = Math.round(completedJobs / totalAssigned * 100);
    return res.json({
      contractor: {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        rating: contractor.rating,
        yearsOfExperience: contractor.yearsOfExperience,
        verificationStatus: contractor.verificationStatus,
        isFeatured: contractor.isFeatured,
        providerAwards: contractor.providerAwards
      },
      metrics,
      totalRatings: ratings.length,
      completionRate,
      completedJobs,
      ratings
    });
  } catch (error) {
    console.error("[Ratings/GetContractor]", error);
    return res.status(500).json({ error: "Failed to fetch contractor performance" });
  }
});
var ratings_default = router14;

// server/src/routes/messages.ts
import { Router as Router15 } from "express";
var router15 = Router15();
router15.get("/job/:jobId", requireAuth, async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { jobId: req.params.jobId },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    const parsed = messages.map((m) => ({
      ...m,
      senderName: m.sender.name
    }));
    return res.json(parsed);
  } catch (error) {
    console.error("[Messages/GET]", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});
router15.post("/job/:jobId", requireAuth, async (req, res) => {
  const { text, attachmentUrl, recipientId } = req.body;
  if (!text && !attachmentUrl) {
    return res.status(400).json({ error: "Message text or attachment required" });
  }
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    const targetRecipientId = recipientId || (req.user.id === job.customerId ? job.assignedContractorId : job.customerId);
    if (!targetRecipientId) {
      return res.status(400).json({ error: "Recipient cannot be determined" });
    }
    const message = await prisma.chatMessage.create({
      data: {
        jobId: job.id,
        senderId: req.user.id,
        recipientId: targetRecipientId,
        senderRole: req.user.role,
        text: text || "",
        attachmentUrl: attachmentUrl || null
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });
    const io = req.app.get("io");
    if (io) {
      const payload = {
        ...message,
        senderName: message.sender.name
      };
      io.to(`customer-${job.customerId}`).emit("new-chat-message", payload);
      if (job.assignedContractorId) {
        io.to(`contractor-${job.assignedContractorId}`).emit("new-chat-message", payload);
      }
      io.to("admin-room").emit("new-chat-message", payload);
    }
    return res.json({
      ...message,
      senderName: message.sender.name
    });
  } catch (error) {
    console.error("[Messages/POST]", error);
    return res.status(500).json({ error: "Failed to send chat message" });
  }
});
var messages_default = router15;

// server/src/routes/wallet.ts
import { Router as Router16 } from "express";
var router16 = Router16();
router16.get("/balance", requireAuth, async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
      include: {
        transactions: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: req.user.id,
          balance: 2500,
          // Default ZAR 2,500 complimentary signup credit balance
          currency: "ZAR",
          transactions: {
            create: {
              amount: 2500,
              type: "Bonus Reward",
              description: "Complimentary Same Day Assist Welcome Wallet Balance"
            }
          }
        },
        include: {
          transactions: { orderBy: { createdAt: "desc" } }
        }
      });
    }
    return res.json(wallet);
  } catch (error) {
    console.error("[Wallet/Balance]", error);
    return res.status(500).json({ error: "Failed to fetch wallet details" });
  }
});
router16.post("/top-up", requireAuth, async (req, res) => {
  const { amount, description } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "Valid positive top-up amount required" });
  }
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: req.user.id, balance: 0, currency: "ZAR" }
      });
    }
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: numAmount },
        transactions: {
          create: {
            amount: numAmount,
            type: "TopUp",
            description: description || "Digital Wallet Credit Top-Up via Card/EFT"
          }
        }
      },
      include: {
        transactions: { orderBy: { createdAt: "desc" } }
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Wallet Top-Up",
      details: `User topped up wallet by ZAR ${numAmount}. New Balance: ZAR ${updatedWallet.balance}`
    });
    return res.json({ success: true, wallet: updatedWallet });
  } catch (error) {
    console.error("[Wallet/TopUp]", error);
    return res.status(500).json({ error: "Failed to top up wallet" });
  }
});
var wallet_default = router16;

// server/src/vercel-handler.ts
dotenv.config();
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "sda-access-secret-key-12345";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "sda-refresh-secret-key-67890";
try {
  const tmpDbPath = path3.join("/tmp", "dev.db");
  if (!fs3.existsSync(tmpDbPath)) {
    const srcDb = path3.join(process.cwd(), "prisma", "dev.db");
    if (fs3.existsSync(srcDb)) {
      fs3.copyFileSync(srcDb, tmpDbPath);
    } else {
      const rootDb = path3.join(process.cwd(), "dev.db");
      if (fs3.existsSync(rootDb)) fs3.copyFileSync(rootDb, tmpDbPath);
    }
  }
} catch (e) {
  console.error("[Vercel DB Init]", e);
}
var app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString(), database: "connected" });
  } catch (error) {
    return res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString(), note: String(error) });
  }
});
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString(), database: "connected" });
  } catch (error) {
    return res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString(), note: String(error) });
  }
});
app.use("/api/auth", auth_default);
app.use("/api/enquiries", enquiries_default);
app.use("/api/assessments", assessments_default);
app.use("/api/quotations", quotations_default);
app.use("/api/jobs", createJobsRouter());
app.use("/api/payments", payments_default);
app.use("/api/audit-logs", auditLogs_default);
app.use("/api/files", files_default);
app.use("/api/reports", reports_default);
app.use("/api/locations", locations_default);
app.use("/api/contacts", contacts_default);
app.use("/api/profile-requests", profileRequests_default);
app.use("/api/verification", verification_default);
app.use("/api/ratings", ratings_default);
app.use("/api/messages", messages_default);
app.use("/api/wallet", wallet_default);
var vercel_handler_default = app;
export {
  vercel_handler_default as default
};
