import Fastify from 'fastify';
import { registerRoutes } from './src/routes';
import { db } from './src/db/client';
import { rfx, vendorResponses, sourceDocuments, extractedLines } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function verify() {
  console.log('--- Setting up Fastify app for endpoint verification ---');
  const app = Fastify({ logger: false });
  await registerRoutes(app);
  await app.ready();

  // 1. Check existing RFx events
  const rfxList = await db.select().from(rfx);
  console.log('1. Found RFx count:', rfxList.length);
  if (rfxList.length > 0) {
    const testRfxId = rfxList[0].id;
    console.log('Testing Comparison API for RFx ID:', testRfxId);
    const compRes = await app.inject({
      method: 'GET',
      url: `/api/comparison/${testRfxId}`,
    });
    console.log('Comparison API status code:', compRes.statusCode);
    const compData = JSON.parse(compRes.payload);
    console.log('Comparison API payload summary: rfxId =', compData.rfxId, 'items count =', compData.comparisonMatrix?.length || 0);
  }

  // 2. Check existing Vendor responses
  const vendors = await db.select().from(vendorResponses);
  console.log('2. Found Vendor count:', vendors.length);
  if (vendors.length > 0) {
    const testVendor = vendors[0];
    console.log('Testing Extraction API for Vendor ID:', testVendor.id);
    const extRes = await app.inject({
      method: 'GET',
      url: `/api/extraction/${testVendor.id}`,
    });
    console.log('Extraction API status code:', extRes.statusCode);
    const extData = JSON.parse(extRes.payload);
    console.log('Existing extracted lines count for this vendor:', extData.length);

    console.log('Testing Ingestion Status API for Vendor ID:', testVendor.id);
    const statusRes = await app.inject({
      method: 'GET',
      url: `/api/ingestion/status/${testVendor.id}`,
    });
    console.log('Ingestion Status API response:', statusRes.payload);

    console.log('Triggering POST /api/ingestion/extract/' + testVendor.id);
    const triggerRes = await app.inject({
      method: 'POST',
      url: `/api/ingestion/extract/${testVendor.id}`,
    });
    console.log('Extract endpoint status code:', triggerRes.statusCode);
    console.log('Extract endpoint response:', triggerRes.payload);

    const postStatusRes = await app.inject({
      method: 'GET',
      url: `/api/ingestion/status/${testVendor.id}`,
    });
    console.log('Post-extraction Vendor status:', JSON.parse(postStatusRes.payload).status);
  }

  // 3. SQLite persistence check
  const allExtracted = await db.select().from(extractedLines);
  console.log('3. SQLite total extracted_lines count:', allExtracted.length);

  await app.close();
  console.log('--- Verification complete ---');
}

verify().catch(console.error);
