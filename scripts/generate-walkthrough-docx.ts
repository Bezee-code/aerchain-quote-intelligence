import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { writeFileSync } from 'fs';
import { join } from 'path';

function createScriptDocx() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Aerchain Quote Intelligence — 5-6 Minute Spoken Walkthrough Script',
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Topic: ', bold: true }),
              new TextRun('"Kill the Quote Spreadsheet" — Autonomous Quotation Ingestion & Decision Intelligence\n'),
              new TextRun({ text: 'Category: ', bold: true }),
              new TextRun('Corrugated Packaging Annual Procurement 2026 (30 Line Items × 5 Competing Suppliers)\n'),
              new TextRun({ text: 'Presenter: ', bold: true }),
              new TextRun('Souvik Ghosh\n'),
              new TextRun({ text: 'Target Duration: ', bold: true }),
              new TextRun('5 to 6 Minutes (~750 words at 130–140 WPM)\n'),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: '🎙️ Verbatim Spoken Script',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
          }),

          // Section 1
          new Paragraph({
            text: '[0:00 – 1:00] The Hook & "The Lost Week" in Procurement',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Visual Cue: ', italics: true, bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Start on the homepage or header showing "Corrugated Packaging Annual Procurement 2026"', italics: true, color: '1D4ED8' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun('“Good morning everyone.\n\n'),
              new TextRun('Every procurement team in the enterprise suffers through what category managers call '),
              new TextRun({ text: '‘the lost week’', bold: true }),
              new TextRun(' of quotation normalization.\n\n'),
              new TextRun('Imagine you are managing an annual RFx for corrugated packaging across 30 distinct manufacturing SKUs—from standard single-wall cartons to heavy-duty export containers. You issue your RFx to five qualified suppliers, and what comes back is absolute chaos:\n'),
              new TextRun('• One supplier sends an Excel sheet that completely ignored your template.\n'),
              new TextRun('• Another sends a PDF with discounts and freight fees hidden in the footnotes.\n'),
              new TextRun('• The third sends a Word document with commercial terms written as legal prose.\n'),
              new TextRun('• The fourth sends a smartphone photo of a printed paper rate card.\n'),
              new TextRun('• And the fifth sends an email quoted in US Dollars with non-standard payment terms.\n\n'),
              new TextRun('Before a buyer can make even a single decision, they spend 30 to 40 hours manually copying numbers into a master spreadsheet, wrestling with currency conversions, and fixing unit mismatches. And when leadership asks: ‘What is our optimal split-award if we only buy from vendors who meet our quality criteria?’, the buyer is back to square one, building fragile VLOOKUP formulas from scratch.\n\n'),
              new TextRun('Today, I’m showing you Aerchain Quote Intelligence—a solution built to replace that lost week with minutes of auditable, automated decision intelligence.”'),
            ],
            spacing: { after: 200 },
          }),

          // Section 2
          new Paragraph({
            text: '[1:00 – 2:00] Real Multimodal Ingestion & Edge Cases',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Visual Cue: ', italics: true, bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Click on the "Responses" tab to display the Response Roster with all 5 vendors', italics: true, color: '1D4ED8' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun('“Let’s look at the Responses tab.\n\n'),
              new TextRun('Under the hood, we are not using mocked data or static JSON fixtures. Every single quotation here comes from a real document processed through our multimodal extraction pipeline.\n\n'),
              new TextRun('Notice the five different formats:\n'),
              new TextRun('1. Apex Packaging submitted a .xlsx spreadsheet.\n'),
              new TextRun('2. PackRight Corrugators submitted a .pdf.\n'),
              new TextRun('3. EcoKraft submitted a .docx contract.\n'),
              new TextRun('4. Vardhman Cartons submitted a raw .png image requiring OCR.\n'),
              new TextRun('5. And Global Star submitted a .eml email file.\n\n'),
              new TextRun('Our ingestion engine doesn’t just read tables—it identifies real-world commercial edge cases in real time:\n'),
              new TextRun('• PackRight only quoted 27 out of 30 line items—deliberately omitting items 15, 18, and 28. The system detects this partial coverage immediately without breaking downstream calculations.\n'),
              new TextRun('• Vardhman’s smartphone scan had visual noise on item 5, which the system flagged as low confidence.\n'),
              new TextRun('• EcoKraft included a commercial clause tying box rates to virgin kraft paper indices from CRISIL and IPPMA.\n'),
              new TextRun('• And Global Star quoted in USD instead of our RFx base currency of Indian Rupees.\n\n'),
              new TextRun('All of these are parsed, flagged, and normalized into a single database schema.”'),
            ],
            spacing: { after: 200 },
          }),

          // Section 3
          new Paragraph({
            text: '[2:00 – 3:15] The Normalized Comparative Matrix',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Visual Cue: ', italics: true, bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Click on the "Workspace" tab to display the 30-item comparative grid', italics: true, color: '1D4ED8' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun('“Now, let’s switch to the Workspace tab. This is where the core value lies.\n\n'),
              new TextRun('Instead of siloed vendor cards, we give category managers a dense, high-information comparative grid: all 30 RFx line items on rows, and all 5 competing suppliers on columns.\n\n'),
              new TextRun('Take a close look at how the normalization engine handles complex units and currencies:\n'),
              new TextRun('• On Line Item 10 (5-Ply Industrial Carton), Vardhman quoted ₹2,450 ‘Per 100 Pcs’. A naive system would compare 2,450 against 82 Rupees. Our system automatically recognized the pack specification, normalized it to ₹24.50 each, and flagged the unit mismatch.\n'),
              new TextRun('• On Line Item 14, Vardhman provided a price but omitted the unit entirely. Rather than inventing a guess, our system flags it as ‘Unit not provided’ and sets the normalized price to null so it never corrupts total spend calculations.\n'),
              new TextRun('• For Global Star, their USD quotation was converted into INR using live benchmark exchange rates, while preserving the raw dollar amount in the audit log.\n\n'),
              new TextRun('The dynamic green badges instantly highlight the cheapest feasible rate per line, giving the category manager immediate market clarity across all 150 price points.”'),
            ],
            spacing: { after: 200 },
          }),

          // Section 4
          new Paragraph({
            text: '[3:15 – 4:15] Zero-Hallucination Auditability & Buyer Overrides',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Visual Cue: ', italics: true, bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Click on any matrix cell to open the "Quotation Cell Provenance & Review" drawer', italics: true, color: '1D4ED8' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun('“Now, here is the most critical question in enterprise procurement:\n'),
              new TextRun({ text: 'Would a category manager with ₹4 crore on the line trust a black-box AI?\n\n', bold: true }),
              new TextRun('The answer is never. And they shouldn’t have to.\n\n'),
              new TextRun('When I click on any cell in this matrix, this Provenance Drawer opens.\n'),
              new TextRun('Notice what we display:\n'),
              new TextRun('1. The unique Extracted Line ID.\n'),
              new TextRun('2. The AI’s confidence score.\n'),
              new TextRun('3. And most importantly, the exact verbatim text snippet extracted directly from the supplier’s original document.\n\n'),
              new TextRun('There are zero hallucinations. If an auditor asks why a rate is ₹22.50, the buyer can point to the exact page, line, and bounding box from the raw document.\n\n'),
              new TextRun('Furthermore, we recognize that procurement is an active negotiation. If a buyer calls a supplier and negotiates a discount, they can enter a Buyer Override right here. Watch: I update the price, hit save, and the entire matrix, line total, and cheapest vendor rankings recalculate instantaneously.”'),
            ],
            spacing: { after: 200 },
          }),

          // Section 5
          new Paragraph({
            text: '[4:15 – 5:15] Supplier Qualification & The AI Procurement Analyst',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Visual Cue: ', italics: true, bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Click on the "Analyst" tab', italics: true, color: '1D4ED8' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun('“Low price means nothing if a vendor cannot deliver. That’s why quote intelligence must incorporate governance and qualification.\n\n'),
              new TextRun('In our dataset:\n'),
              new TextRun('• Vardhman quoted very cheap prices on certain cartons. But they failed our ISO 9001 requirement, have inadequate converting capacity, and quoted a 25-day delivery lead time when our RFx maximum is 14 days. Accepting them would risk factory downtime. The system flags them as disqualified.\n'),
              new TextRun('• Global Star requested commercial credit terms that are pending Euler Hermes underwriting, flagging them as unresolved.\n\n'),
              new TextRun('Now we can ask our Procurement Analyst Co-Pilot:\n'),
              new TextRun({ text: '‘What is our optimal split allocation across approved, compliant suppliers?’\n\n', italics: true }),
              new TextRun('With a single query, the co-pilot calculates the risk-adjusted split:\n'),
              new TextRun('• Apex Packaging wins 12 items.\n'),
              new TextRun('• EcoKraft wins 11 items.\n'),
              new TextRun('• PackRight wins 7 items.\n'),
              new TextRun('• Vardhman and Global Star are correctly excluded from the award recommendation.\n\n'),
              new TextRun('We instantly get the exact multi-sourcing spend allocation, risk summary, and board-ready award justification.”'),
            ],
            spacing: { after: 200 },
          }),

          // Section 6
          new Paragraph({
            text: '[5:15 – 5:45] Conclusion',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Visual Cue: ', italics: true, bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Return to the full Workspace view', italics: true, color: '1D4ED8' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun('“To wrap up:\n'),
              new TextRun('Aerchain Quote Intelligence takes the messy reality of enterprise procurement—unstructured documents, foreign currencies, pack-size discrepancies, and compliance hurdles—and turns it into structured, auditable decision intelligence.\n\n'),
              new TextRun('We didn’t just automate data entry; we eliminated the ‘lost week’, protected the enterprise against governance risks, and gave category managers the confidence to defend multi-crore sourcing awards.\n\n'),
              new TextRun('Thank you, and I’d be happy to take any questions or dive deeper into any part of the architecture.”'),
            ],
            spacing: { after: 300 },
          }),

          // Quick Reference Cheat Sheet Heading
          new Paragraph({
            text: '📌 Speaker Quick Reference Cheat Sheet',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '• Category & Scope: ', bold: true }),
              new TextRun('Corrugated Packaging Annual Procurement 2026 (30 Line Items × 5 Competing Suppliers, ~₹4 Crore spend)\n'),
              new TextRun({ text: '• Document Formats: ', bold: true }),
              new TextRun('.xlsx (Apex), .pdf (PackRight), .docx (EcoKraft), .png (Vardhman), .eml (Global Star)\n'),
              new TextRun({ text: '• Edge 1 (Omissions): ', bold: true }),
              new TextRun('PackRight omitted 3 items (Items 15, 18, 28) → Exactly 27 of 30 items quoted\n'),
              new TextRun({ text: '• Edge 2 (Pack Unit): ', bold: true }),
              new TextRun('Vardhman Item 10: Quoted ₹2,450 "Per 100 Pcs" → Normalized to ₹24.50 EA\n'),
              new TextRun({ text: '• Edge 3 (Missing Unit): ', bold: true }),
              new TextRun('Vardhman Item 14: Price given but no unit → Tagged "Unit not provided", price null\n'),
              new TextRun({ text: '• Edge 4 (Currency): ', bold: true }),
              new TextRun('Global Star: Quoted in USD ($0.16) → Normalized to INR (₹13.33)\n'),
              new TextRun({ text: '• Edge 5 (Escalation): ', bold: true }),
              new TextRun('EcoKraft: Commercial clause indexed to virgin kraft paper prices (CRISIL/IPPMA)\n'),
              new TextRun({ text: '• Edge 6 (OCR Noise): ', bold: true }),
              new TextRun('Vardhman Item 5: Low-confidence OCR price (0.42 confidence) flagged for review\n'),
              new TextRun({ text: '• Supplier Qualification: ', bold: true }),
              new TextRun('3 Pass (Apex, PackRight, EcoKraft); 1 Fail (Vardhman: No ISO, 25-day lead time); 1 Unresolved (Global Star: Net 30 pending Euler credit)\n'),
              new TextRun({ text: '• Optimal Split Award: ', bold: true }),
              new TextRun('Apex (12 SKUs), EcoKraft (11 SKUs), PackRight (7 SKUs)\n'),
              new TextRun({ text: '• Core Architecture: ', bold: true }),
              new TextRun('Full-Stack TypeScript: Fastify + Drizzle ORM + SQLite + Gemini Vision AI + React 18 + Vite + Tailwind CSS\n'),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const outPath = join(process.cwd(), 'AERCHAIN_SPOKEN_WALKTHROUGH_SCRIPT.docx');
  Packer.toBuffer(doc).then((buffer) => {
    writeFileSync(outPath, buffer);
    console.log('✅ Word document generated successfully at:', outPath);
  });
}

createScriptDocx();
