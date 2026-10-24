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
  invoiceNumber?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  membershipPlan?: string;
  serviceRequested?: string;
  serviceReference?: string;
  claimNumber?: string;
  technicianName?: string;
  parts?: number;
  labour?: number;
  otherCharges?: number;
  subtotal?: number;
  taxVat?: number;
  total?: number;
  amountCoveredByBenefit?: number;
  amountPayableByCustomer?: number;
  type?: string;
  amount?: number;
  date: string;
  status: string;
  invoiceStatus?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Tax Invoice ${data.invoiceNumber || data.id}`, Author: 'Same Day Assist' } });
    const buffers: Buffer[] = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawHeader(doc, 'OFFICIAL TAX INVOICE');
    doc.moveDown(4);

    const invNo = data.invoiceNumber || data.id;
    const invDate = new Date(data.date).toLocaleDateString('en-ZA');

    sectionTitle(doc, 'INVOICE & MEMBER INFORMATION');
    doc.moveDown(0.3);
    row(doc, 'Tax Invoice Number', invNo);
    row(doc, 'Date of Issue', invDate);
    row(doc, 'Member Name', data.customerName);
    if (data.customerEmail) row(doc, 'Member Email', data.customerEmail);
    if (data.customerAddress) row(doc, 'Service Address', data.customerAddress);
    if (data.membershipPlan) row(doc, 'Membership Plan', data.membershipPlan);
    if (data.serviceReference) row(doc, 'Service Request #', data.serviceReference);
    if (data.claimNumber) row(doc, 'Claim Reference #', data.claimNumber);
    if (data.technicianName) row(doc, 'Assigned Technician', data.technicianName);
    row(doc, 'Service Provided', data.serviceRequested || data.type || 'On-Demand Emergency Assistance');

    doc.moveDown(1);
    sectionTitle(doc, 'COST BREAKDOWN & FINANCIAL STATEMENT');
    doc.moveDown(0.3);

    // Table header
    doc.rect(48, doc.y, doc.page.width - 96, 18).fill('#E2E8F0');
    doc.fillColor(BRAND_NAVY).fontSize(8).font('Helvetica-Bold').text('Cost Category', 54, doc.y - 14, { width: 320, continued: true });
    doc.text('Amount (ZAR)', { align: 'right', width: 120 });

    const partsCost = data.parts !== undefined ? data.parts : 0;
    const labourCost = data.labour !== undefined ? data.labour : (data.amount !== undefined ? data.amount : 0);
    const otherCost = data.otherCharges !== undefined ? data.otherCharges : 0;
    const grossTotal = data.total !== undefined ? data.total : (data.amount !== undefined ? data.amount : partsCost + labourCost + otherCost);
    const benefitCovered = data.amountCoveredByBenefit !== undefined ? data.amountCoveredByBenefit : 0;
    const customerPayable = data.amountPayableByCustomer !== undefined ? data.amountPayableByCustomer : Math.max(0, grossTotal - benefitCovered);

    const costItems = [
      { desc: 'Certified Labour & Diagnostics', cost: labourCost },
      { desc: 'Hardware Replacement & Parts', cost: partsCost },
    ];
    if (otherCost > 0) {
      costItems.push({ desc: 'Ancillary / Dispatch Charges', cost: otherCost });
    }

    costItems.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(48, doc.y, doc.page.width - 96, 16).fill('#F8FAFC');
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(item.desc, 54, doc.y - 12, { width: 320, continued: true });
      doc.fillColor(BRAND_NAVY).font('Helvetica-Bold').text(`R ${item.cost.toFixed(2)}`, { align: 'right', width: 120 });
    });

    // Subtotal & Gross Total
    doc.moveDown(0.4);
    doc.rect(48, doc.y, doc.page.width - 96, 18).fill('#F1F5F9');
    doc.fillColor(BRAND_NAVY).fontSize(8).font('Helvetica-Bold').text('GROSS SERVICE TOTAL:', 54, doc.y - 14, { continued: true, width: 320 });
    doc.text(`R ${grossTotal.toFixed(2)}`, { align: 'right', width: 120 });

    // Benefit allowance deduction
    doc.moveDown(0.3);
    doc.rect(48, doc.y, doc.page.width - 96, 20).fill('#DCFCE7'); // light emerald
    doc.fillColor('#166534').fontSize(8.5).font('Helvetica-Bold')
      .text('LESS: COVERED BY ANNUAL ASSISTANCE BENEFIT:', 54, doc.y - 15, { continued: true, width: 320 });
    doc.text(`- R ${benefitCovered.toFixed(2)}`, { align: 'right', width: 120 });

    // Customer payable balance
    doc.moveDown(0.4);
    const payableColor = customerPayable > 0 ? BRAND_RED : BRAND_NAVY;
    doc.rect(48, doc.y, doc.page.width - 96, 26).fill(payableColor);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text('NET AMOUNT PAYABLE BY CUSTOMER:', 54, doc.y - 19, { continued: true, width: 320 });
    doc.text(`R ${customerPayable.toFixed(2)}`, { align: 'right', width: 120 });

    // Status strip
    doc.moveDown(1.5);
    const paymentStatus = data.status || (customerPayable === 0 ? 'Covered' : 'Unpaid');
    doc.rect(48, doc.y, doc.page.width - 96, 22).fill('#F8FAFC');
    doc.fillColor(BRAND_GREY).fontSize(8).font('Helvetica')
      .text(`Invoice Status: ${data.invoiceStatus || 'Issued'}   •   Payment Status: ${paymentStatus.toUpperCase()}`, 54, doc.y - 16, { align: 'center', width: doc.page.width - 108 });

    doc.moveDown(1.5);
    doc.fillColor(BRAND_GREY).fontSize(7.5).font('Helvetica')
      .text('All services are rendered according to Same Day Assist Membership Terms & Conditions. Assistance benefit deductions are recorded on your annual member benefit ledger.', 48, doc.y, { align: 'center', width: doc.page.width - 96 });

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

export async function generateAssessmentReportPDF(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: `Technical Assessment & Member Equipment Register - ${data.id || 'Assessment'}`,
        Author: 'Same Day Assist',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const safePageCheck = (neededSpace = 60) => {
      if (doc.y + neededSpace > doc.page.height - 60) {
        doc.addPage();
        drawHeader(doc, 'TECHNICAL ASSESSMENT & MEMBER EQUIPMENT REGISTER (V2.0)');
        doc.moveDown(4);
      }
    };

    // PAGE 1: COVER & PROFILE & ADDRESS
    drawHeader(doc, 'TECHNICAL ASSESSMENT & MEMBER EQUIPMENT REGISTER (V2.0)');
    doc.moveDown(4);

    // Meta box
    doc.rect(40, doc.y, doc.page.width - 80, 42).fill('#F8FAFC');
    doc.fillColor(BRAND_NAVY).fontSize(10).font('Helvetica-Bold')
      .text('VERIFIED BASELINE SPECIFICATION & EQUIPMENT REGISTER', 48, doc.y - 36);
    doc.fillColor(BRAND_GREY).fontSize(8).font('Helvetica')
      .text('Mandatory baseline audit to confirm member eligibility, preserve pre-existing faults, and establish device-level asset registry.', 48, doc.y + 4, { width: 500 });
    doc.moveDown(2);

    // SECTION 1: MEMBER PROFILE & APPOINTMENT
    sectionTitle(doc, '1 | MEMBER PROFILE & VERIFIED SERVICE LOCATION');
    doc.moveDown(0.3);

    const member = data.memberInfo || {};
    const addr = data.addressInfo || {};
    const enquiry = data.enquiry || {};

    const clientName = member.legalFirstName
      ? `${member.legalFirstName} ${member.legalLastName}`
      : data.customerName || enquiry.customerName || 'Registered Member';
    const membershipId = member.membershipId || data.customerId || enquiry.id || 'SDA-MEM-BASE';
    const primaryPhone = member.primaryPhone || enquiry.phone || 'N/A';
    const email = member.email || enquiry.email || 'N/A';
    const selectedPkg = member.selectedPackage || enquiry.serviceCategory || 'Platinum';
    const techName = member.assignedTechnicianName || data.contractor?.name || 'Same Day Assist Technical Inspector';
    const techEmpId = member.assignedTechnicianEmployeeId || 'EMP-SDA-2026';
    const apptDate = member.appointmentDateTime || data.scheduledAt || new Date().toISOString();

    row(doc, 'Legal Member Name', clientName);
    row(doc, 'Membership ID', membershipId);
    row(doc, 'Contact Info', `${primaryPhone} • ${email}`);
    row(doc, 'Assistance Package', selectedPkg);
    row(doc, 'Technician / Emp ID', `${techName} (${techEmpId})`);
    row(doc, 'Assessment Date', new Date(apptDate).toLocaleString('en-ZA'));

    doc.moveDown(0.8);
    safePageCheck(80);

    // STRUCTURED PROPERTY ADDRESS
    const formattedAddr = addr.streetName
      ? `${addr.unitOrStandNumber ? `Unit/Stand ${addr.unitOrStandNumber}, ` : ''}${addr.streetNumber || ''} ${addr.streetName}, ${addr.suburb}, ${addr.city}, ${addr.province} ${addr.postalCode || ''}`
      : data.customerAddress || enquiry.address || 'Address on record';
    row(doc, 'Structured Address', formattedAddr);
    row(doc, 'Property Type', addr.propertyType || data.accountType || 'Residential House');
    if (addr.estateOrComplexName) row(doc, 'Estate / Complex', addr.estateOrComplexName);
    if (addr.hasNoStreetNumberException) {
      row(doc, 'Street # Exception', `Approved Exception: ${addr.noStreetNumberReason || 'Rural stand/holding without municipal street numbering'}`);
    }
    const coords = addr.gpsCoordinates ? `${addr.gpsCoordinates.lat?.toFixed(5)}, ${addr.gpsCoordinates.lng?.toFixed(5)}` : 'Captured via Mobile GPS';
    row(doc, 'GPS Coordinates', coords);
    row(doc, 'Entrance / Gate Access', addr.entranceGateToUse || 'Main gate access instructions verified');
    row(doc, 'Address Verification', addr.addressVerifiedWithMember ? 'VERIFIED WITH MEMBER IN PERSON' : 'Verified via GPS & Entrance Signage');

    doc.moveDown(1);
    safePageCheck(120);

    // SECTION 2: STANDARD STRUCTURE FOR EVERY ASSESSED SYSTEM (OVERVIEW TABLE)
    sectionTitle(doc, '2 | ASSESSED ESSENTIAL SECURITY SYSTEMS OVERVIEW');
    doc.moveDown(0.3);

    const systems = data.systems || {};
    const systemOverview = [
      { name: 'Alarm System & Detectors', presence: systems.alarm?.presence || 'Installed and fully functional', detail: `${systems.alarm?.detectors?.length || 0} detection devices registered` },
      { name: 'CCTV Surveillance & DVR/NVR', presence: systems.cctv?.presence || 'Installed and fully functional', detail: `${systems.cctv?.cameras?.length || 0} cameras, RG59/Cat6 cabling verified` },
      { name: 'Access Control & Electronic Locks', presence: systems.accessControl?.presence || 'Installed and fully functional', detail: `${systems.accessControl?.readers?.length || 0} readers, ${systems.accessControl?.locks?.length || 0} locks` },
      { name: 'Intercom Systems & Doorbells', presence: systems.intercom?.presence || 'Installed and fully functional', detail: `${systems.intercom?.handsets?.length || 0} handsets/monitors, gate release verified` },
      { name: 'Garage Door Automation', presence: systems.garageDoors?.presence || 'Installed and fully functional', detail: `${systems.garageDoors?.doorsCount || 1} door(s), balance & motor tested` },
      { name: 'Gate Motor Automation', presence: systems.gateMotors?.presence || 'Installed and fully functional', detail: `${systems.gateMotors?.gateType || 'Sliding'} gate, beams & backup tested` },
      { name: 'Electric Fencing & COC', presence: systems.electricFence?.presence || 'Installed and fully functional', detail: `${systems.electricFence?.measuredFenceVoltageKv || '7.5'} kV, EFSCOC: ${systems.electricFence?.efscocCertificateAvailable || 'Yes'}` },
      { name: 'Boom Gate Systems (Addendum 14)', presence: systems.boomGates?.presence || 'Not installed', detail: `${systems.boomGates?.units?.length || 0} boom lane(s) registered` },
      { name: 'Turnstile Systems (Addendum 15)', presence: systems.turnstiles?.presence || 'Not installed', detail: `${systems.turnstiles?.units?.length || 0} unit(s), fire evacuation tested` },
    ];

    // Table header
    doc.rect(48, doc.y, doc.page.width - 96, 16).fill('#E2E8F0');
    doc.fillColor(BRAND_NAVY).fontSize(8).font('Helvetica-Bold').text('System Category', 54, doc.y - 12, { width: 170, continued: true });
    doc.text('Presence & Verdict', { width: 160, continued: true });
    doc.text('Key Technical Spec', { width: 160 });

    systemOverview.forEach((sys, i) => {
      safePageCheck(20);
      if (i % 2 === 0) doc.rect(48, doc.y, doc.page.width - 96, 16).fill('#F8FAFC');
      doc.fillColor('#1E293B').fontSize(7.5).font('Helvetica-Bold').text(sys.name, 54, doc.y - 12, { width: 170, continued: true });
      
      const isFaulty = sys.presence.includes('fault') || sys.presence.includes('partially') || sys.presence.includes('unable');
      doc.fillColor(isFaulty ? BRAND_RED : '#166534').font('Helvetica').text(sys.presence, { width: 160, continued: true });
      doc.fillColor(BRAND_GREY).text(sys.detail, { width: 160 });
    });

    doc.moveDown(1.5);
    safePageCheck(140);

    // SECTION 3: SYSTEM SPECIFICS BREAKDOWN
    sectionTitle(doc, '3 | ALARM SYSTEM & EXPANDER REGISTER');
    doc.moveDown(0.3);
    if (systems.alarm) {
      row(doc, 'Panel Specification', `${systems.alarm.panelBrand || 'Paradox'} ${systems.alarm.panelModel || 'SP6000'} (S/N: ${systems.alarm.panelSerialNumber || 'SN-789012'})`);
      row(doc, 'Configuration', `${systems.alarm.systemConfiguration || 'Semi-wireless (hybrid)'} • ${systems.alarm.zonesUsed || 8}/${systems.alarm.zonesSupported || 16} zones used`);
      row(doc, 'Power & Battery', `Mains: ${systems.alarm.mainsVoltageVAC || 230}VAC • Charging: ${systems.alarm.chargingVoltageVDC || 13.8}VDC • Battery: ${systems.alarm.batterySpec || '12V 7Ah SLA'} (${systems.alarm.batteryCondition || 'Good'})`);
      row(doc, 'Walk Test & Monitoring', `Walk Test: ${systems.alarm.functionalTests?.walkTestPassed ? 'PASSED' : 'Attention'} • Path: ${systems.alarm.monitoringSignalPath || 'GSM-LTE'} • Sirens: ${systems.alarm.functionalTests?.sirensStrobesFunctional ? 'Verified' : 'Fault'}`);
      if (systems.alarm.detectors && systems.alarm.detectors.length > 0) {
        doc.fillColor(BRAND_NAVY).fontSize(7.5).font('Helvetica-Bold').text('Individually Registered Detection Devices:', 48, doc.y + 4);
        systems.alarm.detectors.slice(0, 6).forEach((d: any) => {
          doc.fillColor(BRAND_GREY).fontSize(7).font('Helvetica')
            .text(`• Zone ${d.zoneNumber || 1}: ${d.descriptiveName} (${d.type}) - Location: ${d.location} - Test: ${d.testResult || 'Pass'}`, 58, doc.y + 2);
        });
      }
    } else {
      row(doc, 'Status', 'Standard alarm system inspection logged.');
    }

    doc.moveDown(1);
    safePageCheck(120);

    // SECTION 4: CCTV SYSTEMS
    sectionTitle(doc, '4 | CCTV SURVEILLANCE & STORAGE AUDIT');
    doc.moveDown(0.3);
    if (systems.cctv) {
      row(doc, 'Recorder (NVR/DVR)', `${systems.cctv.recorderType || 'NVR'} ${systems.cctv.brand || 'Hikvision'} ${systems.cctv.model || 'DS-7608NI-K2'} (${systems.cctv.activeCamerasCount || 4}ch active / ${systems.cctv.channelCapacity || 8}ch)`);
      row(doc, 'Storage & Retention', `${systems.cctv.hddCount || 1}x HDD (${systems.cctv.totalStorageTB || 2}TB) • Drive Health: ${systems.cctv.driveHealth || 'Good'} • Verified Retention: ${systems.cctv.verifiedRetentionDays || 21} days`);
      row(doc, 'Cabling & Network', `Cable: ${systems.cctv.cablingType || 'RG59 coaxial'} (Condition: ${systems.cctv.cablingCondition || 'Good'}) • Connectors: ${systems.cctv.connectorsUsed || 'BNC'}`);
      row(doc, 'Mobile App Verification', systems.cctv.mobileAppDisplaysThisPropertyVerified ? 'CONFIRMED: Remote app verified showing THIS property' : 'Pending Client App Linkage');
      if (systems.cctv.cameras && systems.cctv.cameras.length > 0) {
        doc.fillColor(BRAND_NAVY).fontSize(7.5).font('Helvetica-Bold').text('Camera Inventory Register:', 48, doc.y + 4);
        systems.cctv.cameras.slice(0, 5).forEach((c: any) => {
          doc.fillColor(BRAND_GREY).fontSize(7).font('Helvetica')
            .text(`• Cam ${c.cameraNumber || 1}: ${c.descriptiveName} (${c.formFactor}, ${c.resolutionMp}, ${c.nightVisionTech}) - Test: ${c.testResult || 'Pass'}`, 58, doc.y + 2);
        });
      }
    } else {
      row(doc, 'Status', 'CCTV system evaluated according to RG59/IP standards.');
    }

    doc.moveDown(1);
    safePageCheck(140);

    // SECTION 5: ACCESS CONTROL & INTERCOMS & AUTOMATION
    sectionTitle(doc, '5 | ACCESS CONTROL, INTERCOMS & MOTOR AUTOMATION');
    doc.moveDown(0.3);
    if (systems.gateMotors) {
      row(doc, 'Gate Motor Automation', `${systems.gateMotors.gateType || 'Sliding'} Gate • Motor: ${systems.gateMotors.motorBrand || 'Centurion'} ${systems.gateMotors.motorModel || 'D5 Evo'} (S/N: ${systems.gateMotors.motorSerial || 'D5-99214'})`);
      row(doc, 'Gate Mechanics & Beams', `Rack: ${systems.gateMotors.rackType || 'Steel'} • Beams: ${systems.gateMotors.gateBeamsType || 'Wireless'} (${systems.gateMotors.gateBeamsOperational ? 'Pass' : 'Fault'}) • Battery: ${systems.gateMotors.batteryQtyAndCapacity || '12V 7.2Ah'}`);
    }
    if (systems.garageDoors) {
      row(doc, 'Garage Automation', `${systems.garageDoors.doorsCount || 1}x ${systems.garageDoors.mechanicalType || 'Sectional'} door (${systems.garageDoors.doorMaterial || 'Steel'}) • Motor: ${systems.garageDoors.motorBrand || 'Centurion SDO4'} • Balance Test: ${systems.garageDoors.manualMovementBalanceTestPass ? 'Pass' : 'Fault'}`);
    }
    if (systems.electricFence) {
      row(doc, 'Electric Fencing', `Energizer: ${systems.electricFence.energizerBrand || 'Nemtek'} • Voltage: ${systems.electricFence.measuredFenceVoltageKv || 7.5}kV / Earth: ${systems.electricFence.measuredEarthVoltageKv || 0.2}kV • COC: ${systems.electricFence.efscocCertificateAvailable || 'Available'}`);
    }
    if (systems.intercom) {
      row(doc, 'Intercom & Doorbells', `Type: ${systems.intercom.systemType || 'Video'} • Brand: ${systems.intercom.brand || 'Dahua'} • Video Monitors: ${systems.intercom.videoMonitorsCount || 1} • Remote App Opening: ${systems.intercom.mobileAppRemoteOpeningPass ? 'Pass' : 'N/A'}`);
    }

    doc.moveDown(1);
    safePageCheck(120);

    // SECTION 6: DEDICATED ADDITIONS (BOOM GATES & TURNSTILES)
    if ((systems.boomGates?.units?.length > 0) || (systems.turnstiles?.units?.length > 0)) {
      sectionTitle(doc, '6 | BOOM GATES & TURNSTILES FULL ASSESSMENT');
      doc.moveDown(0.3);
      if (systems.boomGates?.units?.length > 0) {
        systems.boomGates.units.forEach((b: any, idx: number) => {
          row(doc, `Boom Gate #${idx + 1}`, `${b.entranceLaneName || 'Main Entrance'} (${b.direction || 'Inbound'}) - Mfr: ${b.manufacturer || 'Centurion Sector'} ${b.model || ''} - Arm: ${b.boomArmLengthMeters || 4.5}m (${b.boomArmType || 'Straight'}) - Test: ${b.testResult || 'Pass'}`);
        });
      }
      if (systems.turnstiles?.units?.length > 0) {
        systems.turnstiles.units.forEach((t: any, idx: number) => {
          row(doc, `Turnstile #${idx + 1}`, `${t.entryLocation || 'Pedestrian Turnstile'} (${t.turnstileType || 'Tripod'}) - Mfr: ${t.manufacturer || 'Turnstar'} - Fire Evacuation Release: ${t.fireAlarmEmergencyEvacuationReleasePass ? 'VERIFIED' : 'FAILED'} - Test: ${t.testResult || 'Pass'}`);
        });
      }
      doc.moveDown(1);
      safePageCheck(100);
    }

    // SECTION 7: DEFECTS, SYMPTOMS & REQUIRED REPAIRS
    sectionTitle(doc, '7 | PRE-EXISTING DEFECTS & REQUIRED WORK REGISTER');
    doc.moveDown(0.3);

    const faults: any[] = data.consolidatedFaults || (data.issuesFound ? data.issuesFound.map((desc: string, i: number) => ({
      id: `f-${i}`,
      systemName: 'Security System',
      componentOrDevice: 'Inspected Component',
      exactSymptoms: desc,
      recommendedWork: 'Standard rectification prior to full assistance coverage',
      urgency: 'Medium',
      estimatedCost: Math.round((data.estimatedCost || 1500) / (data.issuesFound.length || 1)),
    })) : []);

    if (faults.length === 0) {
      doc.rect(48, doc.y, doc.page.width - 96, 22).fill('#DCFCE7');
      doc.fillColor('#166534').fontSize(8.5).font('Helvetica-Bold')
        .text('NO PRE-EXISTING DEFECTS FOUND: All assessed systems meet 2026 Same Day Assist baseline criteria.', 54, doc.y - 16);
      doc.moveDown(1.5);
    } else {
      // Table header
      doc.rect(48, doc.y, doc.page.width - 96, 16).fill('#FEE2E2');
      doc.fillColor(BRAND_RED).fontSize(8).font('Helvetica-Bold').text('Affected Component', 54, doc.y - 12, { width: 140, continued: true });
      doc.text('Exact Symptoms & Untested Reason', { width: 190, continued: true });
      doc.text('Urgency', { width: 70, continued: true });
      doc.text('Est. Cost', { align: 'right', width: 90 });

      faults.forEach((f, i) => {
        safePageCheck(24);
        if (i % 2 === 0) doc.rect(48, doc.y, doc.page.width - 96, 22).fill('#FFF1F2');
        doc.fillColor(BRAND_NAVY).fontSize(7.5).font('Helvetica-Bold')
          .text(`${f.systemName}: ${f.componentOrDevice}`, 54, doc.y - 16, { width: 140, continued: true });
        
        const symptomText = f.reasonUntested ? `${f.exactSymptoms} (Untested: ${f.reasonUntested})` : f.exactSymptoms;
        doc.fillColor('#334155').font('Helvetica').text(symptomText, { width: 190, continued: true });
        doc.fillColor(f.urgency === 'Critical' ? BRAND_RED : '#B45309').font('Helvetica-Bold').text(f.urgency || 'Medium', { width: 70, continued: true });
        doc.fillColor(BRAND_NAVY).font('Helvetica-Bold').text(`R ${Number(f.estimatedCost || 0).toFixed(2)}`, { align: 'right', width: 90 });
      });

      doc.moveDown(0.6);
      doc.rect(48, doc.y, doc.page.width - 96, 20).fill(BRAND_NAVY);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
        .text('TOTAL ESTIMATED PRE-MEMBERSHIP REPAIRS:', 54, doc.y - 15, { continued: true, width: 330 });
      const totalCost = data.totalPreMembershipRepairsZar || data.estimatedCost || faults.reduce((sum: number, f: any) => sum + (Number(f.estimatedCost) || 0), 0);
      doc.text(`R ${Number(totalCost).toFixed(2)}`, { align: 'right', width: 150 });
      doc.moveDown(1.5);
    }

    safePageCheck(120);

    // SECTION 8: OUTCOME & DIGITAL ACKNOWLEDGEMENTS
    sectionTitle(doc, '8 | ASSESSMENT OUTCOME & HISTORICAL BASELINE ACKNOWLEDGEMENT');
    doc.moveDown(0.3);

    const outcome = data.outcome || (faults.length > 0 ? 'Repairs required' : 'All good');
    row(doc, 'Technical Verdict Outcome', outcome.toUpperCase());
    row(doc, 'Technician Notes', data.technicianObservations || data.contractorNotes || 'Comprehensive baseline inspection executed.');

    const ack = data.memberAcknowledgement || {};
    const supervisor = data.supervisorReview || {};

    doc.moveDown(1);
    safePageCheck(80);

    // Signatures box
    doc.rect(48, doc.y, (doc.page.width - 106) / 2, 60).stroke('#CBD5E1');
    doc.fillColor(BRAND_NAVY).fontSize(8).font('Helvetica-Bold').text('TECHNICIAN CONFIRMATION', 56, doc.y - 52);
    doc.fillColor(BRAND_GREY).fontSize(7).font('Helvetica')
      .text(`Inspected by: ${techName}`, 56, doc.y + 4)
      .text(`Employee ID: ${techEmpId}`, 56, doc.y + 3)
      .text(`Date: ${new Date(apptDate).toLocaleDateString('en-ZA')}`, 56, doc.y + 3);

    const memberBoxX = 48 + (doc.page.width - 106) / 2 + 10;
    doc.rect(memberBoxX, doc.y - 48, (doc.page.width - 106) / 2, 60).stroke('#CBD5E1');
    doc.fillColor(BRAND_NAVY).fontSize(8).font('Helvetica-Bold').text('MEMBER ACKNOWLEDGEMENT', memberBoxX + 8, doc.y - 40);
    
    if (ack.memberRefusalRecorded) {
      doc.fillColor(BRAND_RED).fontSize(7).font('Helvetica-Bold')
        .text('REFUSAL RECORDED', memberBoxX + 8, doc.y + 4);
      doc.fillColor(BRAND_GREY).fontSize(7).font('Helvetica')
        .text(`Reason: ${ack.refusalReason || 'Member declined signature'}`, memberBoxX + 8, doc.y + 3);
    } else {
      doc.fillColor('#166534').fontSize(7.5).font('Helvetica-Bold')
        .text(ack.signatoryName ? `Signed by: ${ack.signatoryName}` : 'Digitally Signed & Acknowledged', memberBoxX + 8, doc.y + 4);
      doc.fillColor(BRAND_GREY).fontSize(7).font('Helvetica')
        .text(`Acknowledged: ${ack.acknowledgedAt ? new Date(ack.acknowledgedAt).toLocaleString('en-ZA') : new Date().toLocaleString('en-ZA')}`, memberBoxX + 8, doc.y + 3);
    }

    doc.moveDown(4.5);
    safePageCheck(40);

    // Baseline Locked Banner
    doc.rect(48, doc.y, doc.page.width - 96, 20).fill('#091C3E');
    doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold')
      .text(`LOCKED HISTORICAL BASELINE: Version 2.0 • Status: ${supervisor.status || 'Verified'} • ID: ${data.id || 'BASE-REG'}`, 54, doc.y - 15, { align: 'center', width: doc.page.width - 108 });

    // Draw footers on all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc);
    }

    doc.end();
  });
}

