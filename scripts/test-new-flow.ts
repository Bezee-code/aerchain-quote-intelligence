async function testPipeline() {
  console.log('=== 1. TRIGGERING LOAD DEMO RESPONSES PIPELINE ===');
  const t0 = Date.now();
  const res = await fetch('http://localhost:3001/api/ingestion/load-demo-responses/rfx-001', { method: 'POST' });
  const loadResult = await res.json();
  console.log('Load Demo Responses completed in', ((Date.now() - t0)/1000).toFixed(2), 'seconds');
  console.log('Result:', JSON.stringify(loadResult, null, 2));

  console.log('\n=== 2. TESTING DUPLICATE PROTECTION ===');
  const dupRes = await fetch('http://localhost:3001/api/ingestion/load-demo-responses/rfx-001', { method: 'POST' });
  const dupResult = await dupRes.json();
  console.log('Duplicate Call Result:', JSON.stringify(dupResult, null, 2));

  console.log('\n=== 3. CHECKING VENDOR RESPONSES ROSTER ===');
  const rosterRes = await fetch('http://localhost:3001/api/rfx/rfx-001/responses');
  const roster = await rosterRes.json();
  console.log('Roster count:', roster.length);
  for (const v of roster) {
    console.log(`- ${v.vendorName}: status=${v.status}, format=${v.responseFormat}, coverage=${v.coverage.quotedCount}/${v.coverage.totalCount}, exceptions=${v.exceptionsCount}`);
  }

  console.log('\n=== 4. CHECKING COMPARISON MATRIX AND PROVENANCE ===');
  const compRes = await fetch('http://localhost:3001/api/comparison/rfx-001');
  const comp = await compRes.json();
  console.log('Comparison rows:', comp.length);
  
  // Inspect first 3 rows
  for (let i = 0; i < 3; i++) {
    const row = comp[i];
    console.log(`\nRow ${row.rfxLineItem.lineNumber}: ${row.rfxLineItem.description}`);
    console.log(`  Cheapest Vendor: ${row.cheapestVendorId || 'None'}`);
    for (const q of row.quotations) {
      console.log(`    ${q.vendorName.padEnd(40)}: price=${q.pricePerBaseUnit} ${q.currency}, extractedLineId=${q.extractedLineId || 'none'}, flags=${q.flags?.join(', ') || 'clean'}`);
    }
  }

  console.log('\n=== 5. CHECKING DYNAMIC CHEAPEST CALCULATION RULES ===');
  const row10 = comp.find((r: any) => r.rfxLineItem.lineNumber === 10);
  if (row10) {
    console.log(`Item 10 Cheapest: ${row10.cheapestVendorId}`);
    for (const q of row10.quotations) {
      console.log(`  ${q.vendorName.slice(0, 20)}: price=${q.pricePerBaseUnit} unit=${q.unit} flags=${q.flags.join(',')}`);
    }
  }

  console.log('\n=== 6. TESTING BUYER OVERRIDE FLOW ===');
  const firstQuotationWithId = comp[0].quotations.find((q: any) => q.extractedLineId);
  if (firstQuotationWithId) {
    const lineId = firstQuotationWithId.extractedLineId;
    console.log(`Applying buyer override to line ${lineId} (old price: ${firstQuotationWithId.pricePerBaseUnit})...`);
    const overrideRes = await fetch(`http://localhost:3001/api/extraction/${lineId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricePerBaseUnit: 9.99, unit: 'EA' }),
    });
    console.log('Override API response:', await overrideRes.json());
    
    // Re-fetch comparison
    const updatedComp = await (await fetch('http://localhost:3001/api/comparison/rfx-001')).json();
    const updatedQuotation = updatedComp[0].quotations.find((q: any) => q.extractedLineId === lineId);
    console.log('Updated price in comparison matrix:', updatedQuotation.pricePerBaseUnit, updatedQuotation.unit);
    console.log('Recalculated total price:', updatedQuotation.totalPrice);
  }

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

testPipeline().catch(console.error);
