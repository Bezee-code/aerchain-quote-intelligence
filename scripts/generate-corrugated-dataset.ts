import { mkdir, writeFile, readFile, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import XLSX from 'xlsx';
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import sharp from 'sharp';

import { RFX_SEED, VENDORS_SEED, QUESTIONNAIRE_QUESTIONS } from '../src/domain/constants';
import { db } from '../src/db/client';
import { rfx, rfxLineItems, vendorResponses, sourceDocuments, extractedLines, questionnaireAnswers, vendorEligibility } from '../src/db/schema';
import { sql, eq } from 'drizzle-orm';
import { parseDocument } from '../src/processors/pipeline';

// -------------------------------------------------------------
// Pricing and Item Definition Matrix
// -------------------------------------------------------------
interface ItemQuote {
  priceA: number; // Apex (INR)
  priceB: number | null; // PackRight (INR) - 27 quoted, 3 missing (items 15, 18, 28)
  priceC: number; // EcoKraft (INR)
  priceD: number | null; // Vardhman (INR) - 28 quoted, 2 missing (items 27, 28)
  unitD?: string; // Unit variation for Vardhman (e.g. "Per 100 Pcs", or missing)
  priceE: number; // Global Star (USD)
  descC: string; // Semantic alternative for EcoKraft
}

const PRICING_MATRIX: Record<string, ItemQuote> = {
  'li-001': { priceA: 12.40, priceB: 13.20, priceC: 12.90, priceD: 13.50, priceE: 0.16, descC: 'RSC 0201 Single Wall Carton 200x150x100 B-Flute' },
  'li-002': { priceA: 17.50, priceB: 16.80, priceC: 17.20, priceD: 18.00, priceE: 0.21, descC: 'Single Wall Corrugated Shipper 250x200x150 C-Flute 1-Col' },
  'li-003': { priceA: 23.80, priceB: 22.50, priceC: 23.10, priceD: 24.00, priceE: 0.28, descC: 'Kraft Shipping Carton 300x250x200mm 2-Col Flexo' },
  'li-004': { priceA: 29.20, priceB: 30.50, priceC: 31.00, priceD: 30.00, priceE: 0.36, descC: 'Medium Duty RSC Box 350x300x250mm ECT 32' },
  'li-005': { priceA: 29.80, priceB: 28.90, priceC: 29.50, priceD: 28.50, priceE: 0.35, descC: 'Single Wall Box 400x300x200mm C-Flute Printed' }, // priceD has slight visual noise
  'li-006': { priceA: 38.50, priceB: 39.80, priceC: 40.20, priceD: 39.00, priceE: 0.48, descC: 'Kraft Shipper 450x350x300mm High Burst 180 GSM' },
  'li-007': { priceA: 46.00, priceB: 45.50, priceC: 43.80, priceD: 44.50, priceE: 0.54, descC: 'Double Wall Heavy RSC 300x250x250 BC Flute' },
  'li-008': { priceA: 58.00, priceB: 55.20, priceC: 56.50, priceD: 57.00, priceE: 0.68, descC: 'Twin Cushion Heavy Shipper 400x300x300 14 kg/cm2' },
  'li-009': { priceA: 69.50, priceB: 71.00, priceC: 67.80, priceD: 68.50, priceE: 0.83, descC: 'Double Wall Master Carton 450x400x350 2-Color' },
  'li-010': { priceA: 82.00, priceB: 84.50, priceC: 83.00, priceD: 2450.00, unitD: 'Per 100 Pcs', priceE: 0.98, descC: '5-Ply Industrial Carton 500x400x400 ECT 48' }, // Unit mismatch
  'li-011': { priceA: 96.00, priceB: 93.50, priceC: 95.00, priceD: 94.00, priceE: 1.15, descC: 'Heavy Duty Double Wall 600x400x400 Plain Shipper' },
  'li-012': { priceA: 122.00, priceB: 125.00, priceC: 118.50, priceD: 120.00, priceE: 1.45, descC: '5-Ply BC Flute Export Box 600x500x500 20kg Burst' },
  'li-013': { priceA: 145.00, priceB: 148.00, priceC: 139.00, priceD: 142.00, priceE: 1.70, descC: 'Export Moisture Resistant Shipper 700x500x400' },
  'li-014': { priceA: 178.00, priceB: 182.00, priceC: 174.00, priceD: 115.00, unitD: '', priceE: 2.05, descC: 'Heavy Export Grade Double Wall 800x600x500 ECT 60' }, // Missing unit
  'li-015': { priceA: 245.00, priceB: null, priceC: 248.00, priceD: 239.00, priceE: 2.80, descC: 'Tri-Wall Triple Wall Heavy Carton 600x500x500' }, // Missing in B
  'li-016': { priceA: 340.00, priceB: 355.00, priceC: 348.00, priceD: 330.00, priceE: 4.10, descC: 'Tri-Wall Heavy Duty Industrial Carton 800x600x600' },
  'li-017': { priceA: 465.00, priceB: 480.00, priceC: 470.00, priceD: 455.00, priceE: 5.40, descC: 'Triple Wall Bulk Master Container 1000x800x700' },
  'li-018': { priceA: 14.50, priceB: null, priceC: 15.80, priceD: 15.20, priceE: 0.18, descC: 'E-Flute Self-Tuck Postal Mailer 180x120x60 4-Col' }, // Missing in B
  'li-019': { priceA: 19.80, priceB: 19.20, priceC: 20.50, priceD: 20.00, priceE: 0.24, descC: 'E-Flute Self-Locking Mailer 240x160x80 2-Col' },
  'li-020': { priceA: 26.50, priceB: 27.80, priceC: 28.00, priceD: 27.00, priceE: 0.33, descC: 'B-Flute Ear-Lock Mailer Box 300x200x100' },
  'li-021': { priceA: 38.00, priceB: 39.50, priceC: 38.80, priceD: 36.50, priceE: 0.45, descC: 'Premium Die-Cut Postal Shipper 360x260x120 4-Col' },
  'li-022': { priceA: 32.00, priceB: 33.50, priceC: 30.80, priceD: 31.50, priceE: 0.38, descC: 'Five Panel Folder (FPF) 420x300x80mm Unprinted' },
  'li-023': { priceA: 22.00, priceB: 20.50, priceC: 21.80, priceD: 21.00, priceE: 0.26, descC: 'Single Wall Corrugated Separator Pad 1150x950' },
  'li-024': { priceA: 38.50, priceB: 39.00, priceC: 38.00, priceD: 37.00, priceE: 0.44, descC: '5-Ply Heavy Tier Sheet Divider 1150x950mm' },
  'li-025': { priceA: 28.00, priceB: 29.50, priceC: 26.80, priceD: 27.50, priceE: 0.33, descC: 'Corrugated Partition Grid 12 Cell Assembly' },
  'li-026': { priceA: 45.00, priceB: 47.00, priceC: 46.00, priceD: 44.00, priceE: 0.52, descC: 'Interlocking Partition Assembly 24 Cell Grid' },
  'li-027': { priceA: 1250.00, priceB: 1320.00, priceC: 1280.00, priceD: null, priceE: 14.50, descC: 'Heavy Duty Pallet Box with Integrated Runner Skids' }, // Omitted in D
  'li-028': { priceA: 1650.00, priceB: null, priceC: 1680.00, priceD: null, priceE: 20.50, descC: 'Octagonal Bulk Container (Octabin) with Inner Bag' }, // Missing in B & D
  'li-029': { priceA: 18.50, priceB: 19.00, priceC: 18.00, priceD: 16.80, priceE: 0.22, descC: 'Angle Board Corner Guard 50x50x1000mm 4mm' },
  'li-030': { priceA: 34.00, priceB: 35.50, priceC: 33.50, priceD: 32.00, priceE: 0.38, descC: 'Heavy Duty L-Profile Edge Board 75x75x1500mm 6mm' },
};

async function main() {
  console.log('📦 Starting generation of Corrugated Packaging Demo Dataset...\n');

  const testFilesDir = join(process.cwd(), 'test-files');
  const uploadsDir = join(process.cwd(), 'uploads');
  const parsedDir = join(process.cwd(), 'parsed');
  const groundTruthDir = join(process.cwd(), 'fixtures', 'ground-truth');

  await mkdir(testFilesDir, { recursive: true });
  await mkdir(uploadsDir, { recursive: true });
  await mkdir(parsedDir, { recursive: true });
  await mkdir(groundTruthDir, { recursive: true });

  // -----------------------------------------------------------
  // 1. Generate Vendor A (Excel - .xlsx)
  // -----------------------------------------------------------
  console.log('Generating Vendor A: Apex Packaging Solutions (.xlsx)...');
  const wbA = XLSX.utils.book_new();
  const wsDataA: any[][] = [
    ['APEX PACKAGING SOLUTIONS PVT LTD', '', '', '', '', '', '', ''],
    ['Plot 42, Sector 8, IMT Manesar, Gurgaon, Haryana 122050', '', '', '', '', '', '', ''],
    ['GSTIN: 06AAACA9812L1Z9 | ISO 9001:2015 Certified (Cert #A-94812)', '', '', '', '', '', '', ''],
    ['FORMAL COMMERCIAL QUOTATION', '', '', '', '', '', '', ''],
    ['Quotation Ref:', 'APS/2026-27/QT-0842', 'Date:', '15-Sep-2026', 'RFx Ref:', 'RFx-001 Corrugated Packaging', '', ''],
    ['Customer:', 'Aerchain Procurement / Industrial Operations', 'Currency:', 'INR (₹)', 'Payment Terms:', 'Net 30 Days', 'Lead Time:', '7 Days'],
    ['Commercial Note:', 'Prices net ex-works Gurgaon; GST 18% extra. Validity 45 days. Tooling/stereo charges waived for orders > 25,000 units.', '', '', '', '', '', ''],
    [],
    ['Item #', 'Line Ref', 'Description', 'Specification', 'Annual Qty', 'Unit', 'Unit Price (INR)', 'Total Amount (INR)'],
  ];

  for (const item of RFX_SEED.lineItems) {
    const q = PRICING_MATRIX[item.id];
    const total = item.quantity * q.priceA;
    wsDataA.push([
      item.lineNumber,
      item.id,
      item.description,
      item.specification,
      item.quantity,
      item.unit,
      q.priceA,
      total,
    ]);
  }

  const wsA = XLSX.utils.aoa_to_sheet(wsDataA);
  XLSX.utils.book_append_sheet(wbA, wsA, 'Quotation');
  const fileA = join(testFilesDir, 'vendor-a-apex.xlsx');
  XLSX.writeFile(wbA, fileA);
  console.log('   Saved to:', fileA);

  // -----------------------------------------------------------
  // 2. Generate Vendor B (PDF - .pdf) - Exactly 27 of 30 items
  // -----------------------------------------------------------
  console.log('Generating Vendor B: PackRight Corrugators Ltd (.pdf) [27 of 30 items]...');
  const pdfLinesB: string[] = [
    'PACKRIGHT CORRUGATORS LTD -- COMMERCIAL QUOTATION PRC/RFQ-2026/0991',
    'Industrial Area, Greater Noida, UP - 201306 | GSTIN: 07AABCP1928K1Z5',
    'ISO 9001:2015 Registered (Cert #PR-55201) | Converting Capacity: 850 MT/month',
    'Delivery Lead Time: 10 Calendar Days | Quotation Date: September 18, 2026',
    'Commercial Condition: Freight extra at actuals (to be billed on final transport consignment note).',
    'Commercial Condition: Payment terms Net 30 days. All rates quoted in INR (Rs.).',
    'SPECIAL NOTE: PackRight quotes on 27 of 30 items. Items 15, 18, and 28 are deliberately NOT quoted',
    'as our facility operates 3-ply and 5-ply lines only (no triple-wall or micro-flute litho mailers).',
    '------------------------------------------------------------------------------------------------------',
    'Line | Description                              | Qty     | Unit | Rate (INR) | Total (INR)',
    '------------------------------------------------------------------------------------------------------',
  ];

  let rowCountB = 0;
  for (const item of RFX_SEED.lineItems) {
    const q = PRICING_MATRIX[item.id];
    if (q.priceB === null) continue; // Deliberately omit items 15, 18, 28!
    rowCountB++;
    const total = item.quantity * q.priceB;
    const desc = item.description.slice(0, 40).padEnd(40, ' ');
    const qty = `${item.quantity}`.padStart(7, ' ');
    const rate = `INR ${q.priceB.toFixed(2)}`.padStart(10, ' ');
    const tot = `INR ${total.toLocaleString()}`.padStart(14, ' ');
    pdfLinesB.push(`${String(item.lineNumber).padStart(2, ' ')}   | ${desc} | ${qty} | ${item.unit.padEnd(4, ' ')} | ${rate} | ${tot}`);
  }

  const contentStream = pdfLinesB.map((line, idx) => `BT /F1 9 Tf 35 ${1350 - idx * 16} Td (${line.replace(/[()\\]/g, '\\$&')}) Tj ET`).join('\n');
  const streamLength = Buffer.byteLength(contentStream, 'utf-8');

  const p0 = '%PDF-1.4\n';
  const p1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const p2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const p3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 1400] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  const p4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  const p5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const off1 = Buffer.byteLength(p0, 'utf-8');
  const off2 = off1 + Buffer.byteLength(p1, 'utf-8');
  const off3 = off2 + Buffer.byteLength(p2, 'utf-8');
  const off4 = off3 + Buffer.byteLength(p3, 'utf-8');
  const off5 = off4 + Buffer.byteLength(p4, 'utf-8');
  const startXref = off5 + Buffer.byteLength(p5, 'utf-8');

  const eol = ' \n'; // Exactly 20 bytes per entry in xref table
  const xref = 'xref\n' +
    '0 6\n' +
    '0000000000 65535 f' + eol +
    off1.toString().padStart(10, '0') + ' 00000 n' + eol +
    off2.toString().padStart(10, '0') + ' 00000 n' + eol +
    off3.toString().padStart(10, '0') + ' 00000 n' + eol +
    off4.toString().padStart(10, '0') + ' 00000 n' + eol +
    off5.toString().padStart(10, '0') + ' 00000 n' + eol +
    'trailer\n' +
    '<< /Size 6 /Root 1 0 R >>\n' +
    'startxref\n' +
    startXref + '\n' +
    '%%EOF';

  const fileB = join(testFilesDir, 'vendor-b-packright.pdf');
  await writeFile(fileB, Buffer.from(p0 + p1 + p2 + p3 + p4 + p5 + xref, 'utf-8'));
  console.log(`   Saved to: ${fileB} (${rowCountB} items quoted, 3 deliberately omitted)`);

  // -----------------------------------------------------------
  // 3. Generate Vendor C (Word - .docx) - Semantic Variations
  // -----------------------------------------------------------
  console.log('Generating Vendor C: EcoKraft Paper & Packaging (.docx) [Semantic wording + prose questionnaire]...');
  const tableRowsC: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Item #', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Product Description (EcoKraft)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Quantity', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'UOM', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Unit Price (INR)', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total (INR)', bold: true })] })] }),
      ],
    }),
  ];

  for (const item of RFX_SEED.lineItems) {
    const q = PRICING_MATRIX[item.id];
    const total = item.quantity * q.priceC;
    tableRowsC.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(`${item.lineNumber}`)] }),
          new TableCell({ children: [new Paragraph(q.descC)] }),
          new TableCell({ children: [new Paragraph(`${item.quantity}`)] }),
          new TableCell({ children: [new Paragraph(item.unit)] }),
          new TableCell({ children: [new Paragraph(`${q.priceC.toFixed(2)}`)] }),
          new TableCell({ children: [new Paragraph(`${total.toLocaleString()}`)] }),
        ],
      })
    );
  }

  const docC = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'EcoKraft Paper & Packaging LLP',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: 'Sustainable Corrugated Packaging & Industrial Converting Solutions',
          }),
          new Paragraph({
            text: 'Quotation Reference: EKP/COMM/2026/4102 | Date: September 16, 2026',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '1. SUPPLIER QUALIFICATION & COMPLIANCE STATEMENT',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: 'EcoKraft has maintained ISO 9001:2015 quality management certification continuously since 2018 (Certificate Registration No. EK-9001-IND-24). Our state-of-the-art facility features a 2.5m corrugator with an active monthly converting capacity of 950 MT. Standard delivery lead time is 5 business days from approved print artwork. We conform strictly to FSC chain-of-custody standards and confirm our unconditional acceptance of standard 30-day net commercial payment terms.',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '2. COMMERCIAL TERMS & SPECIAL CONDITIONS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: 'Paper Price Escalation Clause: Quoted rates are indexed to virgin kraft paper prices as published by CRISIL/IPPMA as of Q3 2026. Any price fluctuation in raw kraft paper exceeding +/- 3% at time of dispatch will be adjusted on mutual commercial agreement. GST 18% extra. Validity: 60 days.',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '3. DETAILED PRICING SCHEDULE (30 ITEMS)',
            heading: HeadingLevel.HEADING_2,
          }),
          new Table({
            rows: tableRowsC,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const { Packer } = await import('docx');
  const docxBufferC = await Packer.toBuffer(docC);
  const fileC = join(testFilesDir, 'vendor-c-ecokraft.docx');
  await writeFile(fileC, docxBufferC);
  console.log('   Saved to:', fileC);

  // -----------------------------------------------------------
  // 4. Generate Vendor D (Image - .png) - Scanned Rate Card
  // -----------------------------------------------------------
  console.log('Generating Vendor D: Vardhman Cartons & Containers (.png) [OCR + smudged price + unit mismatch + missing unit + disqualification]...');

  let tableSvgRows = '';
  let rowIdxD = 0;
  for (const item of RFX_SEED.lineItems) {
    const q = PRICING_MATRIX[item.id];
    if (q.priceD === null) continue; // Items 27 & 28 omitted

    const yPos = 320 + rowIdxD * 22;
    const unitText = q.unitD !== undefined ? q.unitD : item.unit;
    const priceText = item.id === 'li-005' ? '28.50*' : `${q.priceD.toFixed(2)}`;
    const total = item.id === 'li-010' ? (item.quantity / 100) * q.priceD : item.quantity * (q.priceD || 0);

    tableSvgRows += `
      <text x="50" y="${yPos}" font-family="Courier, monospace" font-size="11" fill="#222">${item.lineNumber}</text>
      <text x="80" y="${yPos}" font-family="Courier, monospace" font-size="11" fill="#222">${item.description.slice(0, 32)}</text>
      <text x="360" y="${yPos}" font-family="Courier, monospace" font-size="11" fill="#222">${item.quantity}</text>
      <text x="430" y="${yPos}" font-family="Courier, monospace" font-size="11" fill="${unitText === '' ? '#c00' : '#222'}">${unitText || '[BLANK]'}</text>
      <text x="510" y="${yPos}" font-family="Courier, monospace" font-size="11" fill="#111" font-weight="bold">${priceText}</text>
      <text x="610" y="${yPos}" font-family="Courier, monospace" font-size="11" fill="#333">${total.toLocaleString()}</text>
    `;
    rowIdxD++;
  }

  const svgD = `
<svg width="780" height="1060" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#faf8f4"/>
  <!-- Header -->
  <rect x="30" y="25" width="720" height="85" fill="#f0ece1" stroke="#d5cebe" stroke-width="1"/>
  <text x="50" y="55" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#3b3327">VARDHMAN CARTONS &amp; CONTAINERS</text>
  <text x="50" y="75" font-family="Arial, sans-serif" font-size="11" fill="#555">Industrial Area Phase 2, Baddi (H.P.) | Quotation Ref: VCC-RATECARD-2026-SEP</text>
  <text x="50" y="95" font-family="Arial, sans-serif" font-size="10" fill="#777">Date: September 2026 | Currency: INR (₹) | Pricing Schedule for RFx-001</text>

  <!-- Qualification Box -->
  <rect x="30" y="120" width="720" height="90" fill="#fff8f0" stroke="#e0c8b0" stroke-width="1"/>
  <text x="45" y="140" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#a03010">SUPPLIER INFORMATION &amp; COMPLIANCE DECLARATION:</text>
  <text x="45" y="160" font-family="Arial, sans-serif" font-size="10" fill="#444">• ISO 9001 Certification: Under Audit / Certification in progress (Currently Uncertified)</text>
  <text x="45" y="178" font-family="Arial, sans-serif" font-size="10" fill="#444">• Standard Production &amp; Delivery Lead Time: 25 Calendar Days</text>
  <text x="45" y="196" font-family="Arial, sans-serif" font-size="10" fill="#444">• Monthly Converting Capacity: 350 MT  |  Commercial Payment Terms: Net 30 Accepted</text>

  <!-- Notes -->
  <rect x="30" y="220" width="720" height="45" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
  <text x="45" y="238" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333">COMMERCIAL TERMS: Taxes as applicable. Unloading charges at consignee scope.</text>
  <text x="45" y="254" font-family="Arial, sans-serif" font-size="9" fill="#666">Specialty heavy bulk items 27 &amp; 28 not quoted. Item 10 quoted per 100 pcs basis.</text>

  <!-- Table Header -->
  <rect x="30" y="280" width="720" height="25" fill="#e8e2d4" stroke="#ccc" stroke-width="1"/>
  <text x="50" y="297" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#222">Item</text>
  <text x="80" y="297" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#222">Box Description</text>
  <text x="360" y="297" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#222">Qty</text>
  <text x="430" y="297" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#222">Unit</text>
  <text x="510" y="297" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#222">Rate (INR)</text>
  <text x="610" y="297" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#222">Total (INR)</text>

  <!-- Rows -->
  ${tableSvgRows}

  <!-- Footer note on smudged item 5 -->
  <text x="50" y="990" font-family="Arial, sans-serif" font-size="9" fill="#777">* Note: Item 5 rate ₹28.50 subject to paper stock availability.</text>
</svg>
`;

  const fileD = join(testFilesDir, 'vendor-d-vardhman.png');
  await sharp(Buffer.from(svgD))
    .png()
    .toFile(fileD);
  console.log(`   Saved to: ${fileD} (28 items, planted edge cases: missing unit, unit mismatch, low confidence)`);

  // -----------------------------------------------------------
  // 5. Generate Vendor E (Email - .eml with Excel Attachment in USD)
  // -----------------------------------------------------------
  console.log('Generating Vendor E: Global Star Packaging (.eml + USD Attachment)...');
  const wbE = XLSX.utils.book_new();
  const wsDataE: any[][] = [
    ['GLOBAL STAR PACKAGING INTERNATIONAL LLC', '', '', '', '', ''],
    ['Export Operations: Jebel Ali Free Zone, Dubai & Savannah GA, USA', '', '', '', '', ''],
    ['ISO 9001:2015 & BRCGS Certified (Cert #GSP-9001-US22)', '', '', '', '', ''],
    ['ANNUAL COMMERCIAL QUOTATION — RFx-001 (USD RATES)', '', '', '', '', ''],
    ['Quotation Ref:', 'GSP-INTL-2026-US09', 'Date:', '19-Sep-2026', 'Currency:', 'USD ($)'],
    ['Terms:', 'EXW Nhava Sheva / CIF destination upon request', 'Lead Time:', '12 Calendar Days', '', ''],
    [],
    ['Item #', 'Part Code', 'Description', 'Quantity', 'Unit', 'Unit Price (USD)', 'Total Amount (USD)'],
  ];

  for (const item of RFX_SEED.lineItems) {
    const q = PRICING_MATRIX[item.id];
    const totalUSD = item.quantity * q.priceE;
    wsDataE.push([
      item.lineNumber,
      item.id,
      item.description,
      item.quantity,
      item.unit,
      q.priceE,
      totalUSD,
    ]);
  }

  const wsE = XLSX.utils.aoa_to_sheet(wsDataE);
  XLSX.utils.book_append_sheet(wbE, wsE, 'USD_Quotation');
  const attachmentBufferE = XLSX.write(wbE, { type: 'buffer', bookType: 'xlsx' });
  const attachmentBase64E = attachmentBufferE.toString('base64');

  const emlBodyText = `From: david.chen@globalstarpackaging.com
To: procurement@aerchain.com
Date: Sat, 19 Sep 2026 14:30:00 +0000
Subject: Formal Quotation: Corrugated Packaging RFx-001 (USD Rates) - Global Star Packaging
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_Part_GSP_9941_2026"

------=_Part_GSP_9941_2026
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 7bit

Dear Aerchain Procurement Committee,

Global Star Packaging International LLC is pleased to submit our formal commercial proposal for your Corrugated Packaging Annual Procurement tender (RFx-001).

Attached please find our complete rate schedule "GlobalStar_USD_Quotation.xlsx" covering all 30 line items quoted strictly in US Dollars (USD).

--- SUPPLIER QUALIFICATION QUESTIONNAIRE RESPONSES ---
1. ISO 9001 Certification: YES. Certified under ISO 9001:2015 & BRCGS Packaging standard (Cert #GSP-9001-US22).
2. Production Lead Time: 12 Calendar Days from artwork lock.
3. Monthly Converting Capacity: 2,500 Metric Tons (MT) across our automated rotary die-cut lines.
4. Quality & Sustainability: 100% FSC certified virgin kraft liners, REACH & RoHS compliant.
5. Commercial Payment Terms:
   Our standard export terms are 30% advance deposit with Purchase Order, balance 70% against shipping documents / Bill of Lading.
   Net 30/60 open credit is subject to formal credit underwriting by Euler Hermes and Corporate Treasury approval.
   (Status: PENDING / UNRESOLVED until credit application is submitted).

--- COMMERCIAL TERMS ---
• Currency: US Dollars (USD).
• Delivery Basis: EXW Nhava Sheva / FOB Port basis. Ocean freight and local import customs tariffs extra if delivered DDP.
• Price Validity: 90 calendar days.

Rate Summary for Key Lines (Full list in attached Excel):
- Item 1: RSC 3-Ply Box 200x150x100mm: $0.16 EA (Qty: 50,000)
- Item 2: RSC 3-Ply Box 250x200x150mm: $0.21 EA (Qty: 40,000)
- Item 10: RSC 5-Ply Heavy Box 500x400x400mm: $0.98 EA (Qty: 12,000)
- Item 15: RSC 7-Ply Triple Wall 600x500x500mm: $2.80 EA (Qty: 3,000)
- Item 27: Heavy Duty Pallet Box with Skids: $14.50 EA (Qty: 1,000)
- Item 28: Octabin Bulk Container: $20.50 EA (Qty: 800)

We look forward to partnering with your operations.

Sincerely,
David Chen
Senior Vice President - Industrial Packaging
Global Star Packaging International LLC
david.chen@globalstarpackaging.com | +1 (404) 555-0199

------=_Part_GSP_9941_2026
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="GlobalStar_USD_Quotation.xlsx"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="GlobalStar_USD_Quotation.xlsx"

${attachmentBase64E}
------=_Part_GSP_9941_2026--
`;

  const fileE = join(testFilesDir, 'vendor-e-globalstar.eml');
  await writeFile(fileE, emlBodyText);
  console.log('   Saved to:', fileE);

  // -----------------------------------------------------------
  // 6. Copy Files to uploads/ directory for Application
  // -----------------------------------------------------------
  console.log('\nCopying documents to uploads/ directory...');
  const uploadFiles = [
    { vendorId: 'vendor-001', src: fileA, destName: 'vendor-001-apex.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { vendorId: 'vendor-002', src: fileB, destName: 'vendor-002-packright.pdf', mime: 'application/pdf' },
    { vendorId: 'vendor-003', src: fileC, destName: 'vendor-003-ecokraft.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { vendorId: 'vendor-004', src: fileD, destName: 'vendor-004-vardhman.png', mime: 'image/png' },
    { vendorId: 'vendor-005', src: fileE, destName: 'vendor-005-globalstar.eml', mime: 'message/rfc822' },
  ];

  const sourceDocsRecords: any[] = [];

  for (const uf of uploadFiles) {
    const destPath = join(uploadsDir, uf.destName);
    await copyFile(uf.src, destPath);
    const docId = `doc-${uf.vendorId}`;
    sourceDocsRecords.push({
      id: docId,
      vendorResponseId: uf.vendorId,
      fileName: uf.destName,
      mimeType: uf.mime,
      storagePath: destPath,
      uploadedAt: new Date().toISOString(),
    });
  }

  // -----------------------------------------------------------
  // 7. Parse Every Vendor Response Document
  // -----------------------------------------------------------
  console.log('\nParsing all 5 vendor documents via ingestion parsers...');
  for (const doc of sourceDocsRecords) {
    try {
      console.log(`   Parsing ${doc.fileName} (${doc.mimeType})...`);
      const parsed = await parseDocument(doc.storagePath, doc.mimeType);
      const parsedJsonPath = join(parsedDir, `${doc.id}.json`);
      await writeFile(parsedJsonPath, JSON.stringify(parsed, null, 2));
      doc.parsedPath = `./parsed/${doc.id}.json`;
      doc.pageCount = parsed.metadata?.pageCount || 1;
      console.log(`   -> Successfully parsed ${doc.id}! Text length: ${parsed.text.length}, Tables: ${parsed.tables?.length || 0}`);
    } catch (err) {
      console.error(`   -> Error parsing ${doc.id}:`, err);
    }
  }

  // -----------------------------------------------------------
  // 8. Generate Ground Truth
  // -----------------------------------------------------------
  console.log('\nGenerating Ground Truth dataset in fixtures/ground-truth/...');
  const groundTruthData: any[] = [];

  for (const item of RFX_SEED.lineItems) {
    const q = PRICING_MATRIX[item.id];

    // Vendor A
    groundTruthData.push({
      rfxLineItemId: item.id,
      rfxLineNumber: item.lineNumber,
      rfxDescription: item.description,
      vendorId: 'vendor-001',
      vendorName: 'Apex Packaging Solutions Pvt Ltd',
      expectedMatch: item.id,
      expectedRawPrice: q.priceA,
      expectedRawCurrency: 'INR',
      expectedRawUnit: item.unit,
      expectedNormalizedPrice: q.priceA,
      expectedNormalizedCurrency: 'INR',
      expectedNormalizedUnit: item.unit,
      expectedExceptions: [],
      expectedQuestionnaire: { isEligible: true, status: 'PASS', reasons: [] },
      evidenceLocation: `vendor-a-apex.xlsx sheet "Quotation" row ${item.lineNumber + 8}`,
    });

    // Vendor B (missing items 15, 18, 28)
    if (q.priceB !== null) {
      groundTruthData.push({
        rfxLineItemId: item.id,
        rfxLineNumber: item.lineNumber,
        rfxDescription: item.description,
        vendorId: 'vendor-002',
        vendorName: 'PackRight Corrugators Ltd',
        expectedMatch: item.id,
        expectedRawPrice: q.priceB,
        expectedRawCurrency: 'INR',
        expectedRawUnit: item.unit,
        expectedNormalizedPrice: q.priceB,
        expectedNormalizedCurrency: 'INR',
        expectedNormalizedUnit: item.unit,
        expectedExceptions: ['ambiguous_terms'], // freight extra
        expectedQuestionnaire: { isEligible: true, status: 'PASS', reasons: [] },
        evidenceLocation: `vendor-b-packright.pdf item ${item.lineNumber}`,
      });
    } else {
      groundTruthData.push({
        rfxLineItemId: item.id,
        rfxLineNumber: item.lineNumber,
        rfxDescription: item.description,
        vendorId: 'vendor-002',
        vendorName: 'PackRight Corrugators Ltd',
        expectedMatch: null,
        expectedRawPrice: null,
        expectedRawCurrency: null,
        expectedRawUnit: null,
        expectedNormalizedPrice: null,
        expectedNormalizedCurrency: null,
        expectedNormalizedUnit: null,
        expectedExceptions: ['missing_quotation'],
        expectedQuestionnaire: { isEligible: true, status: 'PASS', reasons: [] },
        evidenceLocation: `vendor-b-packright.pdf deliberate omission`,
      });
    }

    // Vendor C
    groundTruthData.push({
      rfxLineItemId: item.id,
      rfxLineNumber: item.lineNumber,
      rfxDescription: item.description,
      vendorId: 'vendor-003',
      vendorName: 'EcoKraft Paper & Packaging LLP',
      expectedMatch: item.id,
      expectedRawPrice: q.priceC,
      expectedRawCurrency: 'INR',
      expectedRawUnit: item.unit,
      expectedNormalizedPrice: q.priceC,
      expectedNormalizedCurrency: 'INR',
      expectedNormalizedUnit: item.unit,
      expectedExceptions: ['ambiguous_terms'], // paper price escalation clause
      expectedQuestionnaire: { isEligible: true, status: 'PASS', reasons: [] },
      evidenceLocation: `vendor-c-ecokraft.docx table row ${item.lineNumber}`,
    });

    // Vendor D (28 quoted, 2 missing, planted unit issues)
    if (q.priceD !== null) {
      const exceptions: string[] = ['ambiguous_terms'];
      if (item.id === 'li-005') exceptions.push('low_confidence');
      if (item.id === 'li-010') exceptions.push('unit_mismatch');
      if (item.id === 'li-014') exceptions.push('missing_unit');

      let normPrice = q.priceD;
      let normUnit = item.unit;
      if (item.id === 'li-010') {
        normPrice = q.priceD / 100; // 2450 / 100 = 24.50
        normUnit = 'EA';
      } else if (item.id === 'li-014') {
        normPrice = null as any;
        normUnit = 'Unit not provided';
      }

      groundTruthData.push({
        rfxLineItemId: item.id,
        rfxLineNumber: item.lineNumber,
        rfxDescription: item.description,
        vendorId: 'vendor-004',
        vendorName: 'Vardhman Cartons & Containers',
        expectedMatch: item.id,
        expectedRawPrice: q.priceD,
        expectedRawCurrency: 'INR',
        expectedRawUnit: q.unitD !== undefined ? (q.unitD || null) : item.unit,
        expectedNormalizedPrice: normPrice,
        expectedNormalizedCurrency: 'INR',
        expectedNormalizedUnit: normUnit,
        expectedExceptions: exceptions,
        expectedQuestionnaire: {
          isEligible: false,
          status: 'FAIL',
          reasons: [
            'Failed: Is the vendor ISO 9001 certified?',
            'Failed: What is the delivery lead time in days? (value: 25, max: 14)',
            'Failed: Does the vendor have monthly converting capacity of at least 500 MT?',
          ],
        },
        evidenceLocation: `vendor-d-vardhman.png row ${item.lineNumber}`,
      });
    } else {
      groundTruthData.push({
        rfxLineItemId: item.id,
        rfxLineNumber: item.lineNumber,
        rfxDescription: item.description,
        vendorId: 'vendor-004',
        vendorName: 'Vardhman Cartons & Containers',
        expectedMatch: null,
        expectedRawPrice: null,
        expectedRawCurrency: null,
        expectedRawUnit: null,
        expectedNormalizedPrice: null,
        expectedNormalizedCurrency: null,
        expectedNormalizedUnit: null,
        expectedExceptions: ['missing_quotation'],
        expectedQuestionnaire: { isEligible: false, status: 'FAIL' },
        evidenceLocation: `vendor-d-vardhman.png omitted bulk item`,
      });
    }

    // Vendor E (USD)
    const inrNormalized = q.priceE / 0.012; // Exchange rate INR = 0.012
    groundTruthData.push({
      rfxLineItemId: item.id,
      rfxLineNumber: item.lineNumber,
      rfxDescription: item.description,
      vendorId: 'vendor-005',
      vendorName: 'Global Star Packaging International LLC',
      expectedMatch: item.id,
      expectedRawPrice: q.priceE,
      expectedRawCurrency: 'USD',
      expectedRawUnit: item.unit,
      expectedNormalizedPrice: Math.round(inrNormalized * 100) / 100,
      expectedNormalizedCurrency: 'INR',
      expectedNormalizedUnit: item.unit,
      expectedExceptions: ['currency_mismatch', 'ambiguous_terms'],
      expectedQuestionnaire: {
        isEligible: false,
        status: 'UNRESOLVED',
        reasons: ['Unresolved: Does the vendor accept commercial credit payment terms (Net 30 / Net 60)? (pending commercial review)'],
      },
      evidenceLocation: `vendor-e-globalstar.eml + GlobalStar_USD_Quotation.xlsx row ${item.lineNumber}`,
    });
  }

  const gtJsonFile = join(groundTruthDir, 'ground-truth.json');
  await writeFile(gtJsonFile, JSON.stringify(groundTruthData, null, 2));

  const gtReadme = `# Aerchain Quote Intelligence — Ground Truth Dataset

## Overview
This ground-truth benchmark specifies the exact expected extraction, normalization, exception detection, and supplier qualification results for the **Corrugated Packaging Annual Procurement 2026** RFx tender.

> **CRITICAL ARCHITECTURAL GUARANTEE**: This ground truth file is strictly an evaluation benchmark and is **never** queried or referenced by the runtime extraction, matching, or normalization pipeline. All application runtime outputs are extracted independently from the raw vendor documents.

## Tender Summary
- **RFx ID**: \`rfx-001\`
- **Name**: Corrugated Packaging Annual Procurement 2026
- **Total Line Items**: 30
- **Total Vendors**: 5
- **Document Formats**: .xlsx (Excel), .pdf (PDF), .docx (Word), .png (OCR Rate Card Image), .eml (Email + XLSX Attachment)

## Planted Edge Cases
1. **Missing Quotation**: Vendor B (PackRight) explicitly omits items 15, 18, and 28 (quotes 27 of 30).
2. **Currency Mismatch**: Vendor E quotes all 30 items in USD. Preserves raw USD and normalizes to INR via \`EXCHANGE_RATES_TO_USD\`.
3. **Unit Mismatch**: Vendor D quotes Item 10 in "Per 100 Pcs" instead of "EA".
4. **Missing Unit**: Vendor D quotes Item 14 with no unit specified. Normalized pipeline leaves unit unresolved ("Unit not provided").
5. **Ambiguous Commercial Terms**:
   - Vendor B: "Freight extra at actuals"
   - Vendor C: "CRISIL Kraft Paper Price Escalation Clause"
   - Vendor D: "Taxes as applicable, unloading at consignee scope"
   - Vendor E: "EXW Nhava Sheva / FOB Port terms"
6. **Low-Confidence Extraction**: Vendor D Item 5 has noisy/blurred typography.
7. **Deterministic Supplier Qualification**:
   - **Vendor A**: PASS (ISO: true, Lead: 7d, Cap: 1200 MT, Net 30: true) -> **Eligible**
   - **Vendor B**: PASS (ISO: true, Lead: 10d, Cap: 850 MT, Net 30: true) -> **Eligible**
   - **Vendor C**: PASS (ISO: true, Lead: 5d, Cap: 950 MT, Net 30: true) -> **Eligible**
   - **Vendor D**: FAIL (ISO: false, Lead: 25d > 14d max, Cap: 350 MT < 500 MT) -> **Disqualified**
   - **Vendor E**: UNRESOLVED (Credit terms pending Euler Hermes underwriting) -> **Pending Review**
`;
  await writeFile(join(groundTruthDir, 'README.md'), gtReadme);
  console.log('   Saved ground truth to:', gtJsonFile);

  // -----------------------------------------------------------
  // 9. Seed the SQLite Database with Corrugated Packaging
  // -----------------------------------------------------------
  console.log('\nSeeding application SQLite database with Corrugated Packaging RFx...');

  // Clear existing records to ensure clean state
  await db.delete(extractedLines);
  await db.delete(questionnaireAnswers);
  await db.delete(vendorEligibility);
  await db.delete(sourceDocuments);
  await db.delete(vendorResponses);
  await db.delete(rfxLineItems);
  await db.delete(rfx);

  // Insert RFx
  await db.insert(rfx).values({
    id: RFX_SEED.id,
    name: RFX_SEED.name,
    description: RFX_SEED.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Insert 30 Line Items
  await db.insert(rfxLineItems).values(
    RFX_SEED.lineItems.map(li => ({
      id: li.id,
      rfxId: RFX_SEED.id,
      lineNumber: li.lineNumber,
      description: li.description,
      specification: li.specification,
      quantity: li.quantity,
      unit: li.unit,
      category: li.category,
      mandatory: li.mandatory,
    }))
  );

  // Insert 5 Vendors with status 'not_received' (clean slate for document ingestion)
  for (const v of VENDORS_SEED) {
    await db.insert(vendorResponses).values({
      id: v.id,
      rfxId: RFX_SEED.id,
      vendorName: v.name,
      status: 'not_received',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Ensure demo fixture files are saved in demo/fixtures/vendors/
  const demoDir = join(process.cwd(), 'demo', 'fixtures', 'vendors');
  await mkdir(demoDir, { recursive: true });
  await copyFile(fileA, join(demoDir, 'vendor-a.xlsx'));
  await copyFile(fileB, join(demoDir, 'vendor-b.pdf'));
  await copyFile(fileC, join(demoDir, 'vendor-c.docx'));
  await copyFile(fileD, join(demoDir, 'vendor-d.png'));
  await copyFile(fileE, join(demoDir, 'vendor-e.eml'));

  console.log('✅ Demo fixture files copied to demo/fixtures/vendors/');
  console.log('✅ Seeded 1 RFx, 30 line items, and 5 vendors in "not_received" status.');
  console.log('✅ Zero quotation values or fake extractions seeded (source of truth is runtime document ingestion).');
}

main().catch(err => {
  console.error('Fatal error during dataset generation:', err);
  process.exit(1);
});
