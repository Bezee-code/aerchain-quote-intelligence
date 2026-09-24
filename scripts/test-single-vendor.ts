import { db } from '../src/db/client';
import { vendorResponses, sourceDocuments, extractedLines } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { copyFile } from 'fs/promises';
import { join } from 'path';
import { processVendorResponse, extractVendorResponse } from '../src/processors/pipeline';

async function testOne() {
  console.log('Testing extraction for vendor-001 (Apex Packaging) with gemini-3.5-flash...');
  
  // Ensure source document is present
  const destPath = join(process.cwd(), 'uploads', 'demo-vendor-001-vendor-a.xlsx');
  await copyFile(join(process.cwd(), 'demo', 'fixtures', 'vendors', 'vendor-a.xlsx'), destPath);
  
  await db.delete(extractedLines).where(eq(extractedLines.vendorResponseId, 'vendor-001'));
  await db.delete(sourceDocuments).where(eq(sourceDocuments.vendorResponseId, 'vendor-001'));
  
  await db.insert(sourceDocuments).values({
    id: 'doc-vendor-001',
    vendorResponseId: 'vendor-001',
    fileName: 'vendor-a.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    storagePath: destPath,
    uploadedAt: new Date().toISOString(),
  });
  
  await processVendorResponse('vendor-001');
  console.log('Parsed successfully. Calling extractVendorResponse...');
  
  const t0 = Date.now();
  await extractVendorResponse('vendor-001');
  console.log('Extraction finished in', ((Date.now() - t0)/1000).toFixed(2), 'seconds');
  
  const lines = await db.select().from(extractedLines).where(eq(extractedLines.vendorResponseId, 'vendor-001'));
  const vr = (await db.select().from(vendorResponses).where(eq(vendorResponses.id, 'vendor-001')))[0];
  console.log('Vendor status:', vr?.status, 'Extracted lines count:', lines.length);
  if (lines.length > 0) {
    console.log('Sample line 1:', lines[0].rawDescription, 'Raw Price:', lines[0].rawPrice, 'Norm Price:', lines[0].normPricePerBaseUnit);
    console.log('Evidence:', JSON.stringify(lines[0].evidence));
  }
}

testOne().catch(console.error);
