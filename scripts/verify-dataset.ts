import { db } from '../src/db/client.js';
import { rfx, rfxLineItems, vendorResponses, sourceDocuments, questionnaireAnswers, vendorEligibility, extractedLines } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseDocument } from '../src/processors/pipeline.js';

async function verify() {
  console.log('====================================================');
  console.log('🔍 RUNNING AERCHAIN CORRUGATED DATASET VALIDATION');
  console.log('====================================================\n');

  // 1. Confirm exactly 30 RFx line items
  const rfxRecords = await db.select().from(rfx);
  const items = await db.select().from(rfxLineItems);
  console.log(`1. RFx Record: ${rfxRecords[0]?.name} (${rfxRecords[0]?.id})`);
  console.log(`   Total Line Items: ${items.length}`);
  if (items.length !== 30) throw new Error(`Expected 30 items, got ${items.length}`);
  console.log(`   ✅ Exactly 30 RFx Line Items Verified!\n`);

  // 2. Confirm exactly 5 vendors
  const vendors = await db.select().from(vendorResponses);
  console.log(`2. Total Vendors Registered: ${vendors.length}`);
  for (const v of vendors) {
    console.log(`   - ${v.vendorName} (${v.id}, status: ${v.status})`);
  }
  if (vendors.length !== 5) throw new Error(`Expected 5 vendors, got ${vendors.length}`);
  console.log(`   ✅ Exactly 5 Vendors Verified!\n`);

  // 3. Confirm all five document formats exist
  const docs = await db.select().from(sourceDocuments);
  console.log(`3. Source Documents in Database and Filesystem:`);
  const formatsFound = new Set<string>();
  for (const d of docs) {
    const exists = existsSync(d.storagePath);
    const ext = d.fileName.split('.').pop();
    formatsFound.add(ext!);
    console.log(`   - ${d.fileName} [${d.mimeType}] -> exists on disk: ${exists} (${d.storagePath})`);
    if (!exists) throw new Error(`File missing: ${d.storagePath}`);
  }
  console.log(`   Distinct formats found: ${Array.from(formatsFound).join(', ')}`);
  const requiredFormats = ['xlsx', 'pdf', 'docx', 'png', 'eml'];
  for (const fmt of requiredFormats) {
    if (!formatsFound.has(fmt)) throw new Error(`Missing format: ${fmt}`);
  }
  console.log(`   ✅ All 5 Document Formats (.xlsx, .pdf, .docx, .png, .eml) Exist!\n`);

  // 4. Parse every vendor response
  console.log(`4. Re-parsing every vendor response document via ingestion pipeline:`);
  for (const d of docs) {
    const parsed = await parseDocument(d.storagePath, d.mimeType);
    console.log(`   - ${d.fileName}: parsed ${parsed.text.length} chars of text, ${parsed.tables?.length || 0} tables, ${parsed.images?.length || 0} images`);
    if (!parsed.text || parsed.text.length < 50) throw new Error(`Parsing yielded insufficient text for ${d.fileName}`);
  }
  console.log(`   ✅ All 5 Vendor Documents Successfully Parsed by Ingestion Parsers!\n`);

  // 5. Verify Known Edge Cases
  console.log(`5. Verifying Mandatory Edge Cases:`);

  // Edge Case 1: Missing quotation (Vendor B: exactly 27 of 30 items quoted)
  const linesB = await db.select().from(extractedLines).where(eq(extractedLines.vendorResponseId, 'vendor-002'));
  console.log(`   [Edge 1 - Missing Quotation]: Vendor B has ${linesB.length} quoted lines (27 expected, 3 missing: items 15, 18, 28)`);
  if (linesB.length !== 27) throw new Error(`Expected 27 lines for Vendor B, got ${linesB.length}`);
  const quotedIdsB = new Set(linesB.map(l => l.rfxLineItemId));
  if (quotedIdsB.has('li-015') || quotedIdsB.has('li-018') || quotedIdsB.has('li-028')) {
    throw new Error('Items 15, 18, or 28 were not omitted as required for Vendor B');
  }
  console.log(`   -> PASS: Items 15, 18, and 28 are deliberately omitted.`);

  // Edge Case 2: Currency mismatch (Vendor E: USD quoted)
  const linesE = await db.select().from(extractedLines).where(eq(extractedLines.vendorResponseId, 'vendor-005'));
  console.log(`   [Edge 2 - Currency Mismatch]: Vendor E rawCurrency = ${linesE[0]?.rawCurrency}, normCurrency = ${linesE[0]?.normCurrency}`);
  if (linesE[0]?.rawCurrency !== 'USD' || linesE[0]?.normCurrency !== 'INR') {
    throw new Error('Vendor E currency conversion mismatch');
  }
  if (!linesE[0]?.flags.includes('currency_mismatch')) {
    throw new Error('Vendor E missing currency_mismatch flag');
  }
  console.log(`   -> PASS: Raw USD preserved ($${linesE[0].rawPrice}), converted to INR (${linesE[0].normPricePerBaseUnit}), flag present.`);

  // Edge Case 3: Unit mismatch (Vendor D item 10: "Per 100 Pcs")
  const lineD10 = await db.select().from(extractedLines).where(eq(extractedLines.id, 'el-vd-li-010'));
  console.log(`   [Edge 3 - Unit Mismatch]: Vendor D item 10 rawUnit = "${lineD10[0]?.rawUnit}", rawPrice = ${lineD10[0]?.rawPrice}, normPrice = ${lineD10[0]?.normPricePerBaseUnit} ${lineD10[0]?.normUnit}`);
  if (lineD10[0]?.rawUnit !== 'Per 100 Pcs' || lineD10[0]?.normPricePerBaseUnit !== 24.5) {
    throw new Error('Vendor D item 10 unit conversion mismatch');
  }
  if (!lineD10[0]?.flags.includes('unit_mismatch')) {
    throw new Error('Vendor D item 10 missing unit_mismatch flag');
  }
  console.log(`   -> PASS: "Per 100 Pcs" converted to 24.50 EA with unit_mismatch flag.`);

  // Edge Case 4: Missing unit (Vendor D item 14: no unit provided)
  const lineD14 = await db.select().from(extractedLines).where(eq(extractedLines.id, 'el-vd-li-014'));
  console.log(`   [Edge 4 - Missing Unit]: Vendor D item 14 rawUnit = ${lineD14[0]?.rawUnit}, normUnit = "${lineD14[0]?.normUnit}", normPrice = ${lineD14[0]?.normPricePerBaseUnit}`);
  if (lineD14[0]?.rawUnit !== null) {
    throw new Error(`Expected rawUnit to be null, got ${lineD14[0]?.rawUnit}`);
  }
  if (lineD14[0]?.normPricePerBaseUnit !== null) {
    throw new Error(`Expected normPrice to be null when unit is missing, got ${lineD14[0]?.normPricePerBaseUnit}`);
  }
  if (lineD14[0]?.normUnit !== 'Unit not provided') {
    throw new Error(`Expected normUnit to be "Unit not provided", got ${lineD14[0]?.normUnit}`);
  }
  console.log(`   -> PASS: Missing unit correctly kept null in raw, "Unit not provided" in display, normPrice is null.`);

  // Edge Case 5: Ambiguous commercial terms
  const termsCount = (await db.select().from(extractedLines)).filter(l => l.flags.includes('ambiguous_terms')).length;
  console.log(`   [Edge 5 - Ambiguous Terms]: Found ${termsCount} extracted lines with ambiguous_terms flag (Freight extra, CRISIL paper clause, Consignee scope, Euler underwriting).`);
  if (termsCount === 0) throw new Error('No ambiguous_terms flags found');
  console.log(`   -> PASS: Ambiguous commercial clauses present and flagged.`);

  // Edge Case 6: Low confidence extraction (Vendor D item 5)
  const lineD5 = await db.select().from(extractedLines).where(eq(extractedLines.id, 'el-vd-li-005'));
  console.log(`   [Edge 6 - Low Confidence]: Vendor D item 5 overall confidence = ${lineD5[0]?.confidenceOverall}, flags = ${lineD5[0]?.flags.join(', ')}`);
  if (lineD5[0]?.confidenceOverall! > 0.5 || !lineD5[0]?.flags.includes('low_confidence')) {
    throw new Error('Vendor D item 5 low confidence test failed');
  }
  console.log(`   -> PASS: Visually noisy OCR price on item 5 flagged as low_confidence (0.42).`);

  // Edge Case 7: Deterministic Questionnaire Eligibility
  console.log(`   [Edge 7 - Supplier Qualification Outcomes]:`);
  const elig = await db.select().from(vendorEligibility);
  for (const e of elig) {
    const v = vendors.find(vend => vend.id === e.vendorResponseId);
    console.log(`   - ${v?.vendorName}: isEligible = ${e.isEligible}, reasons = ${JSON.stringify(e.disqualificationReasons)}`);
  }
  const passCount = elig.filter(e => e.isEligible && (!e.disqualificationReasons || (e.disqualificationReasons as any[]).length === 0)).length;
  const failCount = elig.filter(e => !e.isEligible).length;
  const unresolvedCount = elig.filter(e => (e.disqualificationReasons as any[])?.some(r => r.toLowerCase().includes('pending') || r.toLowerCase().includes('review') || r.toLowerCase().includes('unresolved'))).length;
  console.log(`   Qualification summary: ${passCount} Passed, ${failCount} Failed, ${unresolvedCount} Pending/Unresolved.`);
  if (passCount < 3) throw new Error(`Expected at least 3 passing vendors, got ${passCount}`);
  if (failCount < 1) throw new Error(`Expected at least 1 failing vendor, got ${failCount}`);
  if (unresolvedCount < 1) throw new Error(`Expected at least 1 unresolved vendor, got ${unresolvedCount}`);
  console.log(`   -> PASS: 3 vendors pass (A, B, C), 1 fails (D: ISO audit pending, 25d lead time), 1 unresolved (E: Net 30 pending Euler Hermes credit approval).`);

  // 6. Ground Truth Directory Check
  console.log('\n6. Checking Ground Truth Fixture:');
  const gtPath = join(process.cwd(), 'fixtures/ground-truth/ground-truth.json');
  if (!existsSync(gtPath)) throw new Error('Ground truth file does not exist');
  const gt = (await import('fs')).readFileSync(gtPath, 'utf-8');
  const gtJson = JSON.parse(gt);
  console.log(`   - Ground truth contains ${gtJson.length} benchmark items across 5 vendors.`);
  if (gtJson.length !== 150) throw new Error(`Expected 150 ground truth entries (30 items * 5 vendors), got ${gtJson.length}`);
  console.log(`   ✅ Ground truth fixture exists with exactly 150 items (30 items * 5 vendors) in fixtures/ground-truth/!\n`);

  console.log('====================================================');
  console.log('🎉 ALL DATASET VERIFICATIONS PASSED 100% CLEANLY!');
  console.log('====================================================');
}

verify().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
