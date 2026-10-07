import { createRequire } from 'module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@prisma/client/default.js
var require_default = __commonJS({
  "node_modules/@prisma/client/default.js"(exports, module) {
    module.exports = {
      ...__require(".prisma/client/default")
    };
  }
});

// server/src/config/plans.ts
var plans_exports = {};
__export(plans_exports, {
  MEMBERSHIP_PLANS: () => MEMBERSHIP_PLANS,
  PLANS: () => PLANS,
  PLANS_LIST: () => PLANS_LIST,
  getPlanById: () => getPlanById,
  getPlanConfig: () => getPlanConfig,
  isPartsBenefitZero: () => isPartsBenefitZero
});
function getPlanById(planId) {
  const normalized = (planId || "").toLowerCase().replace(/[\s-]/g, "_");
  return MEMBERSHIP_PLANS[normalized] || MEMBERSHIP_PLANS["assist_plus"];
}
function isPartsBenefitZero(planId) {
  return getPlanById(planId).isPartsBenefitZero === true;
}
var MEMBERSHIP_PLANS, PLANS, PLANS_LIST, getPlanConfig;
var init_plans = __esm({
  "server/src/config/plans.ts"() {
    MEMBERSHIP_PLANS = {
      assist: {
        id: "assist",
        name: "Assist",
        monthlyPrice: 799,
        annualBenefit: 0,
        partsBenefitDescription: "R0 Parts Benefit",
        badge: "Essential Labour",
        description: "Rapid emergency response, fault finding, and certified technician labour for cost-conscious members.",
        benefits: [
          "Same-day assistance",
          "Labour & fault finding",
          "Parts & replacements on member's account"
        ],
        limitations: [
          "R0 Parts Benefit \u2014 all parts, spares, and hardware replacements are billed to the member account",
          "Does not provide an annual monetary benefit allowance for hardware"
        ],
        whatYouReceive: [
          "Immediate priority dispatch for emergency callouts",
          "100% covered labor and diagnostics for fault finding",
          "Itemised trade invoices for approved hardware replacements"
        ],
        isPartsBenefitZero: true
      },
      assist_plus: {
        id: "assist_plus",
        name: "Assist Plus",
        monthlyPrice: 1499,
        annualBenefit: 15e3,
        partsBenefitDescription: "R15,000 / year",
        badge: "Most Popular",
        description: "Ideal for standard residential homes needing emergency coverage and parts allowance.",
        benefits: [
          "Same-day assistance",
          "Repairs & replacements up to R15,000 per year",
          "Electrical & plumbing when introduced"
        ],
        limitations: [
          "Benefit capped at R15,000 per 12-month membership period",
          "Costs exceeding R15,000 are the responsibility of the member"
        ],
        whatYouReceive: [
          "Up to R15,000 annual assistance benefit for parts and repairs",
          "Priority certified contractor dispatch",
          "Zero co-pay on services covered within your annual benefit balance"
        ]
      },
      assist_pro: {
        id: "assist_pro",
        name: "Assist Pro",
        monthlyPrice: 2999,
        annualBenefit: 4e4,
        partsBenefitDescription: "R40,000 / year",
        badge: "Comprehensive",
        description: "Enhanced coverage for larger homes and complex residential security infrastructure.",
        benefits: [
          "Same-day assistance",
          "Repairs & replacements up to R40,000 per year",
          "Electrical & plumbing when introduced"
        ],
        limitations: [
          "Benefit capped at R40,000 per 12-month membership period",
          "Costs exceeding R40,000 are the responsibility of the member"
        ],
        whatYouReceive: [
          "Up to R40,000 annual assistance benefit for repairs and components",
          "Guaranteed same-day SLA response",
          "Full electrical, plumbing & security system diagnostics"
        ]
      },
      assist_elite: {
        id: "assist_elite",
        name: "Assist Elite",
        monthlyPrice: 3499,
        annualBenefit: 6e4,
        partsBenefitDescription: "R60,000 / year",
        badge: "Executive",
        description: "Premium protection designed for high-value properties and multi-system installations.",
        benefits: [
          "Same-day assistance",
          "Repairs & replacements up to R60,000 per year",
          "Electrical & plumbing when introduced"
        ],
        limitations: [
          "Benefit capped at R60,000 per 12-month membership period",
          "Costs exceeding R60,000 are the responsibility of the member"
        ],
        whatYouReceive: [
          "Up to R60,000 annual assistance benefit allowance",
          "VIP dispatch routing and rapid response priority",
          "Full coverage of replacement automation motors, boards, and sensors"
        ]
      },
      residential_advanced: {
        id: "residential_advanced",
        name: "Residential Advanced",
        monthlyPrice: 4999,
        annualBenefit: 8e4,
        partsBenefitDescription: "R80,000 / year",
        badge: "Estate Living",
        description: "Extensive annual allowance for luxury estates, multi-building residences, and farms.",
        benefits: [
          "Same-day assistance",
          "Repairs & replacements up to R80,000 per year",
          "Electrical & plumbing when introduced"
        ],
        limitations: [
          "Benefit capped at R80,000 per 12-month membership period",
          "Costs exceeding R80,000 are the responsibility of the member"
        ],
        whatYouReceive: [
          "Up to R80,000 annual assistance benefit allowance",
          "Multi-structure perimeter, CCTV, and electrical response",
          "Dedicated operations management support"
        ]
      },
      business_advanced: {
        id: "business_advanced",
        name: "Business Advanced",
        monthlyPrice: 8999,
        annualBenefit: 15e4,
        partsBenefitDescription: "R150,000 / year",
        badge: "Commercial Enterprise",
        description: "Maximum coverage for commercial facilities, offices, retail centres, and industrial operations.",
        benefits: [
          "Same-day assistance",
          "Repairs & replacements up to R150,000 per year",
          "Electrical & plumbing when introduced"
        ],
        limitations: [
          "Benefit capped at R150,000 per 12-month membership period",
          "Costs exceeding R150,000 are the responsibility of the business"
        ],
        whatYouReceive: [
          "Up to R150,000 annual assistance benefit allowance",
          "Commercial access control, perimeter, and power assistance",
          "Custom corporate billing and consolidated monthly reporting"
        ]
      }
    };
    PLANS = MEMBERSHIP_PLANS;
    PLANS_LIST = Object.values(MEMBERSHIP_PLANS);
    getPlanConfig = getPlanById;
  }
});

// server/src/services/pdf.ts
var pdf_exports = {};
__export(pdf_exports, {
  generateCompletionReportPDF: () => generateCompletionReportPDF,
  generateInvoicePDF: () => generateInvoicePDF,
  generateQuotationPDF: () => generateQuotationPDF
});
import PDFDocument from "pdfkit";
function drawHeader(doc, title) {
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND_NAVY);
  doc.fillColor("white").fontSize(20).font("Helvetica-Bold").text("SAME DAY ASSIST", 40, 20, { align: "left" });
  doc.fillColor(BRAND_RED).fontSize(8).font("Helvetica").text("EMERGENCY ASSIST NETWORK \u2022 PSIRA ASSURANCE \u2022 SOUTH AFRICA", 40, 46);
  doc.fillColor("white").fontSize(11).font("Helvetica-Bold").text(title, 40, 65, { align: "left" });
  doc.fillColor(BRAND_NAVY).fontSize(9).font("Helvetica").text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`, 0, 68, { align: "right", width: doc.page.width - 40 });
  doc.rect(0, 90, doc.page.width, 4).fill(BRAND_RED);
}
function drawFooter(doc) {
  const y = doc.page.height - 50;
  doc.rect(0, y, doc.page.width, 50).fill(BRAND_NAVY);
  doc.fillColor("white").fontSize(7).font("Helvetica").text("\xA9 2026 Same Day Assist (Pty) Ltd \u2022 Soweto, Johannesburg, South Africa \u2022 SABS & PSIRA Assured \u2022 All rights reserved.", 0, y + 18, { align: "center", width: doc.page.width });
}
function sectionTitle(doc, text, y) {
  const ty = y ?? doc.y;
  doc.rect(40, ty, doc.page.width - 80, 20).fill("#F1F5F9");
  doc.fillColor(BRAND_NAVY).fontSize(9).font("Helvetica-Bold").text(text, 48, ty + 5);
  doc.moveDown(0.5);
}
function row(doc, label, value) {
  doc.fillColor(BRAND_GREY).fontSize(8).font("Helvetica").text(`${label}:`, 48, doc.y, { continued: true, width: 140 });
  doc.fillColor("#1E293B").font("Helvetica").text(value, { width: 350 });
}
async function generateQuotationPDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Quotation ${data.id}`, Author: "Same Day Assist" } });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    drawHeader(doc, "PRE-COMPLIANCE REPAIR QUOTATION");
    doc.moveDown(4);
    sectionTitle(doc, "CUSTOMER DETAILS");
    doc.moveDown(0.3);
    row(doc, "Client Name", data.customerName);
    row(doc, "Email", data.customerEmail);
    row(doc, "Property Address", data.customerAddress);
    row(doc, "Service Category", data.serviceCategory);
    row(doc, "Quote Reference", data.id);
    row(doc, "Date Issued", new Date(data.createdAt).toLocaleDateString("en-ZA"));
    doc.moveDown(1);
    sectionTitle(doc, "REPAIR LINE ITEMS");
    doc.moveDown(0.3);
    doc.rect(48, doc.y, doc.page.width - 96, 18).fill("#E2E8F0");
    doc.fillColor(BRAND_NAVY).fontSize(8).font("Helvetica-Bold").text("Description", 54, doc.y - 14, { width: 320, continued: true });
    doc.text("Cost (ZAR)", { align: "right", width: 120 });
    data.lineItems.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(48, doc.y, doc.page.width - 96, 16).fill("#F8FAFC");
      doc.fillColor("#334155").fontSize(8).font("Helvetica").text(item.description, 54, doc.y - 12, { width: 320, continued: true });
      doc.fillColor(BRAND_NAVY).font("Helvetica-Bold").text(`R ${item.cost.toFixed(2)}`, { align: "right", width: 120 });
    });
    doc.moveDown(0.5);
    doc.rect(48, doc.y, doc.page.width - 96, 22).fill(BRAND_RED);
    doc.fillColor("white").fontSize(10).font("Helvetica-Bold").text("TOTAL AMOUNT DUE:", 54, doc.y - 17, { continued: true, width: 320 });
    doc.text(`R ${data.amount.toFixed(2)}`, { align: "right", width: 120 });
    doc.moveDown(2);
    doc.fillColor(BRAND_GREY).fontSize(7).font("Helvetica").text("This quotation is valid for 14 days from the issue date. Payment activates your Same Day Assist membership.", 48, doc.y);
    drawFooter(doc);
    doc.end();
  });
}
async function generateInvoicePDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Tax Invoice ${data.invoiceNumber || data.id}`, Author: "Same Day Assist" } });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    drawHeader(doc, "OFFICIAL TAX INVOICE");
    doc.moveDown(4);
    const invNo = data.invoiceNumber || data.id;
    const invDate = new Date(data.date).toLocaleDateString("en-ZA");
    sectionTitle(doc, "INVOICE & MEMBER INFORMATION");
    doc.moveDown(0.3);
    row(doc, "Tax Invoice Number", invNo);
    row(doc, "Date of Issue", invDate);
    row(doc, "Member Name", data.customerName);
    if (data.customerEmail) row(doc, "Member Email", data.customerEmail);
    if (data.customerAddress) row(doc, "Service Address", data.customerAddress);
    if (data.membershipPlan) row(doc, "Membership Plan", data.membershipPlan);
    if (data.serviceReference) row(doc, "Service Request #", data.serviceReference);
    if (data.claimNumber) row(doc, "Claim Reference #", data.claimNumber);
    if (data.technicianName) row(doc, "Assigned Technician", data.technicianName);
    row(doc, "Service Provided", data.serviceRequested || data.type || "On-Demand Emergency Assistance");
    doc.moveDown(1);
    sectionTitle(doc, "COST BREAKDOWN & FINANCIAL STATEMENT");
    doc.moveDown(0.3);
    doc.rect(48, doc.y, doc.page.width - 96, 18).fill("#E2E8F0");
    doc.fillColor(BRAND_NAVY).fontSize(8).font("Helvetica-Bold").text("Cost Category", 54, doc.y - 14, { width: 320, continued: true });
    doc.text("Amount (ZAR)", { align: "right", width: 120 });
    const partsCost = data.parts !== void 0 ? data.parts : 0;
    const labourCost = data.labour !== void 0 ? data.labour : data.amount !== void 0 ? data.amount : 0;
    const otherCost = data.otherCharges !== void 0 ? data.otherCharges : 0;
    const grossTotal = data.total !== void 0 ? data.total : data.amount !== void 0 ? data.amount : partsCost + labourCost + otherCost;
    const benefitCovered = data.amountCoveredByBenefit !== void 0 ? data.amountCoveredByBenefit : 0;
    const customerPayable = data.amountPayableByCustomer !== void 0 ? data.amountPayableByCustomer : Math.max(0, grossTotal - benefitCovered);
    const costItems = [
      { desc: "Certified Labour & Diagnostics", cost: labourCost },
      { desc: "Hardware Replacement & Parts", cost: partsCost }
    ];
    if (otherCost > 0) {
      costItems.push({ desc: "Ancillary / Dispatch Charges", cost: otherCost });
    }
    costItems.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(48, doc.y, doc.page.width - 96, 16).fill("#F8FAFC");
      doc.fillColor("#334155").fontSize(8).font("Helvetica").text(item.desc, 54, doc.y - 12, { width: 320, continued: true });
      doc.fillColor(BRAND_NAVY).font("Helvetica-Bold").text(`R ${item.cost.toFixed(2)}`, { align: "right", width: 120 });
    });
    doc.moveDown(0.4);
    doc.rect(48, doc.y, doc.page.width - 96, 18).fill("#F1F5F9");
    doc.fillColor(BRAND_NAVY).fontSize(8).font("Helvetica-Bold").text("GROSS SERVICE TOTAL:", 54, doc.y - 14, { continued: true, width: 320 });
    doc.text(`R ${grossTotal.toFixed(2)}`, { align: "right", width: 120 });
    doc.moveDown(0.3);
    doc.rect(48, doc.y, doc.page.width - 96, 20).fill("#DCFCE7");
    doc.fillColor("#166534").fontSize(8.5).font("Helvetica-Bold").text("LESS: COVERED BY ANNUAL ASSISTANCE BENEFIT:", 54, doc.y - 15, { continued: true, width: 320 });
    doc.text(`- R ${benefitCovered.toFixed(2)}`, { align: "right", width: 120 });
    doc.moveDown(0.4);
    const payableColor = customerPayable > 0 ? BRAND_RED : BRAND_NAVY;
    doc.rect(48, doc.y, doc.page.width - 96, 26).fill(payableColor);
    doc.fillColor("white").fontSize(11).font("Helvetica-Bold").text("NET AMOUNT PAYABLE BY CUSTOMER:", 54, doc.y - 19, { continued: true, width: 320 });
    doc.text(`R ${customerPayable.toFixed(2)}`, { align: "right", width: 120 });
    doc.moveDown(1.5);
    const paymentStatus = data.status || (customerPayable === 0 ? "Covered" : "Unpaid");
    doc.rect(48, doc.y, doc.page.width - 96, 22).fill("#F8FAFC");
    doc.fillColor(BRAND_GREY).fontSize(8).font("Helvetica").text(`Invoice Status: ${data.invoiceStatus || "Issued"}   \u2022   Payment Status: ${paymentStatus.toUpperCase()}`, 54, doc.y - 16, { align: "center", width: doc.page.width - 108 });
    doc.moveDown(1.5);
    doc.fillColor(BRAND_GREY).fontSize(7.5).font("Helvetica").text("All services are rendered according to Same Day Assist Membership Terms & Conditions. Assistance benefit deductions are recorded on your annual member benefit ledger.", 48, doc.y, { align: "center", width: doc.page.width - 96 });
    drawFooter(doc);
    doc.end();
  });
}
async function generateCompletionReportPDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Completion Report ${data.jobId}`, Author: "Same Day Assist" } });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    drawHeader(doc, "JOB COMPLETION REPORT");
    doc.moveDown(4);
    sectionTitle(doc, "JOB DETAILS");
    doc.moveDown(0.3);
    row(doc, "Job Reference", data.jobId);
    row(doc, "Customer Name", data.customerName);
    row(doc, "Service Address", data.customerAddress);
    row(doc, "Service Type", data.serviceType);
    row(doc, "Emergency Description", data.description);
    row(doc, "Completed At", new Date(data.completedAt).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" }));
    doc.moveDown(1);
    sectionTitle(doc, "RESPONDER DETAILS");
    doc.moveDown(0.3);
    row(doc, "Field Responder", data.contractorName);
    row(doc, "Resolution Notes", data.contractorNotes);
    doc.moveDown(1);
    sectionTitle(doc, "DIGITAL SIGNATURE RECORD");
    doc.moveDown(0.3);
    doc.fillColor(BRAND_NAVY).fontSize(12).font("Helvetica-BoldOblique").text(data.contractorSignature, 48, doc.y);
    doc.fillColor(BRAND_GREY).fontSize(7).font("Helvetica").text("Electronically signed by responding officer", 48, doc.y + 2);
    if (data.rating) {
      doc.moveDown(1);
      sectionTitle(doc, "CUSTOMER SATISFACTION RATING");
      doc.moveDown(0.3);
      const stars = "\u2605".repeat(data.rating) + "\u2606".repeat(5 - data.rating);
      doc.fillColor(BRAND_RED).fontSize(16).font("Helvetica-Bold").text(stars, 48, doc.y);
    }
    drawFooter(doc);
    doc.end();
  });
}
var BRAND_RED, BRAND_NAVY, BRAND_GREY;
var init_pdf = __esm({
  "server/src/services/pdf.ts"() {
    BRAND_RED = "#CC322C";
    BRAND_NAVY = "#091C3E";
    BRAND_GREY = "#64748B";
  }
});

// server/src/vercel-handler.ts
import express from "express";
import cors from "cors";
import path3 from "path";
import dotenv from "dotenv";

// server/src/config/db.ts
var import_client = __toESM(require_default(), 1);
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
var prisma = new import_client.PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"]
});

// server/src/vercel-handler.ts
import fs3 from "fs";

// server/src/routes/auth.ts
import { Router } from "express";

// server/src/config/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().min(5, "Please describe the emergency in detail").max(2e3),
  vehicle: z.any().optional(),
  customerAddress: z.string().optional(),
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
    const validUserId = params.userId && params.userId !== "system" ? params.userId : null;
    await prisma.auditLog.create({
      data: {
        userId: validUserId,
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
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userRole = (req.user.role || "").toUpperCase();
    const isAllowed = normalizedAllowed.includes(userRole) || normalizedAllowed.includes("ADMIN") && (userRole === "ADMINISTRATOR" || userRole === "SUPER ADMINISTRATOR") || normalizedAllowed.includes("ADMINISTRATOR") && userRole === "ADMIN" || normalizedAllowed.includes("CUSTOMER") && (userRole === "CLIENT" || userRole === "MEMBER");
    if (!isAllowed) {
      return res.status(403).json({ error: `Access forbidden for role: ${req.user.role}` });
    }
    next();
  };
}

// server/src/services/paymentService.ts
init_plans();
function calculatePaymentBreakdown(monthlyPrice) {
  const monthlyCents = Math.round(monthlyPrice * 100);
  const initialCents = Math.round(monthlyCents * 0.2);
  const firstBillingCents = Math.round(monthlyCents * 0.4);
  const secondBillingCents = monthlyCents - initialCents - firstBillingCents;
  const initialAmount = initialCents / 100;
  const firstBillingAmount = firstBillingCents / 100;
  const secondBillingAmount = secondBillingCents / 100;
  return {
    monthlyPrice,
    initialAmount,
    firstBillingAmount,
    secondBillingAmount,
    totalActivationAmount: Number((initialAmount + firstBillingAmount + secondBillingAmount).toFixed(2))
  };
}
function calculateBillingDates(startDate = /* @__PURE__ */ new Date(), billingDay = 25) {
  const start = new Date(startDate);
  let firstYear = start.getFullYear();
  let firstMonth = start.getMonth();
  if (start.getDate() > 20) {
    firstMonth += 1;
    if (firstMonth > 11) {
      firstMonth = 0;
      firstYear += 1;
    }
  }
  const daysInFirstMonth = new Date(Date.UTC(firstYear, firstMonth + 1, 0)).getUTCDate();
  const clampedFirstDay = Math.min(billingDay, daysInFirstMonth);
  const firstBillingDate = new Date(Date.UTC(firstYear, firstMonth, clampedFirstDay, 12, 0, 0, 0));
  let secondYear = firstYear;
  let secondMonth = firstMonth + 1;
  if (secondMonth > 11) {
    secondMonth = 0;
    secondYear += 1;
  }
  const daysInSecondMonth = new Date(Date.UTC(secondYear, secondMonth + 1, 0)).getUTCDate();
  const clampedSecondDay = Math.min(billingDay, daysInSecondMonth);
  const secondBillingDate = new Date(Date.UTC(secondYear, secondMonth, clampedSecondDay, 12, 0, 0, 0));
  let recurYear = secondYear;
  let recurMonth = secondMonth + 1;
  if (recurMonth > 11) {
    recurMonth = 0;
    recurYear += 1;
  }
  const daysInRecurMonth = new Date(Date.UTC(recurYear, recurMonth + 1, 0)).getUTCDate();
  const clampedRecurDay = Math.min(billingDay, daysInRecurMonth);
  const recurringBillingDate = new Date(Date.UTC(recurYear, recurMonth, clampedRecurDay, 12, 0, 0, 0));
  return {
    startDate: start,
    firstBillingDate,
    secondBillingDate,
    recurringBillingDate
  };
}
function getPaymentScheduleForPlan(planId, startDate, billingDay = 25) {
  const plan = getPlanById(planId);
  const breakdown = calculatePaymentBreakdown(plan.monthlyPrice);
  const dates = calculateBillingDates(startDate || /* @__PURE__ */ new Date(), billingDay);
  return {
    planId: plan.id,
    planName: plan.name,
    monthlySubscription: plan.monthlyPrice,
    annualAssistanceBenefit: plan.annualBenefit,
    isPartsBenefitZero: plan.isPartsBenefitZero,
    billingDay,
    breakdown,
    dates: {
      startDate: dates.startDate.toISOString(),
      firstBillingDate: dates.firstBillingDate.toISOString(),
      secondBillingDate: dates.secondBillingDate.toISOString(),
      recurringBillingDate: dates.recurringBillingDate.toISOString()
    },
    stages: [
      {
        stage: "INITIAL_20",
        name: "Initial Activation Payment",
        percentage: 20,
        amount: breakdown.initialAmount,
        dueDate: dates.startDate.toISOString(),
        description: "Initial 20% activation fee collected upon onboarding. Membership enters Pending Activation status."
      },
      {
        stage: "FIRST_BILLING_40",
        name: "First Billing Payment",
        percentage: 40,
        amount: breakdown.firstBillingAmount,
        dueDate: dates.firstBillingDate.toISOString(),
        description: "First 40% billing payment (60% total collected). Membership remains Pending Activation."
      },
      {
        stage: "SECOND_BILLING_40",
        name: "Second Billing Payment (Activation)",
        percentage: 40,
        amount: breakdown.secondBillingAmount,
        dueDate: dates.secondBillingDate.toISOString(),
        description: "Second 40% billing payment (100% total collected). Membership transitions to ACTIVE upon successful receipt."
      },
      {
        stage: "RECURRING_MONTHLY",
        name: "Standard Monthly Subscription",
        percentage: 100,
        amount: plan.monthlyPrice,
        dueDate: dates.recurringBillingDate.toISOString(),
        description: "Regular recurring monthly subscription billed on scheduled monthly billing date."
      }
    ],
    activationRule: "Your membership becomes ACTIVE after the second billing payment is successfully completed, bringing total activation payments to 100%. Annual assistance benefits unlock only once ACTIVE."
  };
}
async function initializeMembershipWithSchedule(params) {
  const {
    userId,
    planId,
    billingDay = 25,
    autoProcessInitial = true,
    paymentMethod = "Card",
    startDate = /* @__PURE__ */ new Date()
  } = params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const plan = getPlanById(planId);
  const breakdown = calculatePaymentBreakdown(plan.monthlyPrice);
  const dates = calculateBillingDates(startDate, billingDay);
  const oneYearLater = new Date(startDate);
  oneYearLater.setFullYear(startDate.getFullYear() + 1);
  await prisma.membership.updateMany({
    where: { userId, status: { in: ["Active", "Pending Activation"] } },
    data: { status: "Superseded" }
  });
  const membership = await prisma.membership.create({
    data: {
      userId,
      planId: plan.id,
      planName: plan.name,
      monthlyPrice: plan.monthlyPrice,
      annualBenefit: plan.annualBenefit,
      benefitYearStart: startDate,
      benefitYearEnd: oneYearLater,
      status: "Pending Activation",
      // Requirement 1 & 4: MUST be Pending Activation initially
      billingDayOfMonth: billingDay,
      startDate,
      firstBillingDate: dates.firstBillingDate,
      secondBillingDate: dates.secondBillingDate,
      nextBillingDate: dates.firstBillingDate,
      activationCycleComplete: false,
      totalActivationPaid: 0,
      activationPercentage: 0,
      benefitTransactions: {
        create: {
          userId,
          reference: `OPENING-${startDate.getFullYear()}`,
          description: `Annual Benefit Allocation (${plan.name}). Unlocks upon 100% activation payment.`,
          credit: plan.annualBenefit,
          debit: 0,
          balance: plan.annualBenefit,
          date: startDate
        }
      }
    }
  });
  const initialPayment = await prisma.payment.create({
    data: {
      customerId: user.id,
      customerName: user.name,
      membershipId: membership.id,
      paymentStage: "INITIAL_20",
      type: `Initial 20% Activation Payment (${plan.name})`,
      amount: breakdown.initialAmount,
      status: "Pending",
      paymentMethod,
      date: startDate.toISOString().slice(0, 10),
      dueDate: startDate,
      transactionRef: `ACT-20-${membership.id.slice(0, 8)}-${Date.now()}`
    }
  });
  const initialInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-ACT20-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      membershipId: membership.id,
      customerName: user.name,
      customerEmail: user.email,
      customerAddress: user.address || "Address on file",
      membershipPlan: plan.name,
      serviceRequested: `Membership Onboarding Initial 20% Activation Fee (${plan.name})`,
      parts: 0,
      labour: 0,
      otherCharges: breakdown.initialAmount,
      subtotal: breakdown.initialAmount,
      taxVat: Number((breakdown.initialAmount * 0.15).toFixed(2)),
      total: breakdown.initialAmount,
      amountCoveredByBenefit: 0,
      amountPayableByCustomer: breakdown.initialAmount,
      paymentStatus: "Unpaid",
      invoiceStatus: "Issued",
      notes: "Initial 20% payment for membership activation cycle (Stage 1 of 3)"
    }
  });
  await prisma.payment.update({
    where: { id: initialPayment.id },
    data: { invoiceId: initialInvoice.id }
  });
  let processedPayment = initialPayment;
  if (autoProcessInitial) {
    const processRes = await processPayment({
      paymentId: initialPayment.id,
      status: "Successful",
      gatewayReference: `GW-PAYFAST-INIT-${Date.now()}`,
      paymentMethod
    });
    processedPayment = processRes.payment;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      package: plan.name,
      status: "Onboarding"
      // User is Onboarding until membership activation completes
    }
  });
  await writeAuditLog({
    userId,
    userType: "Customer",
    action: "Plan Selected (Pending Activation)",
    details: `Customer ${user.name} selected ${plan.name} (R${plan.monthlyPrice}/mo). Initial 20% payment of R${breakdown.initialAmount} generated. Membership status: PENDING ACTIVATION.`,
    newValue: {
      membershipId: membership.id,
      plan: plan.name,
      status: "Pending Activation",
      breakdown
    }
  });
  return {
    membership: await prisma.membership.findUnique({ where: { id: membership.id } }),
    initialPayment: processedPayment,
    initialInvoice,
    schedule: getPaymentScheduleForPlan(planId, startDate, billingDay)
  };
}
async function processPayment(params) {
  const {
    paymentId,
    membershipId,
    userId,
    stage,
    amount,
    status = "Successful",
    gatewayReference,
    paymentMethod = "Card",
    failureReason,
    transactionRef,
    paidAt,
    actorId = "system",
    actorRole = "System"
  } = params;
  let payment = null;
  if (paymentId) {
    payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { membership: true, invoice: true, customer: true }
    });
  } else if (transactionRef) {
    payment = await prisma.payment.findUnique({
      where: { transactionRef },
      include: { membership: true, invoice: true, customer: true }
    });
  }
  if (!payment && membershipId && stage) {
    payment = await prisma.payment.findFirst({
      where: { membershipId, paymentStage: stage },
      include: { membership: true, invoice: true, customer: true }
    });
  }
  if (!payment && membershipId && stage) {
    const mem = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!mem) throw new Error("Associated membership record not found");
    const uId = userId || mem.userId;
    const user = await prisma.user.findUnique({ where: { id: uId } });
    const breakdown2 = calculatePaymentBreakdown(mem.monthlyPrice);
    let stageAmount = amount;
    if (!stageAmount) {
      if (stage === "INITIAL_20") stageAmount = breakdown2.initialAmount;
      else if (stage === "FIRST_BILLING_40") stageAmount = breakdown2.firstBillingAmount;
      else if (stage === "SECOND_BILLING_40") stageAmount = breakdown2.secondBillingAmount;
      else stageAmount = mem.monthlyPrice;
    }
    const typeDesc = stage === "INITIAL_20" ? "Initial 20% Membership Payment" : stage === "FIRST_BILLING_40" ? "First 40% Billing Payment" : stage === "SECOND_BILLING_40" ? "Second 40% Activation Payment" : "Monthly Membership Subscription";
    const pDate = paidAt || /* @__PURE__ */ new Date();
    payment = await prisma.payment.create({
      data: {
        customerId: uId,
        customerName: user?.name || "Customer",
        membershipId,
        paymentStage: stage,
        type: typeDesc,
        amount: stageAmount,
        status: status === "Failed" ? "Failed" : "Pending",
        transactionRef: transactionRef || `TXN-${stage}-${Date.now()}`,
        paymentMethod,
        date: pDate.toISOString().split("T")[0],
        dueDate: pDate,
        failureReason: status === "Failed" ? failureReason : null
      },
      include: { membership: true, invoice: true, customer: true }
    });
  }
  if (!payment) throw new Error("Payment record not found");
  if (payment.status === "Successful" || payment.status === "Paid") {
    return {
      success: true,
      alreadyProcessed: true,
      payment,
      membership: payment.membership,
      message: "Payment has already been successfully processed (idempotent)"
    };
  }
  const membership = payment.membership;
  if (!membership) throw new Error("Associated membership record not found");
  const now = paidAt || /* @__PURE__ */ new Date();
  const plan = getPlanById(membership.planId);
  const breakdown = calculatePaymentBreakdown(membership.monthlyPrice);
  if (status === "Failed") {
    const updatedPayment2 = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "Failed",
        failureReason: failureReason || "Gateway transaction declined",
        retryCount: (payment.retryCount || 0) + 1
      }
    });
    if (membership.status !== "Active") {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: "Payment Due" }
      });
    }
    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: "Payment Failed",
      details: `Payment ${payment.type} (R${payment.amount}) failed. Reason: ${failureReason || "Declined"}. Retry count: ${updatedPayment2.retryCount}`,
      newValue: { paymentId: payment.id, status: "Failed", failureReason }
    });
    return {
      success: false,
      alreadyProcessed: false,
      payment: updatedPayment2,
      membership: await prisma.membership.findUnique({ where: { id: membership.id } }),
      message: `Payment failed: ${failureReason || "Declined"}`
    };
  }
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "Successful",
      paidAt: now,
      paymentMethod,
      gatewayReference: gatewayReference || `GW-${Date.now()}`,
      transactionRef: transactionRef || payment.transactionRef || `TXN-${Date.now()}`
    }
  });
  if (payment.invoiceId) {
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paymentStatus: "Paid",
        invoiceStatus: "Settled",
        paidAt: now,
        paymentMethod
      }
    });
  }
  let newStatus = membership.status;
  let newPercentage = membership.activationPercentage;
  let newTotalPaid = membership.totalActivationPaid;
  let nextBilling = membership.nextBillingDate;
  let isActivationComplete = membership.activationCycleComplete;
  let activationDate = membership.activationDate;
  if (payment.paymentStage === "INITIAL_20") {
    newTotalPaid = breakdown.initialAmount;
    newPercentage = 20;
    newStatus = "Pending Activation";
    nextBilling = membership.firstBillingDate;
    const existingNext = await prisma.payment.findFirst({
      where: { membershipId: membership.id, paymentStage: "FIRST_BILLING_40" }
    });
    if (!existingNext && membership.firstBillingDate) {
      await prisma.payment.create({
        data: {
          customerId: payment.customerId,
          customerName: payment.customerName,
          membershipId: membership.id,
          paymentStage: "FIRST_BILLING_40",
          type: `First 40% Billing Payment (${membership.planName})`,
          amount: breakdown.firstBillingAmount,
          status: "Pending",
          date: membership.firstBillingDate.toISOString().slice(0, 10),
          dueDate: membership.firstBillingDate,
          transactionRef: `ACT-40A-${membership.id.slice(0, 8)}-${Date.now()}`
        }
      });
    }
    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: "Initial 20% Payment Successful",
      details: `Collected R${payment.amount} (20% of monthly subscription). Total collected: R${newTotalPaid}. Status: PENDING ACTIVATION.`,
      newValue: { paymentId, status: newStatus, activationPercentage: newPercentage }
    });
  } else if (payment.paymentStage === "FIRST_BILLING_40") {
    newTotalPaid = Number((membership.totalActivationPaid + payment.amount).toFixed(2));
    newPercentage = 60;
    newStatus = "Pending Activation";
    nextBilling = membership.secondBillingDate;
    const existingNext = await prisma.payment.findFirst({
      where: { membershipId: membership.id, paymentStage: "SECOND_BILLING_40" }
    });
    if (!existingNext && membership.secondBillingDate) {
      await prisma.payment.create({
        data: {
          customerId: payment.customerId,
          customerName: payment.customerName,
          membershipId: membership.id,
          paymentStage: "SECOND_BILLING_40",
          type: `Second 40% Activation Billing Payment (${membership.planName})`,
          amount: breakdown.secondBillingAmount,
          status: "Pending",
          date: membership.secondBillingDate.toISOString().slice(0, 10),
          dueDate: membership.secondBillingDate,
          transactionRef: `ACT-40B-${membership.id.slice(0, 8)}-${Date.now()}`
        }
      });
    }
    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: "First 40% Billing Payment Successful",
      details: `Collected R${payment.amount} (40% first billing). Total collected: R${newTotalPaid} (60%). Status: PENDING ACTIVATION.`,
      newValue: { paymentId, status: newStatus, activationPercentage: newPercentage }
    });
  } else if (payment.paymentStage === "SECOND_BILLING_40") {
    newTotalPaid = Number((membership.totalActivationPaid + payment.amount).toFixed(2));
    newPercentage = 100;
    newStatus = "Active";
    isActivationComplete = true;
    activationDate = now;
    const dates = calculateBillingDates(membership.secondBillingDate || now, membership.billingDayOfMonth);
    nextBilling = dates.recurringBillingDate;
    if (payment.customerId) {
      await prisma.user.update({
        where: { id: payment.customerId },
        data: {
          status: "Active Member",
          memberSince: now.toISOString().slice(0, 10),
          totalPaid: { increment: payment.amount }
        }
      });
    }
    await prisma.payment.create({
      data: {
        customerId: payment.customerId,
        customerName: payment.customerName,
        membershipId: membership.id,
        paymentStage: "RECURRING_MONTHLY",
        type: `Monthly Membership Subscription (${membership.planName})`,
        amount: membership.monthlyPrice,
        status: "Pending",
        date: nextBilling.toISOString().slice(0, 10),
        dueDate: nextBilling,
        transactionRef: `REC-${membership.id.slice(0, 8)}-${Date.now()}`
      }
    });
    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: "Membership Activated",
      details: `Second 40% payment of R${payment.amount} successful. Total activation payments collected: R${newTotalPaid} (100%). Membership is now ACTIVE.`,
      newValue: {
        membershipId: membership.id,
        status: "Active",
        activationDate: now,
        activationPercentage: 100
      }
    });
  } else if (payment.paymentStage === "RECURRING_MONTHLY") {
    newStatus = "Active";
    const dates = calculateBillingDates(payment.dueDate || now, membership.billingDayOfMonth);
    nextBilling = dates.recurringBillingDate;
    if (payment.customerId) {
      await prisma.user.update({
        where: { id: payment.customerId },
        data: { totalPaid: { increment: payment.amount } }
      });
    }
    await prisma.payment.create({
      data: {
        customerId: payment.customerId,
        customerName: payment.customerName,
        membershipId: membership.id,
        paymentStage: "RECURRING_MONTHLY",
        type: `Monthly Membership Subscription (${membership.planName})`,
        amount: membership.monthlyPrice,
        status: "Pending",
        date: nextBilling.toISOString().slice(0, 10),
        dueDate: nextBilling,
        transactionRef: `REC-${membership.id.slice(0, 8)}-${Date.now()}`
      }
    });
    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: "Monthly Subscription Payment Successful",
      details: `Collected normal monthly subscription of R${payment.amount} for ${membership.planName}. Next billing date: ${nextBilling.toISOString().slice(0, 10)}.`,
      newValue: { paymentId, nextBillingDate: nextBilling }
    });
  }
  const updatedMembership = await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: newStatus,
      activationPercentage: newPercentage,
      totalActivationPaid: newTotalPaid,
      nextBillingDate: nextBilling,
      activationCycleComplete: isActivationComplete,
      activationDate
    }
  });
  return {
    success: true,
    alreadyProcessed: false,
    payment: updatedPayment,
    membership: updatedMembership,
    message: newStatus === "Active" && membership.status !== "Active" ? "Membership successfully activated! All plan benefits are now available." : `Payment successful. Current status: ${newStatus} (${newPercentage}% collected)`
  };
}
async function retryPayment(paymentId, gatewayReference, paymentMethod = "Card") {
  return processPayment({
    paymentId,
    status: "Successful",
    gatewayReference: gatewayReference || `GW-RETRY-${Date.now()}`,
    paymentMethod,
    transactionRef: `RETRY-${paymentId.slice(0, 8)}-${Date.now()}`
  });
}
async function getMembershipPaymentTimeline(userId) {
  const membership = await prisma.membership.findFirst({
    where: { userId, status: { in: ["Active", "Pending Activation", "Payment Due"] } },
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        orderBy: { createdAt: "asc" },
        include: { invoice: { select: { id: true, invoiceNumber: true } } }
      }
    }
  });
  if (!membership) {
    return null;
  }
  const breakdown = calculatePaymentBreakdown(membership.monthlyPrice);
  const plan = getPlanById(membership.planId);
  const initial20 = membership.payments.find((p) => p.paymentStage === "INITIAL_20");
  const firstBilling40 = membership.payments.find((p) => p.paymentStage === "FIRST_BILLING_40");
  const secondBilling40 = membership.payments.find((p) => p.paymentStage === "SECOND_BILLING_40");
  const recurringPayments = membership.payments.filter((p) => p.paymentStage === "RECURRING_MONTHLY");
  const pendingPayment = membership.payments.find((p) => p.status === "Pending" || p.status === "Failed");
  const isActive = membership.status === "Active";
  const totalCollected = membership.totalActivationPaid;
  const outstandingActivation = Math.max(0, Number((breakdown.totalActivationAmount - totalCollected).toFixed(2)));
  return {
    membershipId: membership.id,
    planId: membership.planId,
    planName: membership.planName,
    monthlySubscription: membership.monthlyPrice,
    monthlyPrice: membership.monthlyPrice,
    annualAssistanceBenefit: membership.annualBenefit,
    status: membership.status,
    membershipStatus: membership.status,
    isActive,
    isEligibleForBenefits: isActive,
    // Requirement 26: Benefits only available when ACTIVE
    activationPercentage: membership.activationPercentage,
    totalActivationPaid: membership.totalActivationPaid,
    totalCollected: membership.totalActivationPaid,
    outstandingActivation,
    activationCycleComplete: membership.activationCycleComplete,
    activationDate: membership.activationDate ? membership.activationDate.toISOString() : null,
    billingDayOfMonth: membership.billingDayOfMonth,
    dates: {
      startDate: membership.startDate.toISOString(),
      firstBillingDate: membership.firstBillingDate ? membership.firstBillingDate.toISOString() : null,
      secondBillingDate: membership.secondBillingDate ? membership.secondBillingDate.toISOString() : null,
      activationDate: membership.activationDate ? membership.activationDate.toISOString() : null,
      nextBillingDate: membership.nextBillingDate ? membership.nextBillingDate.toISOString() : null
    },
    breakdown,
    activationTimeline: [
      {
        stage: "INITIAL_20",
        title: "Initial Payment",
        percentage: "20%",
        amount: breakdown.initialAmount,
        dueDate: membership.startDate.toISOString().slice(0, 10),
        status: initial20 ? initial20.status : "Pending",
        paidAt: initial20?.paidAt ? initial20.paidAt.toISOString() : null,
        paymentId: initial20?.id || null,
        invoiceNumber: initial20?.invoice?.invoiceNumber || null,
        isCompleted: initial20?.status === "Successful" || initial20?.status === "Paid"
      },
      {
        stage: "FIRST_BILLING_40",
        title: "First Billing",
        percentage: "40%",
        amount: breakdown.firstBillingAmount,
        dueDate: membership.firstBillingDate ? membership.firstBillingDate.toISOString().slice(0, 10) : "Pending Date",
        status: firstBilling40 ? firstBilling40.status : "Scheduled",
        paidAt: firstBilling40?.paidAt ? firstBilling40.paidAt.toISOString() : null,
        paymentId: firstBilling40?.id || null,
        invoiceNumber: firstBilling40?.invoice?.invoiceNumber || null,
        isCompleted: firstBilling40?.status === "Successful" || firstBilling40?.status === "Paid"
      },
      {
        stage: "SECOND_BILLING_40",
        title: "Second Billing (Activation)",
        percentage: "40%",
        amount: breakdown.secondBillingAmount,
        dueDate: membership.secondBillingDate ? membership.secondBillingDate.toISOString().slice(0, 10) : "Pending Date",
        status: secondBilling40 ? secondBilling40.status : "Scheduled",
        paidAt: secondBilling40?.paidAt ? secondBilling40.paidAt.toISOString() : null,
        paymentId: secondBilling40?.id || null,
        invoiceNumber: secondBilling40?.invoice?.invoiceNumber || null,
        isCompleted: secondBilling40?.status === "Successful" || secondBilling40?.status === "Paid"
      }
    ],
    timelineSteps: [
      {
        stage: "INITIAL_20",
        description: "Initial Payment",
        percentage: 20,
        amount: breakdown.initialAmount,
        date: membership.startDate ? membership.startDate.toISOString() : null,
        status: initial20 ? initial20.status : "Pending",
        isPaid: initial20?.status === "Successful" || initial20?.status === "Paid"
      },
      {
        stage: "FIRST_BILLING_40",
        description: "First Billing",
        percentage: 40,
        amount: breakdown.firstBillingAmount,
        date: membership.firstBillingDate ? membership.firstBillingDate.toISOString() : null,
        status: firstBilling40 ? firstBilling40.status : "Scheduled",
        isPaid: firstBilling40?.status === "Successful" || firstBilling40?.status === "Paid"
      },
      {
        stage: "SECOND_BILLING_40",
        description: "Second Billing (Activation)",
        percentage: 40,
        amount: breakdown.secondBillingAmount,
        date: membership.secondBillingDate ? membership.secondBillingDate.toISOString() : null,
        status: secondBilling40 ? secondBilling40.status : "Scheduled",
        isPaid: secondBilling40?.status === "Successful" || secondBilling40?.status === "Paid"
      }
    ],
    nextPayment: pendingPayment ? {
      id: pendingPayment.id,
      stage: pendingPayment.paymentStage,
      description: pendingPayment.type,
      amount: pendingPayment.amount,
      dueDate: pendingPayment.dueDate ? pendingPayment.dueDate.toISOString().slice(0, 10) : pendingPayment.date,
      status: pendingPayment.status,
      failureReason: pendingPayment.failureReason
    } : null,
    nextScheduledPayment: pendingPayment ? {
      id: pendingPayment.id,
      stage: pendingPayment.paymentStage,
      type: pendingPayment.type,
      amount: pendingPayment.amount,
      dueDate: pendingPayment.dueDate ? pendingPayment.dueDate.toISOString().slice(0, 10) : pendingPayment.date,
      status: pendingPayment.status,
      failureReason: pendingPayment.failureReason
    } : null,
    payments: membership.payments,
    allPayments: membership.payments,
    recurringPayments
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
    savedLocations,
    selectedPlanId
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
    const { getPlanById: getPlanById3 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
    const chosenPlan = getPlanById3(selectedPlanId || "assist_plus");
    const passwordHash = await hashPassword(password);
    const now = /* @__PURE__ */ new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);
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
      package: chosenPlan.name,
      memberSince: now.toISOString().split("T")[0],
      repairsCount: 0,
      totalPaid: 0,
      lastProfileUpdateAt: now,
      notificationSettings: {
        create: {
          email: true,
          sms: true,
          push: true,
          inApp: true
        }
      },
      memberships: {
        create: {
          planId: chosenPlan.id,
          planName: chosenPlan.name,
          monthlyPrice: chosenPlan.monthlyPrice,
          annualBenefit: chosenPlan.annualBenefit,
          benefitYearStart: now,
          benefitYearEnd: oneYearLater,
          status: "Active",
          benefitTransactions: {
            create: {
              userId: "",
              // Will be set by Prisma nested connect/create
              reference: `OPENING-${now.getFullYear()}`,
              description: `Initial Annual Benefit Allocation (${chosenPlan.name})`,
              credit: chosenPlan.annualBenefit,
              debit: 0,
              balance: chosenPlan.annualBenefit,
              date: now
            }
          }
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
    delete userData.memberships;
    const user = await prisma.user.create({
      data: userData,
      include: { savedLocations: true, notificationSettings: true }
    });
    await initializeMembershipWithSchedule({
      userId: user.id,
      planId: chosenPlan.id,
      billingDay: 25,
      autoProcessInitial: true,
      // Stage 1 initial 20% collected on join
      paymentMethod: "Card",
      startDate: now
    });
    await prisma.enquiry.create({
      data: {
        customerName: name,
        email: email.trim().toLowerCase(),
        phone,
        address,
        serviceCategory: preferredServices && preferredServices.length > 0 ? preferredServices[0] : "Security Services",
        notes: `Selected Plan: ${chosenPlan.name} (R${chosenPlan.monthlyPrice}/mo, R${chosenPlan.annualBenefit.toLocaleString()} annual benefit). Preferred services: ${preferredServices ? preferredServices.join(", ") : "All On-Demand Services"}`,
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
router5.get("/schedule/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    const { startDate, billingDay } = req.query;
    const start = startDate ? new Date(startDate) : /* @__PURE__ */ new Date();
    const day = billingDay ? parseInt(billingDay, 10) : 25;
    const schedule = getPaymentScheduleForPlan(planId, start, day);
    return res.json(schedule);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to calculate payment schedule" });
  }
});
router5.get("/my", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const timeline = await getMembershipPaymentTimeline(userId);
    const payments = await prisma.payment.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, total: true, paymentStatus: true }
        }
      }
    });
    return res.json({
      payments,
      timeline
    });
  } catch (error) {
    console.error("[Payments/My]", error);
    return res.status(500).json({ error: "Failed to retrieve payment history" });
  }
});
router5.get("/timeline/:userId?", requireAuth, async (req, res) => {
  try {
    let targetUserId = req.user.id;
    if (req.params.userId) {
      if (req.user.role !== "ADMIN" && req.user.role !== "Administrator" && req.user.role !== "Super Administrator") {
        return res.status(403).json({ error: "Unauthorized to view other customer payment timelines" });
      }
      targetUserId = req.params.userId;
    }
    const timeline = await getMembershipPaymentTimeline(targetUserId);
    if (!timeline) {
      return res.status(404).json({ error: "No membership or payment schedule found for this customer" });
    }
    return res.json(timeline);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to retrieve payment timeline" });
  }
});
router5.post("/pay-activation", requireAuth, async (req, res) => {
  try {
    const { paymentId, paymentMethod = "Card", simulateFailure = false } = req.body;
    let targetPaymentId = paymentId;
    if (!targetPaymentId) {
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          customerId: req.user.id,
          status: { in: ["Pending", "Failed"] }
        },
        orderBy: { createdAt: "asc" }
      });
      if (!pendingPayment) {
        return res.status(400).json({ error: "No pending payment found to process" });
      }
      targetPaymentId = pendingPayment.id;
    }
    const paymentRecord = await prisma.payment.findUnique({ where: { id: targetPaymentId } });
    if (!paymentRecord) return res.status(404).json({ error: "Payment not found" });
    if (paymentRecord.customerId !== req.user.id && req.user.role !== "ADMIN" && req.user.role !== "Administrator" && req.user.role !== "Super Administrator") {
      return res.status(403).json({ error: "Unauthorized to process this payment" });
    }
    const result = await processPayment({
      paymentId: targetPaymentId,
      status: simulateFailure ? "Failed" : "Successful",
      gatewayReference: `GW-SDA-${Date.now()}`,
      paymentMethod,
      failureReason: simulateFailure ? "Bank decline: Insufficient balance / 3DS authentication rejected" : void 0,
      actorId: req.user.id,
      actorRole: req.user.role || "Customer"
    });
    const updatedTimeline = await getMembershipPaymentTimeline(paymentRecord.customerId || req.user.id);
    return res.json({
      ...result,
      timeline: updatedTimeline
    });
  } catch (error) {
    console.error("[Payments/PayActivation]", error);
    return res.status(500).json({ error: error.message || "Payment processing failed" });
  }
});
router5.post("/:id/retry", requireAuth, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.customerId !== req.user.id && req.user.role !== "ADMIN" && req.user.role !== "Administrator" && req.user.role !== "Super Administrator") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { paymentMethod = "Card" } = req.body;
    const result = await retryPayment(payment.id, `GW-RETRY-${Date.now()}`, paymentMethod);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Payment retry failed" });
  }
});
router5.post("/initiate", requireAuth, async (req, res) => {
  const { type, amount, membershipId, paymentStage } = req.body;
  if (!amount) return res.status(400).json({ error: "amount is required" });
  try {
    const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const payment = await prisma.payment.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        membershipId: membershipId || null,
        paymentStage: paymentStage || "RECURRING_MONTHLY",
        type: type || "Membership Payment",
        amount: Number(amount),
        status: "Pending",
        date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        transactionRef: `PF-${Date.now()}-${Math.floor(Math.random() * 1e3)}`
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
      amount: Number(amount).toFixed(2),
      item_name: `Same Day Assist - ${type || "Membership"}`
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
    if (PAYFAST_PASSPHRASE && pfData.signature) {
      const pfParamString = Object.keys(pfData).filter((k) => k !== "signature").map((k) => `${k}=${encodeURIComponent(pfData[k].trim())}`).join("&");
      const calculatedSignature = crypto.createHash("md5").update(pfParamString).digest("hex");
      if (calculatedSignature !== pfData.signature) {
        console.warn("[Payments/Webhook] Signature mismatch");
        return res.status(400).send("Invalid signature");
      }
    }
    const isComplete = pfData.payment_status === "COMPLETE" || pfData.status === "COMPLETE" || pfData.status === "Successful";
    const result = await processPayment({
      paymentId,
      status: isComplete ? "Successful" : "Failed",
      gatewayReference: pfData.pf_payment_id || `PF-GW-${Date.now()}`,
      paymentMethod: pfData.payment_method || "PayFast",
      failureReason: !isComplete ? pfData.reason || "Payment uncompleted at gateway" : void 0
    });
    console.log(`[Payments/Webhook] Processed payment ${paymentId}: ${result.message}`);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[Payments/Webhook]", error);
    return res.status(500).send("Server error");
  }
});
router5.get("/admin/all", requireAuth, requireRoles("Administrator", "Super Administrator", "Admin", "ADMIN"), async (req, res) => {
  try {
    const { status, stage, customerId } = req.query;
    const where = {};
    if (status && status !== "ALL") where.status = status;
    if (stage && stage !== "ALL") where.paymentStage = stage;
    if (customerId) where.customerId = customerId;
    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        membership: { select: { id: true, planName: true, status: true, monthlyPrice: true } },
        invoice: { select: { id: true, invoiceNumber: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve payments" });
  }
});
router5.post("/admin/trigger-billing", requireAuth, requireRoles("Administrator", "Super Administrator", "Admin", "ADMIN"), async (req, res) => {
  try {
    const { customerId, membershipId } = req.body;
    let targetMembershipId = membershipId;
    if (!targetMembershipId && customerId) {
      const activeMem = await prisma.membership.findFirst({
        where: { userId: customerId, status: { in: ["Active", "Pending Activation", "Payment Due"] } },
        orderBy: { createdAt: "desc" }
      });
      if (!activeMem) return res.status(404).json({ error: "No membership found for customer" });
      targetMembershipId = activeMem.id;
    }
    const nextPayment = await prisma.payment.findFirst({
      where: { membershipId: targetMembershipId, status: { in: ["Pending", "Failed"] } },
      orderBy: { createdAt: "asc" }
    });
    if (!nextPayment) {
      return res.status(400).json({ error: "No pending payment scheduled for this membership" });
    }
    const processRes = await processPayment({
      paymentId: nextPayment.id,
      status: "Successful",
      gatewayReference: `ADMIN-TRIGGER-${Date.now()}`,
      paymentMethod: "Debit Order / Direct Charge",
      actorId: req.user.id,
      actorRole: "Admin"
    });
    const timeline = await getMembershipPaymentTimeline(nextPayment.customerId);
    return res.json({
      success: true,
      message: `Triggered payment for ${nextPayment.type}. ${processRes.message}`,
      payment: processRes.payment,
      timeline
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Billing trigger failed" });
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

// server/src/services/benefitService.ts
init_plans();
async function getOrCreateActiveMembership(userId, requestedPlanId) {
  let membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      benefitTransactions: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!membership) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const planKey = requestedPlanId || (user.package ? user.package.toLowerCase().replace(/[\s-]/g, "_") : "assist_plus");
    const plan = getPlanById(planKey);
    const now = /* @__PURE__ */ new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);
    membership = await prisma.membership.create({
      data: {
        userId,
        planId: plan.id,
        planName: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualBenefit: plan.annualBenefit,
        benefitYearStart: now,
        benefitYearEnd: oneYearLater,
        status: "Pending Activation",
        activationPercentage: 20,
        activationCycleComplete: false,
        benefitTransactions: {
          create: {
            userId,
            reference: "OPENING-" + now.getFullYear(),
            description: `Annual Benefit Allocation (${plan.name})`,
            credit: plan.annualBenefit,
            debit: 0,
            balance: plan.annualBenefit,
            date: now
          }
        }
      },
      include: {
        benefitTransactions: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
    await writeAuditLog({
      userId,
      userType: user.role,
      action: "Membership Activated",
      details: `Active membership for plan ${plan.name} initialized with annual benefit allowance of R${plan.annualBenefit.toLocaleString()}`,
      newValue: {
        membershipId: membership.id,
        planId: plan.id,
        annualBenefit: plan.annualBenefit
      }
    });
  }
  return membership;
}
async function getMemberBenefitSummary(userId) {
  const membership = await getOrCreateActiveMembership(userId);
  const transactions = await prisma.benefitTransaction.findMany({
    where: { membershipId: membership.id },
    orderBy: { date: "desc" },
    include: {
      claim: { select: { id: true, claimNumber: true, serviceType: true, status: true } },
      invoice: { select: { id: true, invoiceNumber: true, total: true, paymentStatus: true } }
    }
  });
  const totalDebits = transactions.reduce((acc, t) => acc + (t.debit || 0), 0);
  const totalCredits = transactions.reduce((acc, t) => acc + (t.credit || 0), 0);
  const annualAllowance = membership.annualBenefit;
  const usedBenefit = totalDebits;
  const remainingBenefit = Math.max(0, annualAllowance - usedBenefit);
  const usagePercentage = annualAllowance > 0 ? Math.min(100, parseFloat((usedBenefit / annualAllowance * 100).toFixed(2))) : 0;
  const remainingPercentage = annualAllowance > 0 ? Math.max(0, parseFloat((remainingBenefit / annualAllowance * 100).toFixed(2))) : 0;
  const [claimsCount, invoicesCount] = await Promise.all([
    prisma.claim.count({ where: { userId } }),
    prisma.invoice.count({ where: { userId } })
  ]);
  const plan = getPlanById(membership.planId);
  const isEligibleForBenefits = membership.status === "Active";
  const activationPercentage = membership.activationPercentage ?? (membership.status === "Active" ? 100 : 20);
  const totalActivationPaid = membership.totalActivationPaid ?? 0;
  return {
    membershipId: membership.id,
    planId: membership.planId,
    planName: membership.planName,
    monthlyPrice: membership.monthlyPrice,
    annualBenefit: membership.annualBenefit,
    isPartsBenefitZero: membership.planId === "assist" || membership.annualBenefit === 0,
    partsBenefitDescription: plan.partsBenefitDescription,
    usedBenefit,
    remainingBenefit,
    usagePercentage,
    remainingPercentage,
    benefitYearStart: membership.benefitYearStart.toISOString(),
    benefitYearEnd: membership.benefitYearEnd.toISOString(),
    status: membership.status,
    isEligibleForBenefits,
    activationPercentage,
    totalActivationPaid,
    claimsCount,
    invoicesCount,
    transactions
  };
}
async function calculateBenefitCoverage(arg1, arg2, arg3) {
  let userId;
  let totalServiceAmount = 0;
  let partsAmount = 0;
  let labourAmount = 0;
  if (typeof arg1 === "object") {
    userId = arg1.userId;
    totalServiceAmount = Number(arg1.totalServiceAmount ?? arg1.amount ?? arg1.totalAmount ?? 0);
    partsAmount = Number(arg1.partsAmount ?? 0);
    labourAmount = Number(arg1.labourAmount ?? 0);
  } else {
    userId = arg1;
    totalServiceAmount = Number(arg2 ?? 0);
    partsAmount = Number(arg3?.partsAmount ?? 0);
    labourAmount = Number(arg3?.labourAmount ?? 0);
  }
  const summary = await getMemberBenefitSummary(userId);
  if (!summary.isEligibleForBenefits) {
    return {
      annualBenefit: summary.annualBenefit,
      availableBenefit: 0,
      usedBenefit: summary.usedBenefit,
      isPartsBenefitZero: summary.isPartsBenefitZero,
      isPendingActivation: true,
      coveredAmount: 0,
      amountCoveredByBenefit: 0,
      customerPayable: totalServiceAmount,
      amountPayableByCustomer: totalServiceAmount,
      exceededBy: totalServiceAmount,
      exceedsBenefit: true,
      explanation: `Membership status is ${summary.status} (${summary.activationPercentage}% activation paid). Annual assistance benefits unlock once the 3-stage activation payments are 100% completed.`
    };
  }
  if (summary.isPartsBenefitZero) {
    const coveredLabour = labourAmount > 0 ? labourAmount : 0;
    const customerPayable = partsAmount > 0 ? partsAmount : totalServiceAmount;
    const amountCoveredByBenefit2 = 0;
    return {
      annualBenefit: 0,
      availableBenefit: 0,
      usedBenefit: 0,
      isPartsBenefitZero: true,
      coveredAmount: amountCoveredByBenefit2,
      amountCoveredByBenefit: amountCoveredByBenefit2,
      customerPayable,
      amountPayableByCustomer: customerPayable,
      exceededBy: customerPayable,
      coveredLabour,
      partsCustomerPayable: partsAmount,
      explanation: "Assist Plan: Labour & fault finding included. Parts & replacements billed directly to member account (R0 parts benefit)."
    };
  }
  const availableBenefit = summary.remainingBenefit;
  const amountCoveredByBenefit = Math.min(totalServiceAmount, availableBenefit);
  const amountPayableByCustomer = Math.max(0, totalServiceAmount - amountCoveredByBenefit);
  return {
    annualBenefit: summary.annualBenefit,
    availableBenefit,
    usedBenefit: summary.usedBenefit,
    isPartsBenefitZero: false,
    coveredAmount: amountCoveredByBenefit,
    amountCoveredByBenefit,
    customerPayable: amountPayableByCustomer,
    amountPayableByCustomer,
    exceededBy: amountPayableByCustomer,
    exceedsBenefit: amountPayableByCustomer > 0,
    explanation: amountPayableByCustomer > 0 ? `Service total (R${totalServiceAmount.toFixed(2)}) exceeds available annual benefit (R${availableBenefit.toFixed(2)}). R${amountCoveredByBenefit.toFixed(2)} covered by assistance benefit, remaining R${amountPayableByCustomer.toFixed(2)} payable by member.` : `Service total of R${totalServiceAmount.toFixed(2)} is 100% covered by your available annual assistance benefit. Customer payable: R0.00.`
  };
}
async function deductFromBenefit(params) {
  const {
    userId,
    description,
    reference,
    claimId,
    invoiceId,
    overrideReason,
    actorId,
    actorRole = "System"
  } = params;
  const amountToDeduct = Number(params.amountToDeduct ?? params.amount ?? 0);
  const adminOverride = Boolean(params.adminOverride ?? params.isOverride ?? false);
  if (amountToDeduct <= 0) {
    return {
      remainingBenefit: 0,
      usedBenefit: 0,
      transaction: null
    };
  }
  const membership = await getOrCreateActiveMembership(userId);
  const summary = await getMemberBenefitSummary(userId);
  if (!summary.isEligibleForBenefits && !adminOverride) {
    throw new Error(
      `Cannot deduct assistance benefits. Membership is ${summary.status} (${summary.activationPercentage}% collected). Annual assistance benefits unlock after completing the 100% activation payments, unless authorized by administrative override.`
    );
  }
  if (summary.isPartsBenefitZero && !adminOverride) {
    throw new Error("Assist plan has R0 parts benefit. Cannot deduct benefit allowance unless authorised by administrative override.");
  }
  if (amountToDeduct > summary.remainingBenefit && !adminOverride) {
    throw new Error(
      `Benefit limit exceeded. Requested deduction R${amountToDeduct.toFixed(2)} exceeds remaining annual allowance of R${summary.remainingBenefit.toFixed(2)}. Administrative override required.`
    );
  }
  const previousBalance = summary.remainingBenefit;
  const newBalance = Math.max(0, previousBalance - amountToDeduct);
  const transaction = await prisma.benefitTransaction.create({
    data: {
      membershipId: membership.id,
      userId,
      claimId,
      invoiceId,
      date: /* @__PURE__ */ new Date(),
      reference,
      description: adminOverride ? `${description} [ADMIN OVERRIDE: ${overrideReason || "Approved"}]` : description,
      debit: amountToDeduct,
      credit: 0,
      balance: newBalance
    }
  });
  await writeAuditLog({
    userId: actorId || userId,
    userType: actorRole,
    action: adminOverride ? "Benefit Deduction (Admin Override)" : "Benefit Deduction",
    details: `Deducted R${amountToDeduct.toLocaleString()} from annual assistance benefit for ${reference}. Running balance: R${newBalance.toLocaleString()}. Reason: ${description}`,
    newValue: { transactionId: transaction.id, remainingBenefit: newBalance, debit: amountToDeduct }
  });
  return {
    transaction: {
      ...transaction,
      notes: overrideReason || description
    },
    remainingBenefit: newBalance,
    usedBenefit: summary.usedBenefit + amountToDeduct,
    membership
  };
}
async function changeCustomerPlan(arg1, arg2, arg3, arg4, arg5) {
  let userId;
  let newPlanId;
  let actorId = "system";
  let actorRole = "System";
  let reason = "";
  if (typeof arg1 === "object") {
    userId = arg1.userId;
    newPlanId = arg1.newPlanId;
    actorId = arg1.actorId || "system";
    actorRole = arg1.actorRole || "System";
    reason = arg1.reason || "";
  } else {
    userId = arg1;
    newPlanId = arg2 || "assist_plus";
    reason = arg3 || "";
    actorId = arg4 || "system";
    actorRole = arg5 || "System";
  }
  const newPlan = getPlanById(newPlanId);
  const currentMembership = await prisma.membership.findFirst({
    where: { userId, status: "Active" },
    orderBy: { createdAt: "desc" }
  });
  const previousPlanName = currentMembership ? currentMembership.planName : "None";
  if (currentMembership) {
    await prisma.membership.update({
      where: { id: currentMembership.id },
      data: { status: "Superseded" }
    });
  }
  const now = /* @__PURE__ */ new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);
  const newMembership = await prisma.membership.create({
    data: {
      userId,
      planId: newPlan.id,
      planName: newPlan.name,
      monthlyPrice: newPlan.monthlyPrice,
      annualBenefit: newPlan.annualBenefit,
      benefitYearStart: now,
      benefitYearEnd: oneYearLater,
      status: "Active",
      benefitTransactions: {
        create: {
          userId,
          reference: `PLAN-CHG-${now.getFullYear()}`,
          description: `Plan Upgrade/Migration to ${newPlan.name}. Initial Annual Allowance R${newPlan.annualBenefit.toLocaleString()}`,
          credit: newPlan.annualBenefit,
          debit: 0,
          balance: newPlan.annualBenefit,
          date: now
        }
      }
    },
    include: {
      benefitTransactions: true
    }
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      package: newPlan.name
    }
  });
  await writeAuditLog({
    userId: actorId,
    userType: actorRole,
    action: "Plan Changed",
    details: `Customer plan updated from ${previousPlanName} to ${newPlan.name} (R${newPlan.monthlyPrice}/mo, R${newPlan.annualBenefit.toLocaleString()} annual benefit). Reason: ${reason || "Customer/Admin plan update"}`,
    previousValue: { plan: previousPlanName },
    newValue: { plan: newPlan.name, monthlyPrice: newPlan.monthlyPrice, annualBenefit: newPlan.annualBenefit }
  });
  return newMembership;
}

// server/src/routes/jobs.ts
var router12 = Router12();
function generateClaimNumber() {
  const rand = Math.floor(1e5 + Math.random() * 9e5);
  return `SDA-CLM-${rand}`;
}
function generateInvoiceNumber() {
  const rand = Math.floor(1e5 + Math.random() * 9e5);
  return `SDA-INV-${rand}`;
}
function formatJob(j) {
  const isNonMember = j.customerType === "NON_MEMBER_EMERGENCY";
  let parsedVehicle = null;
  if (j.customerVehicle) {
    try {
      parsedVehicle = typeof j.customerVehicle === "string" ? JSON.parse(j.customerVehicle) : j.customerVehicle;
    } catch {
      parsedVehicle = j.customerVehicle;
    }
  }
  let parsedResponderVehicle = null;
  if (j.vehicleInfo) {
    try {
      parsedResponderVehicle = typeof j.vehicleInfo === "string" ? JSON.parse(j.vehicleInfo) : j.vehicleInfo;
    } catch {
      parsedResponderVehicle = j.vehicleInfo;
    }
  }
  return {
    ...j,
    customerType: j.customerType || "MEMBER",
    customerName: isNonMember ? j.nonMemberName || "Emergency Caller" : j.customer?.name || "Valued Member",
    customerAddress: isNonMember ? j.nonMemberAddress || "Incident Location" : j.customer?.address || "Sandton, Johannesburg",
    customerPhone: isNonMember ? j.nonMemberPhone || "" : j.customer?.phone || "",
    customerEmail: isNonMember ? j.nonMemberEmail || "" : j.customer?.email || "",
    customerVehicle: parsedVehicle,
    vehicleInfo: parsedResponderVehicle,
    finalAmount: isNonMember ? 650 : j.finalAmount || 0,
    callOutFee: isNonMember ? 650 : null,
    paymentStatus: j.paymentStatus || (isNonMember ? "Payment Required" : "Pending"),
    servicePerformed: j.servicePerformed || null
  };
}
function createJobsRouter(io) {
  router12.get("/", requireAuth, requireRoles("Administrator", "Super Administrator", "Contractor", "Dispatcher"), async (req, res) => {
    try {
      let jobs;
      if (req.user.role === "Contractor") {
        jobs = await prisma.job.findMany({
          where: { assignedContractorId: req.user.id },
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } }
          },
          orderBy: { createdAt: "desc" }
        });
      } else {
        jobs = await prisma.job.findMany({
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } }
          },
          orderBy: { createdAt: "desc" }
        });
      }
      return res.json(jobs.map(formatJob));
    } catch (error) {
      console.error("[Jobs/GET]", error);
      return res.status(500).json({ error: "Failed to retrieve jobs" });
    }
  });
  router12.get("/my", requireAuth, requireRoles("Customer"), async (req, res) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { customerId: req.user.id },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      return res.json(jobs.map(formatJob));
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
      let customerVehicleStr = null;
      if (req.body.vehicle) {
        customerVehicleStr = typeof req.body.vehicle === "string" ? req.body.vehicle : JSON.stringify(req.body.vehicle);
      }
      const membership = await getOrCreateActiveMembership(req.user.id);
      const claimNumber = generateClaimNumber();
      const job = await prisma.job.create({
        data: {
          customerType: "MEMBER",
          customerId: req.user.id,
          serviceType: req.body.serviceType,
          description: req.body.description,
          photoUrl: req.body.photoUrl,
          customerVehicle: customerVehicleStr,
          status: "Requested",
          trackerProgress: 10,
          claim: {
            create: {
              claimNumber,
              userId: req.user.id,
              membershipId: membership.id,
              serviceType: req.body.serviceType,
              description: req.body.description,
              vehicleOrProperty: customerVehicleStr ? "Vehicle on file" : customer.address || "Member Residence",
              amountClaimed: 0,
              amountApproved: 0,
              amountDeductedFromBenefit: 0,
              customerResponsibility: 0,
              status: "Submitted"
            }
          }
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          claim: true
        }
      });
      const formattedJob = formatJob(job);
      io?.to("admin-room").emit("new-job", formattedJob);
      await writeAuditLog({
        userId: req.user.id,
        userType: "Customer",
        action: "Member Service Requested",
        details: `Member ${customer.name} requested service: ${req.body.serviceType} \u2014 "${req.body.description}". Linked claim ${claimNumber} created.`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { jobId: job.id, serviceType: job.serviceType, customerType: "MEMBER", claimNumber }
      });
      return res.status(201).json(formattedJob);
    } catch (error) {
      console.error("[Jobs/Create]", error);
      return res.status(500).json({ error: "Failed to create job request" });
    }
  });
  router12.post("/emergency-non-member", async (req, res) => {
    const { name, phone, email, address, serviceType, description, urgency, additionalNotes, consentAgreed, photoUrl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Full name is required for emergency dispatch." });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: "Mobile contact number is required for dispatch communication." });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: "Incident location or address is required." });
    }
    if (!serviceType || !serviceType.trim()) {
      return res.status(400).json({ error: "Service category is required." });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Please provide a brief description of the problem." });
    }
    const serviceLower = serviceType.toLowerCase();
    if (serviceLower.includes("roadside") || serviceLower.includes("towing") || serviceLower.includes("tyre") || serviceLower.includes("flat battery")) {
      return res.status(400).json({
        error: "Same Day Assist Emergency Assistance is for property and security services (Garage & Gate, Electric Fence, Alarm, CCTV, Access Control, Electrical, Plumbing, Locksmith, Security). Roadside assistance is not offered."
      });
    }
    if (consentAgreed !== void 0 && consentAgreed !== true && consentAgreed !== "true") {
      return res.status(400).json({ error: "Terms and R650 Call-Out Fee confirmation is required." });
    }
    try {
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1e3);
      const existingRecent = await prisma.job.findFirst({
        where: {
          customerType: "NON_MEMBER_EMERGENCY",
          nonMemberPhone: phone.trim(),
          serviceType: serviceType.trim(),
          createdAt: { gte: sixtySecondsAgo },
          paymentStatus: "Payment Required"
        }
      });
      if (existingRecent) {
        return res.status(200).json({
          success: true,
          duplicatePrevented: true,
          message: "Active emergency request found. Please complete the R650 Call-Out Fee payment to dispatch assistance.",
          job: formatJob(existingRecent),
          callOutFee: 650
        });
      }
      const problemDescription = urgency ? `[Urgency: ${urgency}] ${description.trim()}${additionalNotes ? ` | Note: ${additionalNotes.trim()}` : ""}` : description.trim();
      const job = await prisma.job.create({
        data: {
          customerType: "NON_MEMBER_EMERGENCY",
          customerId: null,
          nonMemberName: name.trim(),
          nonMemberPhone: phone.trim(),
          nonMemberEmail: email ? email.trim() : null,
          nonMemberAddress: address.trim(),
          customerVehicle: null,
          // Strictly NO roadside/vehicle tracking
          serviceType: serviceType.trim(),
          description: problemDescription,
          photoUrl: photoUrl || null,
          status: "Payment Required",
          trackerProgress: 10,
          paymentStatus: "Payment Required",
          finalAmount: 650
          // Fixed R650 Call-Out Fee
        }
      });
      const formattedJob = formatJob(job);
      io?.to("admin-room").emit("new-job", formattedJob);
      await writeAuditLog({
        userId: void 0,
        userType: "Non-Member Emergency",
        action: "Emergency Non-Member Request Created",
        details: `Non-member emergency requested by ${name} (${phone}) at "${address}": ${serviceType}. Status: Payment Required (R650 Call-Out Fee).`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { jobId: job.id, customerType: "NON_MEMBER_EMERGENCY", name, phone, address, callOutFee: 650 }
      });
      return res.status(201).json({
        success: true,
        message: "Emergency request registered. Payment of fixed R650 Call-Out Fee is required before dispatch.",
        job: formattedJob,
        callOutFee: 650
      });
    } catch (error) {
      console.error("[Jobs/EmergencyNonMember]", error);
      return res.status(500).json({ error: "Failed to submit emergency assistance request" });
    }
  });
  router12.get("/emergency-non-member/:id", async (req, res) => {
    try {
      const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } },
          payments: { select: { id: true, amount: true, status: true, paymentMethod: true, date: true, transactionRef: true, gatewayReference: true } },
          invoice: { select: { id: true, invoiceNumber: true, total: true, paymentStatus: true, date: true } }
        }
      });
      if (!job || job.customerType !== "NON_MEMBER_EMERGENCY") {
        return res.status(404).json({ error: "Emergency request not found" });
      }
      return res.json(formatJob(job));
    } catch (error) {
      console.error("[Jobs/GetEmergencyNonMember]", error);
      return res.status(500).json({ error: "Failed to retrieve emergency status" });
    }
  });
  router12.patch("/:id/service-amount", requireAuth, requireRoles("Administrator", "Super Administrator", "Dispatcher", "Contractor"), async (req, res) => {
    const { finalAmount, servicePerformed, status } = req.body;
    const amountNum = parseFloat(finalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: "Please provide a valid final service amount greater than zero." });
    }
    try {
      const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
          customer: { include: { memberships: { where: { status: "Active" }, take: 1 } } },
          claim: true,
          assignedContractor: true
        }
      });
      if (!job) return res.status(404).json({ error: "Job not found" });
      const newStatus = status || "Work Completed";
      let benefitCovered = 0;
      let customerPayable = amountNum;
      let paymentStatus = "Payment Due";
      if (job.customerId) {
        const coverage = await calculateBenefitCoverage({
          userId: job.customerId,
          totalServiceAmount: amountNum,
          partsAmount: req.body.partsAmount ? parseFloat(req.body.partsAmount) : 0,
          labourAmount: req.body.labourAmount ? parseFloat(req.body.labourAmount) : amountNum
        });
        benefitCovered = coverage.amountCoveredByBenefit;
        customerPayable = coverage.amountPayableByCustomer;
        paymentStatus = customerPayable === 0 ? "Paid" : "Payment Due";
        let claimRecord = job.claim;
        if (!claimRecord) {
          claimRecord = await prisma.claim.create({
            data: {
              claimNumber: generateClaimNumber(),
              userId: job.customerId,
              membershipId: job.customer?.memberships[0]?.id || null,
              jobId: job.id,
              serviceType: job.serviceType,
              description: job.description,
              amountClaimed: amountNum,
              amountApproved: amountNum,
              amountDeductedFromBenefit: benefitCovered,
              customerResponsibility: customerPayable,
              status: "Approved"
            }
          });
        } else {
          claimRecord = await prisma.claim.update({
            where: { id: claimRecord.id },
            data: {
              amountClaimed: amountNum,
              amountApproved: amountNum,
              amountDeductedFromBenefit: benefitCovered,
              customerResponsibility: customerPayable,
              status: "Approved",
              completedAt: /* @__PURE__ */ new Date()
            }
          });
        }
        if (benefitCovered > 0) {
          await deductFromBenefit({
            userId: job.customerId,
            amountToDeduct: benefitCovered,
            description: `Job ${job.id} (${job.serviceType}) Benefit Allowance`,
            reference: claimRecord.claimNumber,
            claimId: claimRecord.id,
            adminOverride: Boolean(req.body.adminOverride),
            overrideReason: req.body.overrideReason,
            actorId: req.user.id,
            actorRole: req.user.role
          });
        }
        const existingInvoice = await prisma.invoice.findFirst({ where: { jobId: job.id } });
        if (!existingInvoice) {
          await prisma.invoice.create({
            data: {
              invoiceNumber: generateInvoiceNumber(),
              userId: job.customerId,
              membershipId: job.customer?.memberships[0]?.id || null,
              jobId: job.id,
              claimId: claimRecord.id,
              customerName: job.customer?.name || "Member",
              customerEmail: job.customer?.email || null,
              customerAddress: job.customer?.address || null,
              membershipPlan: job.customer?.memberships[0]?.planName || job.customer?.package || "Assist Plus",
              serviceRequested: job.serviceType,
              technicianName: job.assignedContractor?.name || "Same Day Assist Certified Responder",
              parts: req.body.partsAmount ? parseFloat(req.body.partsAmount) : 0,
              labour: req.body.labourAmount ? parseFloat(req.body.labourAmount) : amountNum,
              subtotal: amountNum,
              taxVat: parseFloat((amountNum * 0.15).toFixed(2)),
              total: amountNum,
              amountCoveredByBenefit: benefitCovered,
              amountPayableByCustomer: customerPayable,
              paymentStatus: customerPayable === 0 ? "Paid" : "Unpaid",
              invoiceStatus: "Issued",
              paidAt: customerPayable === 0 ? /* @__PURE__ */ new Date() : null,
              notes: coverage.explanation
            }
          });
        }
      }
      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          finalAmount: amountNum,
          servicePerformed: servicePerformed || job.servicePerformed || "Emergency Assistance Performed",
          paymentStatus: job.paymentStatus === "Paid" ? "Paid" : paymentStatus,
          status: newStatus,
          trackerProgress: 95,
          completedAt: /* @__PURE__ */ new Date()
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true } }
        }
      });
      const formatted = formatJob(updated);
      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit("job-updated", formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit("job-updated", formatted);
      io?.to("admin-room").emit("job-updated", formatted);
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Emergency Service Amount Set",
        details: `Final amount of R${amountNum.toFixed(2)} set for Job ${job.id} (${job.customerType})`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { finalAmount: amountNum, servicePerformed, status: newStatus }
      });
      return res.json(formatted);
    } catch (error) {
      console.error("[Jobs/SetServiceAmount]", error);
      return res.status(500).json({ error: "Failed to set service amount" });
    }
  });
  router12.post("/emergency-non-member/:id/pay", async (req, res) => {
    const { paymentMethod, cardLast4, transactionRef, gatewayReference, simulateFailure } = req.body;
    try {
      const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: { payments: true, invoice: true }
      });
      if (!job) return res.status(404).json({ error: "Emergency request not found" });
      if (job.customerType !== "NON_MEMBER_EMERGENCY") {
        return res.status(400).json({ error: "This payment route is only for one-time emergency requests" });
      }
      if (job.paymentStatus === "Paid") {
        return res.json({
          success: true,
          message: "Payment already confirmed. Request is currently dispatchable.",
          job: formatJob(job),
          payment: job.payments?.[0] || null,
          invoice: job.invoice || null
        });
      }
      if (simulateFailure === true) {
        await writeAuditLog({
          userId: void 0,
          userType: "Non-Member Emergency",
          action: "Emergency Call-Out Payment Failed",
          details: `Card declined for emergency call-out fee (R650) on Job ${job.id} for ${job.nonMemberName}. Dispatch remains blocked.`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          newValue: { jobId: job.id, amount: 650, status: "Failed" }
        });
        return res.status(400).json({
          error: "Payment failed: Card authorization declined by issuing bank. The emergency dispatch team cannot be sent until the R650 call-out fee is successfully paid.",
          paymentStatus: "Failed",
          callOutFee: 650
        });
      }
      const CALL_OUT_FEE = 650;
      const actualTxRef = transactionRef || `GW-SDA-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const actualGwRef = gatewayReference || `SDA-EMG-${Date.now()}`;
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          userId: null,
          membershipId: null,
          jobId: job.id,
          customerName: job.nonMemberName || "Emergency Non-Member Customer",
          customerEmail: job.nonMemberEmail || null,
          customerAddress: job.nonMemberAddress || null,
          membershipPlan: "Non-Member Emergency Assistance",
          serviceRequested: job.serviceType,
          technicianName: "Same Day Assist Emergency Response Unit",
          parts: 0,
          labour: CALL_OUT_FEE,
          otherCharges: 0,
          subtotal: CALL_OUT_FEE,
          taxVat: parseFloat((CALL_OUT_FEE * 0.15).toFixed(2)),
          total: CALL_OUT_FEE,
          amountCoveredByBenefit: 0,
          amountPayableByCustomer: CALL_OUT_FEE,
          paymentStatus: "Paid",
          invoiceStatus: "Paid",
          paidAt: /* @__PURE__ */ new Date(),
          paymentMethod: paymentMethod || "Card Online",
          notes: "Emergency Assistance Call-Out Fee (R650.00). Fixed non-member one-time fee paid prior to dispatch."
        }
      });
      const payment = await prisma.payment.create({
        data: {
          customerId: null,
          customerName: job.nonMemberName || "Emergency Non-Member Customer",
          jobId: job.id,
          invoiceId: invoice.id,
          paymentStage: "SERVICE_COPAY",
          type: "Emergency Assistance Call-Out Fee",
          amount: CALL_OUT_FEE,
          status: "Paid",
          paymentMethod: paymentMethod || "Card Online",
          date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          paidAt: /* @__PURE__ */ new Date(),
          transactionRef: actualTxRef,
          gatewayReference: actualGwRef
        }
      });
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: {
          paymentStatus: "Paid",
          status: "Awaiting Dispatch",
          trackerProgress: 25,
          finalAmount: CALL_OUT_FEE
        },
        include: {
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } },
          payments: true,
          invoice: true
        }
      });
      const formatted = formatJob(updatedJob);
      io?.to(`emergency-job-${job.id}`).emit("job-updated", formatted);
      io?.to("admin-room").emit("job-updated", formatted);
      io?.to("admin-room").emit("emergency-paid", {
        jobId: job.id,
        amount: CALL_OUT_FEE,
        customerName: job.nonMemberName,
        paymentRef: actualGwRef
      });
      await writeAuditLog({
        userId: void 0,
        userType: "Non-Member Emergency",
        action: "Emergency Call-Out Fee Confirmed",
        details: `Non-member ${job.nonMemberName} paid Emergency Call-Out Fee of R${CALL_OUT_FEE.toFixed(2)} for Job ${job.id} via ${paymentMethod || "Card"} (Ref: ${actualGwRef}). Request unlocked for dispatch.`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { paymentId: payment.id, invoiceId: invoice.id, amount: CALL_OUT_FEE, status: "Paid", customerType: "NON_MEMBER_EMERGENCY" }
      });
      return res.json({
        success: true,
        message: "Payment confirmed! R650 Emergency Call-Out Fee paid. Dispatch team has been notified.",
        payment,
        invoice,
        job: formatted
      });
    } catch (error) {
      console.error("[Jobs/PayEmergency]", error);
      return res.status(500).json({ error: "Failed to process payment" });
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
      if (job.customerType === "NON_MEMBER_EMERGENCY" && job.paymentStatus !== "Paid") {
        return res.status(400).json({
          error: "Cannot dispatch unit: Emergency Assistance Call-Out Fee (R650) must be confirmed and paid before dispatch.",
          paymentStatus: job.paymentStatus,
          callOutFeeRequired: 650
        });
      }
      const prevStatus = job.status;
      const vehicleInfo = JSON.stringify({
        make: "Toyota",
        model: "Hilux 4x4 Response Unit",
        licensePlate: "SDA-01-GP",
        color: "Tactical White"
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
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true } }
        }
      });
      await prisma.user.update({ where: { id: contractorId }, data: { workload: { increment: 1 } } });
      const formatted = formatJob(updated);
      io?.to(`contractor-${contractorId}`).emit("job-assigned", formatted);
      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit("job-updated", formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit("job-updated", formatted);
      io?.to("admin-room").emit("job-updated", formatted);
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Service Provider Assigned",
        details: `Dispatched ${contractor.name} to Job ${req.params.id} for ${job.nonMemberName || job.customer?.name || "Customer"}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        previousValue: { status: prevStatus },
        newValue: { status: "Service Provider Assigned", contractorId, contractorName: contractor.name }
      });
      return res.json(formatted);
    } catch (error) {
      console.error("[Jobs/Assign]", error);
      return res.status(500).json({ error: "Failed to assign contractor" });
    }
  });
  router12.patch("/:id/status", requireAuth, async (req, res) => {
    const { status } = req.body;
    const progressMap = {
      "Payment Required": 10,
      "Payment Processing": 15,
      "Payment Confirmed": 20,
      "Awaiting Dispatch": 25,
      "Request Received": 10,
      "Requested": 10,
      "Request Under Review": 20,
      "Accepted": 25,
      "Service Provider Assigned": 35,
      "Preparing for Dispatch": 45,
      "Dispatched": 50,
      "Team Dispatched": 50,
      "Team En Route": 65,
      "En Route": 65,
      "Arrived": 80,
      "Assistance In Progress": 85,
      "Service In Progress": 85,
      "In Progress": 85,
      "Work Completed": 95,
      "Payment Pending": 98,
      "Service Completed": 100,
      "Completed": 100,
      "Paid": 100,
      "Closed": 100,
      "Cancelled": 0
    };
    if (progressMap[status] === void 0) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }
    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: "Job not found" });
      const DISPATCH_WORKFLOW_STATUSES = [
        "Service Provider Assigned",
        "Preparing for Dispatch",
        "Dispatched",
        "Team Dispatched",
        "En Route",
        "Team En Route",
        "Arrived",
        "Assistance In Progress",
        "Service In Progress",
        "In Progress",
        "Work Completed",
        "Service Completed",
        "Completed"
      ];
      if (job.customerType === "NON_MEMBER_EMERGENCY" && job.paymentStatus !== "Paid" && DISPATCH_WORKFLOW_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Cannot change status to "${status}": The R650 Emergency Call-Out Fee must be confirmed before dispatch.`,
          paymentStatus: job.paymentStatus,
          callOutFeeRequired: 650
        });
      }
      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          status,
          trackerProgress: progressMap[status],
          completedAt: ["Service Completed", "Completed", "Work Completed"].includes(status) ? /* @__PURE__ */ new Date() : job.completedAt
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, lat: true, lng: true } }
        }
      });
      const formatted = formatJob(updated);
      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit("job-updated", formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit("job-updated", formatted);
      io?.to("admin-room").emit("job-updated", formatted);
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
      return res.json(formatted);
    } catch (error) {
      console.error("[Jobs/Status]", error);
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
      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit("contractor-location", locationPayload);
      }
      io?.to(`emergency-job-${job.id}`).emit("contractor-location", locationPayload);
      io?.to("admin-room").emit("contractor-location", locationPayload);
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
      const [updated] = await prisma.$transaction([
        prisma.job.update({
          where: { id: req.params.id },
          data: {
            status: "Work Completed",
            trackerProgress: 95,
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
        prisma.user.update({
          where: { id: req.user.id },
          data: { workload: { decrement: 1 } }
        })
      ]);
      const formatted = formatJob(updated);
      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit("job-updated", formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit("job-updated", formatted);
      io?.to("admin-room").emit("job-updated", formatted);
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Job Work Completed",
        details: `Contractor completed work on Job ${req.params.id} for ${job.nonMemberName || job.customer?.name || "Customer"}.`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { status: "Work Completed", hasSignature: !!contractorSignature }
      });
      return res.json(formatted);
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
      const formatted = formatJob(updated);
      io?.to("admin-room").emit("job-updated", formatted);
      await writeAuditLog({
        userId: req.user.id,
        userType: "Customer",
        action: "Job Rated",
        details: `Customer rated Job ${req.params.id} with ${rating}/5 stars`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        newValue: { rating, ratingComment, status: "Closed" }
      });
      return res.json(formatted);
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
      const formatted = formatJob(updated);
      io?.to("admin-room").emit("job-updated", formatted);
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
      return res.json(formatted);
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

// server/src/routes/vehicles.ts
import { Router as Router17 } from "express";
var router17 = Router17();
router17.get("/", requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user.role === "Administrator" || req.user.role === "Super Administrator";
    const vehicles = await prisma.vehicle.findMany({
      where: isAdmin ? {} : { userId: req.user.id },
      include: isAdmin ? { user: { select: { id: true, name: true, email: true, phone: true } } } : void 0,
      orderBy: { createdAt: "desc" }
    });
    return res.json(vehicles);
  } catch (error) {
    console.error("[Vehicles/GET]", error);
    return res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});
router17.post("/", requireAuth, async (req, res) => {
  const { make, model, year, licensePlate, color, vinNumber, notes } = req.body;
  if (!make || !model || !licensePlate) {
    return res.status(400).json({ error: "Vehicle make, model, and license plate are required." });
  }
  const parsedYear = year ? parseInt(year, 10) : (/* @__PURE__ */ new Date()).getFullYear();
  if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > (/* @__PURE__ */ new Date()).getFullYear() + 2) {
    return res.status(400).json({ error: "Please provide a valid manufacturing year." });
  }
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        make: make.trim(),
        model: model.trim(),
        year: parsedYear,
        licensePlate: licensePlate.trim().toUpperCase(),
        color: (color || "Unspecified").trim(),
        vinNumber: vinNumber ? vinNumber.trim() : null,
        notes: notes ? notes.trim() : null
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Vehicle Registered",
      details: `Registered vehicle ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      newValue: { vehicleId: vehicle.id, licensePlate: vehicle.licensePlate }
    });
    return res.status(201).json(vehicle);
  } catch (error) {
    console.error("[Vehicles/POST]", error);
    return res.status(500).json({ error: "Failed to register vehicle" });
  }
});
router17.put("/:id", requireAuth, async (req, res) => {
  const { make, model, year, licensePlate, color, vinNumber, notes } = req.body;
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Vehicle record not found" });
    }
    const isAdmin = req.user.role === "Administrator" || req.user.role === "Super Administrator";
    if (!isAdmin && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to modify this vehicle" });
    }
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        make: make ? make.trim() : existing.make,
        model: model ? model.trim() : existing.model,
        year: year ? parseInt(year, 10) : existing.year,
        licensePlate: licensePlate ? licensePlate.trim().toUpperCase() : existing.licensePlate,
        color: color ? color.trim() : existing.color,
        vinNumber: vinNumber !== void 0 ? vinNumber ? vinNumber.trim() : null : existing.vinNumber,
        notes: notes !== void 0 ? notes ? notes.trim() : null : existing.notes
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error("[Vehicles/PUT]", error);
    return res.status(500).json({ error: "Failed to update vehicle" });
  }
});
router17.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    const isAdmin = req.user.role === "Administrator" || req.user.role === "Super Administrator";
    if (!isAdmin && existing.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to delete this vehicle" });
    }
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Vehicle Removed",
      details: `Removed vehicle ${existing.make} ${existing.model} (${existing.licensePlate})`,
      previousValue: { vehicleId: existing.id, licensePlate: existing.licensePlate }
    });
    return res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("[Vehicles/DELETE]", error);
    return res.status(500).json({ error: "Failed to delete vehicle" });
  }
});
var vehicles_default = router17;

// server/src/routes/memberships.ts
import { Router as Router18 } from "express";
init_plans();
var router18 = Router18();
router18.get("/plans", async (req, res) => {
  return res.json(PLANS_LIST);
});
router18.get("/my", requireAuth, requireRoles("Customer"), async (req, res) => {
  try {
    const summary = await getMemberBenefitSummary(req.user.id);
    return res.json(summary);
  } catch (error) {
    console.error("[Memberships/My]", error);
    return res.status(500).json({ error: error.message || "Failed to retrieve membership benefit summary" });
  }
});
router18.post("/change-plan", requireAuth, async (req, res) => {
  const { planId, customerId, reason } = req.body;
  if (!planId) return res.status(400).json({ error: "planId is required" });
  const targetUserId = customerId && (req.user.role === "Administrator" || req.user.role === "Super Administrator") ? customerId : req.user.id;
  try {
    const newMembership = await changeCustomerPlan({
      userId: targetUserId,
      newPlanId: planId,
      actorId: req.user.id,
      actorRole: req.user.role,
      reason
    });
    const summary = await getMemberBenefitSummary(targetUserId);
    return res.json({
      success: true,
      message: `Plan successfully updated to ${newMembership.planName}`,
      summary
    });
  } catch (error) {
    console.error("[Memberships/ChangePlan]", error);
    return res.status(500).json({ error: error.message || "Failed to change membership plan" });
  }
});
router18.get(
  "/customer/:userId",
  requireAuth,
  requireRoles("Administrator", "Super Administrator", "Dispatcher"),
  async (req, res) => {
    try {
      const summary = await getMemberBenefitSummary(req.params.userId);
      const user = await prisma.user.findUnique({
        where: { id: req.params.userId },
        select: { id: true, name: true, email: true, phone: true, address: true, status: true, package: true, memberSince: true }
      });
      return res.json({ customer: user, summary });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Failed to load customer benefit data" });
    }
  }
);
router18.post(
  "/customer/:userId/override-deduction",
  requireAuth,
  requireRoles("Administrator", "Super Administrator"),
  async (req, res) => {
    const { amount, description, reference, reason } = req.body;
    if (!amount || !description) {
      return res.status(400).json({ error: "amount and description are required" });
    }
    try {
      const transaction = await deductFromBenefit({
        userId: req.params.userId,
        amountToDeduct: parseFloat(amount),
        description,
        reference: reference || `ADMIN-ADJ-${Date.now().toString().slice(-4)}`,
        adminOverride: true,
        overrideReason: reason || "Administrative authorization",
        actorId: req.user.id,
        actorRole: req.user.role
      });
      const summary = await getMemberBenefitSummary(req.params.userId);
      return res.json({ success: true, transaction, summary });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Override deduction failed" });
    }
  }
);
router18.post(
  "/customer/:userId/reset-period",
  requireAuth,
  requireRoles("Administrator", "Super Administrator"),
  async (req, res) => {
    try {
      const current = await prisma.membership.findFirst({
        where: { userId: req.params.userId, status: "Active" },
        orderBy: { createdAt: "desc" }
      });
      if (!current) return res.status(404).json({ error: "Active membership not found" });
      await prisma.membership.update({
        where: { id: current.id },
        data: { status: "Expired" }
      });
      const now = /* @__PURE__ */ new Date();
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(now.getFullYear() + 1);
      const newMembership = await prisma.membership.create({
        data: {
          userId: req.params.userId,
          planId: current.planId,
          planName: current.planName,
          monthlyPrice: current.monthlyPrice,
          annualBenefit: current.annualBenefit,
          benefitYearStart: now,
          benefitYearEnd: oneYearLater,
          status: "Active",
          benefitTransactions: {
            create: {
              userId: req.params.userId,
              reference: `RENEWAL-${now.getFullYear()}`,
              description: `Annual Benefit Period Renewal (${current.planName})`,
              credit: current.annualBenefit,
              debit: 0,
              balance: current.annualBenefit,
              date: now
            }
          }
        }
      });
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Benefit Period Reset",
        details: `Reset annual benefit period for customer ${req.params.userId}. New period ends ${oneYearLater.toISOString().slice(0, 10)}. Initial allowance R${current.annualBenefit.toLocaleString()}`,
        newValue: { membershipId: newMembership.id }
      });
      const summary = await getMemberBenefitSummary(req.params.userId);
      return res.json({ success: true, message: "New benefit period established", summary });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Failed to reset benefit period" });
    }
  }
);
var memberships_default = router18;

// server/src/routes/claims.ts
import { Router as Router19 } from "express";
var router19 = Router19();
function generateClaimNumber2() {
  const rand = Math.floor(1e5 + Math.random() * 9e5);
  return `SDA-CLM-${rand}`;
}
function generateInvoiceNumber2() {
  const rand = Math.floor(1e5 + Math.random() * 9e5);
  return `SDA-INV-${rand}`;
}
router19.get("/my", requireAuth, requireRoles("Customer"), async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { userId: req.user.id },
      include: {
        invoice: true,
        membership: { select: { planName: true, planId: true, annualBenefit: true } },
        job: { select: { id: true, status: true, serviceType: true, servicePerformed: true } }
      },
      orderBy: { submittedAt: "desc" }
    });
    return res.json(claims);
  } catch (error) {
    console.error("[Claims/My]", error);
    return res.status(500).json({ error: "Failed to retrieve claims" });
  }
});
router19.get(
  "/",
  requireAuth,
  requireRoles("Administrator", "Super Administrator", "Dispatcher"),
  async (req, res) => {
    try {
      const { status, search, plan, serviceType } = req.query;
      const where = {};
      if (status && status !== "all") {
        where.status = String(status);
      }
      if (serviceType) {
        where.serviceType = { contains: String(serviceType) };
      }
      if (search) {
        const query = String(search).trim();
        where.OR = [
          { claimNumber: { contains: query } },
          { description: { contains: query } },
          { user: { name: { contains: query } } },
          { user: { email: { contains: query } } }
        ];
      }
      if (plan) {
        where.membership = { planName: { contains: String(plan) } };
      }
      const claims = await prisma.claim.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, package: true } },
          membership: { select: { planName: true, planId: true, annualBenefit: true } },
          invoice: true,
          job: { select: { id: true, status: true, assignedContractor: { select: { name: true } } } }
        },
        orderBy: { submittedAt: "desc" }
      });
      return res.json(claims);
    } catch (error) {
      console.error("[Claims/All]", error);
      return res.status(500).json({ error: "Failed to retrieve claims" });
    }
  }
);
router19.get("/:id", requireAuth, async (req, res) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true, package: true } },
        membership: true,
        invoice: true,
        benefitTransactions: { orderBy: { date: "desc" } },
        job: true
      }
    });
    if (!claim) return res.status(404).json({ error: "Claim not found" });
    if (req.user.role === "Customer" && claim.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only view your own claims." });
    }
    return res.json(claim);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve claim details" });
  }
});
router19.post("/calculate-coverage", requireAuth, async (req, res) => {
  const { userId, totalAmount, partsAmount, labourAmount } = req.body;
  const targetUserId = userId && (req.user.role === "Administrator" || req.user.role === "Super Administrator") ? userId : req.user.id;
  try {
    const coverage = await calculateBenefitCoverage({
      userId: targetUserId,
      totalServiceAmount: parseFloat(totalAmount || 0),
      partsAmount: parseFloat(partsAmount || 0),
      labourAmount: parseFloat(labourAmount || 0)
    });
    return res.json(coverage);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Calculation failed" });
  }
});
router19.post("/", requireAuth, requireRoles("Customer"), async (req, res) => {
  const { serviceType, description, vehicleOrProperty, contractorName, amountClaimed, jobId, supportingDocs } = req.body;
  if (!serviceType || !description || amountClaimed === void 0) {
    return res.status(400).json({ error: "serviceType, description, and amountClaimed are required." });
  }
  try {
    const membership = await getOrCreateActiveMembership(req.user.id);
    const claimNumber = generateClaimNumber2();
    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        userId: req.user.id,
        membershipId: membership.id,
        jobId: jobId || null,
        serviceType,
        description,
        vehicleOrProperty: vehicleOrProperty || null,
        contractorName: contractorName || null,
        amountClaimed: parseFloat(amountClaimed),
        amountApproved: 0,
        amountDeductedFromBenefit: 0,
        customerResponsibility: parseFloat(amountClaimed),
        status: "Submitted",
        supportingDocs: supportingDocs ? JSON.stringify(supportingDocs) : null
      },
      include: {
        membership: true
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Claim Created",
      details: `Submitted assistance claim ${claimNumber} for ${serviceType} (R${parseFloat(amountClaimed).toFixed(2)})`,
      newValue: { claimNumber, amountClaimed, serviceType }
    });
    return res.status(201).json(claim);
  } catch (error) {
    console.error("[Claims/Create]", error);
    return res.status(500).json({ error: error.message || "Failed to submit claim" });
  }
});
router19.patch(
  "/:id/review",
  requireAuth,
  requireRoles("Administrator", "Super Administrator"),
  async (req, res) => {
    const { status, amountApproved, partsAmount, labourAmount, rejectionReason, adminOverride, overrideReason } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    try {
      const claim = await prisma.claim.findUnique({
        where: { id: req.params.id },
        include: { user: true, membership: true, invoice: true }
      });
      if (!claim) return res.status(404).json({ error: "Claim not found" });
      let approvedNum = amountApproved !== void 0 ? parseFloat(amountApproved) : claim.amountClaimed;
      let partsNum = partsAmount !== void 0 ? parseFloat(partsAmount) : 0;
      let labourNum = labourAmount !== void 0 ? parseFloat(labourAmount) : approvedNum - partsNum;
      if (labourNum < 0) labourNum = 0;
      let amountDeducted = 0;
      let customerPayable = approvedNum;
      let createdInvoice = claim.invoice;
      if (status === "Approved") {
        const coverage = await calculateBenefitCoverage({
          userId: claim.userId,
          totalServiceAmount: approvedNum,
          partsAmount: partsNum,
          labourAmount: labourNum
        });
        amountDeducted = coverage.amountCoveredByBenefit;
        customerPayable = coverage.amountPayableByCustomer;
        if (amountDeducted > 0) {
          await deductFromBenefit({
            userId: claim.userId,
            amountToDeduct: amountDeducted,
            description: `Claim ${claim.claimNumber} (${claim.serviceType}) Benefit Coverage`,
            reference: claim.claimNumber,
            claimId: claim.id,
            adminOverride: Boolean(adminOverride),
            overrideReason,
            actorId: req.user.id,
            actorRole: req.user.role
          });
        }
        if (!createdInvoice) {
          const invNumber = generateInvoiceNumber2();
          const userObj = claim.user;
          const membershipObj = claim.membership;
          createdInvoice = await prisma.invoice.create({
            data: {
              invoiceNumber: invNumber,
              userId: claim.userId,
              membershipId: claim.membershipId,
              claimId: claim.id,
              jobId: claim.jobId,
              customerName: userObj.name,
              customerEmail: userObj.email,
              customerAddress: userObj.address,
              membershipPlan: membershipObj ? membershipObj.planName : userObj.package || "Assist Plus",
              serviceRequested: claim.serviceType,
              technicianName: claim.contractorName || "Same Day Assist Certified Responder",
              parts: partsNum,
              labour: labourNum,
              otherCharges: 0,
              subtotal: approvedNum,
              taxVat: parseFloat((approvedNum * 0.15).toFixed(2)),
              total: approvedNum,
              amountCoveredByBenefit: amountDeducted,
              amountPayableByCustomer: customerPayable,
              paymentStatus: customerPayable === 0 ? "Paid" : "Unpaid",
              invoiceStatus: "Issued",
              paidAt: customerPayable === 0 ? /* @__PURE__ */ new Date() : null,
              notes: coverage.explanation
            }
          });
          await prisma.benefitTransaction.updateMany({
            where: { claimId: claim.id },
            data: { invoiceId: createdInvoice.id }
          });
        }
      }
      const updatedClaim = await prisma.claim.update({
        where: { id: claim.id },
        data: {
          status,
          amountApproved: status === "Approved" ? approvedNum : claim.amountApproved,
          amountDeductedFromBenefit: status === "Approved" ? amountDeducted : claim.amountDeductedFromBenefit,
          customerResponsibility: status === "Approved" ? customerPayable : claim.customerResponsibility,
          rejectionReason: status === "Rejected" ? rejectionReason || "Claim declined by administrator" : null,
          adminOverride: Boolean(adminOverride),
          overrideReason: overrideReason || null,
          reviewedAt: /* @__PURE__ */ new Date(),
          completedAt: ["Completed", "Approved"].includes(status) ? /* @__PURE__ */ new Date() : null
        },
        include: {
          invoice: true,
          membership: true,
          user: { select: { id: true, name: true, email: true, phone: true } }
        }
      });
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: status === "Approved" ? "Claim Approved" : status === "Rejected" ? "Claim Rejected" : "Claim Updated",
        details: `Claim ${claim.claimNumber} updated to ${status}. Approved amount: R${approvedNum.toFixed(2)}, Deducted from annual benefit: R${amountDeducted.toFixed(2)}, Customer owes: R${customerPayable.toFixed(2)}`,
        previousValue: { status: claim.status },
        newValue: { status, amountApproved: approvedNum, amountDeducted, customerPayable }
      });
      return res.json(updatedClaim);
    } catch (error) {
      console.error("[Claims/Review]", error);
      return res.status(400).json({ error: error.message || "Failed to review claim" });
    }
  }
);
var claims_default = router19;

// server/src/routes/invoices.ts
import { Router as Router20 } from "express";
init_pdf();
var router20 = Router20();
function generateInvoiceNumber3() {
  const rand = Math.floor(1e5 + Math.random() * 9e5);
  return `SDA-INV-${rand}`;
}
router20.get("/my", requireAuth, requireRoles("Customer"), async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      include: {
        claim: { select: { id: true, claimNumber: true, serviceType: true, status: true } },
        job: { select: { id: true, status: true, serviceType: true } },
        membership: { select: { planName: true, planId: true, annualBenefit: true } }
      },
      orderBy: { date: "desc" }
    });
    return res.json(invoices);
  } catch (error) {
    console.error("[Invoices/My]", error);
    return res.status(500).json({ error: "Failed to retrieve invoices" });
  }
});
router20.get(
  "/",
  requireAuth,
  requireRoles("Administrator", "Super Administrator", "Dispatcher"),
  async (req, res) => {
    try {
      const { search, paymentStatus, plan, dateFrom, dateTo } = req.query;
      const where = {};
      if (paymentStatus && paymentStatus !== "all") {
        where.paymentStatus = String(paymentStatus);
      }
      if (plan) {
        where.membershipPlan = { contains: String(plan) };
      }
      if (search) {
        const query = String(search).trim();
        where.OR = [
          { invoiceNumber: { contains: query } },
          { customerName: { contains: query } },
          { serviceRequested: { contains: query } },
          { claim: { claimNumber: { contains: query } } },
          { user: { email: { contains: query } } },
          { user: { id: { contains: query } } }
        ];
      }
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(String(dateFrom));
        if (dateTo) where.date.lte = new Date(String(dateTo));
      }
      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          claim: { select: { id: true, claimNumber: true, status: true } },
          job: { select: { id: true, status: true } },
          membership: { select: { planName: true, planId: true } }
        },
        orderBy: { date: "desc" }
      });
      return res.json(invoices);
    } catch (error) {
      console.error("[Invoices/All]", error);
      return res.status(500).json({ error: "Failed to retrieve invoices" });
    }
  }
);
router20.get("/:id", requireAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true } },
        claim: true,
        job: true,
        membership: true,
        benefitTransactions: true
      }
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (req.user.role === "Customer" && invoice.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only view your own invoices." });
    }
    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve invoice" });
  }
});
router20.get("/:id/pdf", requireAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        claim: true,
        job: true,
        membership: true
      }
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (req.user.role === "Customer" && invoice.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied." });
    }
    const pdfBuffer = await generateInvoicePDF({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail || invoice.user?.email || "",
      customerAddress: invoice.customerAddress || invoice.user?.address || "",
      membershipPlan: invoice.membershipPlan,
      serviceRequested: invoice.serviceRequested,
      serviceReference: invoice.jobId || void 0,
      claimNumber: invoice.claim?.claimNumber || void 0,
      technicianName: invoice.technicianName || "Same Day Assist Responder",
      parts: invoice.parts,
      labour: invoice.labour,
      otherCharges: invoice.otherCharges,
      subtotal: invoice.subtotal,
      taxVat: invoice.taxVat,
      total: invoice.total,
      amountCoveredByBenefit: invoice.amountCoveredByBenefit,
      amountPayableByCustomer: invoice.amountPayableByCustomer,
      date: invoice.date.toISOString(),
      status: invoice.paymentStatus,
      invoiceStatus: invoice.invoiceStatus
    });
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`
    });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[Invoices/PDF]", error);
    return res.status(500).json({ error: "Failed to generate invoice PDF" });
  }
});
router20.post(
  "/",
  requireAuth,
  requireRoles("Administrator", "Super Administrator"),
  async (req, res) => {
    const {
      customerId,
      claimId,
      jobId,
      serviceRequested,
      technicianName,
      parts,
      labour,
      otherCharges,
      amountCoveredByBenefit,
      amountPayableByCustomer,
      paymentStatus,
      notes
    } = req.body;
    if (!customerId || !serviceRequested) {
      return res.status(400).json({ error: "customerId and serviceRequested are required" });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: customerId },
        include: {
          memberships: { where: { status: "Active" }, take: 1 }
        }
      });
      if (!user) return res.status(404).json({ error: "Customer not found" });
      const activeMembership = user.memberships[0] || null;
      const partsNum = parseFloat(parts || 0);
      const labourNum = parseFloat(labour || 0);
      const otherNum = parseFloat(otherCharges || 0);
      const subtotalNum = partsNum + labourNum + otherNum;
      const vatNum = parseFloat((subtotalNum * 0.15).toFixed(2));
      const totalNum = subtotalNum;
      const coveredNum = amountCoveredByBenefit !== void 0 ? parseFloat(amountCoveredByBenefit) : 0;
      const payableNum = amountPayableByCustomer !== void 0 ? parseFloat(amountPayableByCustomer) : Math.max(0, totalNum - coveredNum);
      const invoiceNumber = generateInvoiceNumber3();
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: user.id,
          membershipId: activeMembership?.id || null,
          claimId: claimId || null,
          jobId: jobId || null,
          customerName: user.name,
          customerEmail: user.email,
          customerAddress: user.address,
          membershipPlan: activeMembership?.planName || user.package || "Assist Plus",
          serviceRequested,
          technicianName: technicianName || "Same Day Assist Certified Responder",
          parts: partsNum,
          labour: labourNum,
          otherCharges: otherNum,
          subtotal: subtotalNum,
          taxVat: vatNum,
          total: totalNum,
          amountCoveredByBenefit: coveredNum,
          amountPayableByCustomer: payableNum,
          paymentStatus: paymentStatus || (payableNum === 0 ? "Paid" : "Unpaid"),
          invoiceStatus: "Issued",
          paidAt: payableNum === 0 ? /* @__PURE__ */ new Date() : null,
          notes
        },
        include: {
          user: true,
          claim: true
        }
      });
      await writeAuditLog({
        userId: req.user.id,
        userType: req.user.role,
        action: "Invoice Generated",
        details: `Generated Tax Invoice ${invoiceNumber} for ${user.name}. Total: R${totalNum.toFixed(2)}, Covered by benefit: R${coveredNum.toFixed(2)}, Customer payable: R${payableNum.toFixed(2)}`,
        newValue: { invoiceNumber, total: totalNum, covered: coveredNum, payable: payableNum }
      });
      return res.status(201).json(invoice);
    } catch (error) {
      console.error("[Invoices/Create]", error);
      return res.status(500).json({ error: error.message || "Failed to generate invoice" });
    }
  }
);
router20.patch("/:id/pay", requireAuth, async (req, res) => {
  const { paymentMethod, cardLast4 } = req.body;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (req.user.role === "Customer" && invoice.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied." });
    }
    if (invoice.paymentStatus === "Paid") {
      return res.status(400).json({ error: "Invoice is already paid in full." });
    }
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: "Paid",
        invoiceStatus: "Settled",
        paidAt: /* @__PURE__ */ new Date(),
        paymentMethod: paymentMethod || "Card Online"
      }
    });
    await prisma.payment.create({
      data: {
        customerId: invoice.userId,
        customerName: invoice.customerName,
        jobId: invoice.jobId,
        type: `Invoice Payment (${invoice.invoiceNumber})`,
        amount: invoice.amountPayableByCustomer,
        status: "Paid",
        paymentMethod: paymentMethod || "Card Online",
        date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      }
    });
    await writeAuditLog({
      userId: req.user.id,
      userType: req.user.role,
      action: "Invoice Paid",
      details: `Settled customer-payable balance of R${invoice.amountPayableByCustomer.toFixed(2)} on Invoice ${invoice.invoiceNumber} via ${paymentMethod || "Card"}${cardLast4 ? ` (Card: ****${cardLast4})` : ""}`,
      newValue: { invoiceNumber: invoice.invoiceNumber, amountPaid: invoice.amountPayableByCustomer }
    });
    return res.json({ success: true, message: "Invoice settled successfully!", invoice: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Payment processing failed" });
  }
});
var invoices_default = router20;

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
app.use("/api/vehicles", vehicles_default);
app.use("/api/profile-requests", profileRequests_default);
app.use("/api/verification", verification_default);
app.use("/api/ratings", ratings_default);
app.use("/api/messages", messages_default);
app.use("/api/wallet", wallet_default);
app.use("/api/memberships", memberships_default);
app.use("/api/claims", claims_default);
app.use("/api/invoices", invoices_default);
app.get("/api/pdf/quotation/:id", async (req, res) => {
  try {
    const { generateQuotationPDF: generateQuotationPDF2 } = await Promise.resolve().then(() => (init_pdf(), pdf_exports));
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true }
    });
    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    const lineItems = JSON.parse(quotation.lineItems);
    const pdfBuffer = await generateQuotationPDF2({
      id: quotation.id,
      customerName: quotation.enquiry.customerName,
      customerEmail: quotation.enquiry.email,
      customerAddress: quotation.enquiry.address,
      serviceCategory: quotation.enquiry.serviceCategory,
      lineItems,
      amount: quotation.amount,
      createdAt: quotation.createdAt.toISOString()
    });
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="SDA-Quote-${quotation.id}.pdf"` });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[PDF/Quotation]", error);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});
app.get("/api/pdf/invoice/:id", async (req, res) => {
  try {
    const { generateInvoicePDF: generateInvoicePDF2 } = await Promise.resolve().then(() => (init_pdf(), pdf_exports));
    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id: req.params.id }, { invoiceNumber: req.params.id }] },
      include: { user: true, claim: true }
    });
    if (invoice) {
      const pdfBuffer2 = await generateInvoicePDF2({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail || invoice.user?.email || "",
        customerAddress: invoice.customerAddress || invoice.user?.address || "",
        membershipPlan: invoice.membershipPlan,
        serviceRequested: invoice.serviceRequested,
        serviceReference: invoice.jobId || void 0,
        claimNumber: invoice.claim?.claimNumber || void 0,
        technicianName: invoice.technicianName || "Same Day Assist Responder",
        parts: invoice.parts,
        labour: invoice.labour,
        otherCharges: invoice.otherCharges,
        subtotal: invoice.subtotal,
        taxVat: invoice.taxVat,
        total: invoice.total,
        amountCoveredByBenefit: invoice.amountCoveredByBenefit,
        amountPayableByCustomer: invoice.amountPayableByCustomer,
        date: invoice.date.toISOString(),
        status: invoice.paymentStatus,
        invoiceStatus: invoice.invoiceStatus
      });
      res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"` });
      return res.send(pdfBuffer2);
    }
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { customer: true }
    });
    if (!payment) return res.status(404).json({ error: "Invoice record not found" });
    const pdfBuffer = await generateInvoicePDF2({
      id: payment.id,
      customerName: payment.customerName,
      customerEmail: payment.customer?.email,
      type: payment.type,
      amount: payment.amount,
      date: payment.date,
      status: payment.status
    });
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="SDA-Invoice-${payment.id}.pdf"` });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[PDF/Invoice]", error);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});
app.get("/api/pdf/completion/:id", async (req, res) => {
  try {
    const { generateCompletionReportPDF: generateCompletionReportPDF2 } = await Promise.resolve().then(() => (init_pdf(), pdf_exports));
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        assignedContractor: true
      }
    });
    if (!job || !job.completedAt) return res.status(404).json({ error: "Completed job not found" });
    const pdfBuffer = await generateCompletionReportPDF2({
      jobId: job.id,
      customerName: job.customer?.name || job.nonMemberName || "Customer",
      customerAddress: job.customer?.address || job.nonMemberAddress || "Customer Location",
      serviceType: job.serviceType,
      description: job.description,
      contractorName: job.assignedContractor?.name || "Same Day Assist Responder",
      contractorNotes: job.contractorNotes || "",
      contractorSignature: job.contractorSignature || "",
      completedAt: job.completedAt.toISOString(),
      rating: job.rating || void 0
    });
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="SDA-Completion-${job.id}.pdf"` });
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});
app.use((err, req, res, next) => {
  console.error("[Vercel Server Error]", err);
  res.status(500).json({ error: "Internal server error" });
});
var vercel_handler_default = app;
export {
  vercel_handler_default as default
};
