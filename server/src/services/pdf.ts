import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

const BRAND_RED = '#CC322C';
const BRAND_NAVY = '#091C3E';
const BRAND_GREY = '#64748B';

function drawHeader(doc: PDFKit.PDFDocument, title: string) {
  // Background header strip
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND_NAVY);

  // Brand name
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
    .text('SAME DAY ASSIST', 40, 20, { align: 'left' });
  doc.fillColor(BRAND_RED).fontSize(8).font('Helvetica')
    .text('EMERGENCY ASSIST NETWORK • PSIRA ASSURANCE • SOUTH AFRICA', 40, 46);

  // Document type tag
  doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
    .text(title, 40, 65, { align: 'left' });

  doc.fillColor(BRAND_NAVY).fontSize(9).font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}`, 0, 68, { align: 'right', width: doc.page.width - 40 });

  // Red accent line
  doc.rect(0, 90, doc.page.width, 4).fill(BRAND_RED);
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - 50;
  doc.rect(0, y, doc.page.width, 50).fill(BRAND_NAVY);
  doc.fillColor('white').fontSize(7).font('Helvetica')
    .text('© 2026 Same Day Assist (Pty) Ltd • Soweto, Johannesburg, South Africa • SABS & PSIRA Assured • All rights reserved.', 0, y + 18, { align: 'center', width: doc.page.width });
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string, y?: number) {
  const ty = y ?? doc.y;
  doc.rect(40, ty, doc.page.width - 80, 20).fill('#F1F5F9');
  doc.fillColor(BRAND_NAVY).fontSize(9).font('Helvetica-Bold').text(text, 48, ty + 5);
  doc.moveDown(0.5);
}

function row(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fillColor(BRAND_GREY).fontSize(8).font('Helvetica').text(`${label}:`, 48, doc.y, { continued: true, width: 140 });
  doc.fillColor('#1E293B').font('Helvetica').text(value, { width: 350 });
}

export async function generateQuotationPDF(data: {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  serviceCategory: string;
  lineItems: { description: string; cost: number }[];
  amount: number;
  createdAt: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Quotation ${data.id}`, Author: 'Same Day Assist' } });
    const buffers: Buffer[] = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawHeader(doc, 'PRE-COMPLIANCE REPAIR QUOTATION');
    doc.moveDown(4);

    sectionTitle(doc, 'CUSTOMER DETAILS');
    doc.moveDown(0.3);
    row(doc, 'Client Name', data.customerName);
    row(doc, 'Email', data.customerEmail);
    row(doc, 'Property Address', data.customerAddress);
    row(doc, 'Service Category', data.serviceCategory);
    row(doc, 'Quote Reference', data.id);
    row(doc, 'Date Issued', new Date(data.createdAt).toLocaleDateString('en-ZA'));

    doc.moveDown(1);
    sectionTitle(doc, 'REPAIR LINE ITEMS');
    doc.moveDown(0.3);

    // Table header
    doc.rect(48, doc.y, doc.page.width - 96, 18).fill('#E2E8F0');
    doc.fillColor(BRAND_NAVY).fontSize(8).font('Helvetica-Bold').text('Description', 54, doc.y - 14, { width: 320, continued: true });
    doc.text('Cost (ZAR)', { align: 'right', width: 120 });

    data.lineItems.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(48, doc.y, doc.page.width - 96, 16).fill('#F8FAFC');
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(item.description, 54, doc.y - 12, { width: 320, continued: true });
      doc.fillColor(BRAND_NAVY).font('Helvetica-Bold').text(`R ${item.cost.toFixed(2)}`, { align: 'right', width: 120 });
    });

    doc.moveDown(0.5);
    doc.rect(48, doc.y, doc.page.width - 96, 22).fill(BRAND_RED);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold').text('TOTAL AMOUNT DUE:', 54, doc.y - 17, { continued: true, width: 320 });
    doc.text(`R ${data.amount.toFixed(2)}`, { align: 'right', width: 120 });

    doc.moveDown(2);
    doc.fillColor(BRAND_GREY).fontSize(7).font('Helvetica')
      .text('This quotation is valid for 14 days from the issue date. Payment activates your Same Day Assist membership.', 48, doc.y);

    drawFooter(doc);
    doc.end();
  });
}

export async function generateInvoicePDF(data: {
  id: string;
  customerName: string;
  customerEmail: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Invoice ${data.id}`, Author: 'Same Day Assist' } });
    const buffers: Buffer[] = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawHeader(doc, 'TAX INVOICE');
    doc.moveDown(4);

    sectionTitle(doc, 'INVOICE DETAILS');
    doc.moveDown(0.3);
    row(doc, 'Invoice Reference', data.id);
    row(doc, 'Client Name', data.customerName);
    row(doc, 'Email', data.customerEmail);
    row(doc, 'Service Type', data.type);
    row(doc, 'Invoice Date', new Date(data.date).toLocaleDateString('en-ZA'));
    row(doc, 'Status', data.status);

    doc.moveDown(1.5);
    doc.rect(48, doc.y, doc.page.width - 96, 30).fill(BRAND_RED);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold').text(`AMOUNT: R ${data.amount.toFixed(2)}`, 0, doc.y - 22, { align: 'center', width: doc.page.width });

    drawFooter(doc);
    doc.end();
  });
}

export async function generateCompletionReportPDF(data: {
  jobId: string;
  customerName: string;
  customerAddress: string;
  serviceType: string;
  description: string;
  contractorName: string;
  contractorNotes: string;
  contractorSignature: string;
  completedAt: string;
  rating?: number;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Completion Report ${data.jobId}`, Author: 'Same Day Assist' } });
    const buffers: Buffer[] = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawHeader(doc, 'JOB COMPLETION REPORT');
    doc.moveDown(4);

    sectionTitle(doc, 'JOB DETAILS');
    doc.moveDown(0.3);
    row(doc, 'Job Reference', data.jobId);
    row(doc, 'Customer Name', data.customerName);
    row(doc, 'Service Address', data.customerAddress);
    row(doc, 'Service Type', data.serviceType);
    row(doc, 'Emergency Description', data.description);
    row(doc, 'Completed At', new Date(data.completedAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }));

    doc.moveDown(1);
    sectionTitle(doc, 'RESPONDER DETAILS');
    doc.moveDown(0.3);
    row(doc, 'Field Responder', data.contractorName);
    row(doc, 'Resolution Notes', data.contractorNotes);

    doc.moveDown(1);
    sectionTitle(doc, 'DIGITAL SIGNATURE RECORD');
    doc.moveDown(0.3);
    doc.fillColor(BRAND_NAVY).fontSize(12).font('Helvetica-BoldOblique').text(data.contractorSignature, 48, doc.y);
    doc.fillColor(BRAND_GREY).fontSize(7).font('Helvetica').text('Electronically signed by responding officer', 48, doc.y + 2);

    if (data.rating) {
      doc.moveDown(1);
      sectionTitle(doc, 'CUSTOMER SATISFACTION RATING');
      doc.moveDown(0.3);
      const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
      doc.fillColor(BRAND_RED).fontSize(16).font('Helvetica-Bold').text(stars, 48, doc.y);
    }

    drawFooter(doc);
    doc.end();
  });
}
