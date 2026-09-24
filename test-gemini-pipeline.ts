import { readFileSync } from 'fs';
import { db } from './src/db/client';
import { rfxLineItems, vendorResponses, sourceDocuments, extractedLines } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { extractLineItems, mapEvidenceToSpans } from './src/ai/extraction/extractor';
import { validateExtraction, generateExtractionFlags } from './src/processors/steps/validate';
import { matchLinesToRFx } from './src/services/matching';
import { persistExtraction } from './src/processors/steps/persist';
import { parseExcel } from './src/processors/parse/excel';
import type { RFxLineItem, ParsedDocument, SourceDoc, VendorResponse } from './src/domain/types';

async function main() {
  console.log('--- Step 1: Parse ---');
  // Parse existing vendor quotation fixture
  const parsedDoc = await parseExcel('./uploads/file-mudjrf7r-f2pr9u-test.xlsx');
  console.log('Parsed successfully. Found lines/tables:', parsedDoc.tables.length, 'Text length:', parsedDoc.text.length);

  // Get RFx Line Items from DB
  const rfxLines = await db.select().from(rfxLineItems);
  console.log('RFx line items loaded from DB:', rfxLines.length);

  // Get or find a vendor response and source document for persistence testing
  const vendors = await db.select().from(vendorResponses);
  const docs = await db.select().from(sourceDocuments);
  console.log('Vendors in DB:', vendors.length, 'Docs in DB:', docs.length);

  if (vendors.length === 0 || docs.length === 0) {
    console.error('No vendor or doc found in DB');
    return;
  }

  const vendor = vendors[0];
  const doc = docs[0];

  console.log('--- Step 2: Gemini extraction ---');
  console.log('Attempting real Gemini extraction call with configured provider...');
  try {
    const rawResult = await extractLineItems({
      rfxLineItems: rfxLines as RFxLineItem[],
      parsedDoc,
    });

    console.log('Extraction call succeeded! Extracted lines count:', rawResult.lineItems.length);
    console.log('--- Step 3: Structured output validation ---');
    let validated = validateExtraction(rawResult);

    console.log('--- Step 4: Matching ---');
    for (const item of validated.lineItems) {
      const matched = matchLinesToRFx(
        [{ ...item, rfxLineItemId: '' }] as any,
        rfxLines as RFxLineItem[]
      );
      for (const [rfxId, matches] of matched) {
        if (matches.length > 0) {
          item.vendorLineRef = rfxId;
        }
      }
      const rfxMatch = rfxLines.find(l => l.id === item.matchedRfxLineItemId || item.vendorLineRef);
      item.flags = generateExtractionFlags(item, rfxMatch ? { unit: rfxMatch.unit, quantity: rfxMatch.quantity } : undefined);
    }

    console.log('--- Step 5: Evidence mapping ---');
    validated = mapEvidenceToSpans(validated, parsedDoc);

    console.log('--- Step 6 & 7: Normalization & Persistence ---');
    await db.delete(extractedLines).where(eq(extractedLines.vendorResponseId, vendor.id));
    await persistExtraction(vendor as VendorResponse, doc as SourceDoc, rfxLines as RFxLineItem[], validated);
    console.log('Persisted successfully to SQLite!');

    const persisted = await db.select().from(extractedLines).where(eq(extractedLines.vendorResponseId, vendor.id));
    console.log('Persisted rows in SQLite for vendor:', persisted.length);
    if (persisted.length > 0) {
      console.log('Sample persisted line:', JSON.stringify(persisted[0], null, 2));
      console.log('--- Unit & Normalization Invariant Checks ---');
      console.log('rawUnit is null:', persisted[0].rawUnit === null);
      console.log('normUnit is "Unit not provided":', persisted[0].normUnit === 'Unit not provided');
      console.log('normPricePerBaseUnit is null (unresolved):', persisted[0].normPricePerBaseUnit === null);
      console.log('normTotalPrice is null (unresolved):', persisted[0].normTotalPrice === null);
      console.log('flags include unit_mismatch:', (persisted[0].flags as string[]).includes('unit_mismatch'));
    }
  } catch (err: any) {
    console.error('Gemini extraction failed with error:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('isConfigurationError:', err.isConfigurationError);
    if (err.cause) console.error('Cause:', err.cause);
    if (err.stack) console.error('Stack:', err.stack);
  }
}

main().catch(console.error);
