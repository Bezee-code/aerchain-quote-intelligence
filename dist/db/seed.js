import { db } from '@/db/client';
import { rfx, rfxLineItems, vendorResponses, vendorEligibility } from '@/db/schema';
import { RFX_SEED, VENDORS_SEED } from '@/domain/constants';
import { sql } from 'drizzle-orm';
async function seed() {
    console.log('🌱 Seeding database...');
    const existingRfx = await db.select().from(rfx).where(sql `id = ${RFX_SEED.id}`);
    if (existingRfx.length > 0) {
        console.log('✅ Database already seeded');
        return;
    }
    await db.insert(rfx).values({
        id: RFX_SEED.id,
        name: RFX_SEED.name,
        description: RFX_SEED.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    const lineItems = RFX_SEED.lineItems.map(item => ({
        id: item.id,
        rfxId: RFX_SEED.id,
        lineNumber: item.lineNumber,
        description: item.description,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        mandatory: item.mandatory,
    }));
    await db.insert(rfxLineItems).values(lineItems);
    for (const vendor of VENDORS_SEED) {
        const vendorId = vendor.id;
        await db.insert(vendorResponses).values({
            id: vendorId,
            rfxId: RFX_SEED.id,
            vendorName: vendor.name,
            status: 'uploaded',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        await db.insert(vendorEligibility).values({
            vendorResponseId: vendorId,
            isEligible: true,
            disqualificationReasons: [],
            updatedAt: new Date().toISOString(),
        });
    }
    console.log('✅ Database seeded successfully');
    console.log(`   RFx: ${RFX_SEED.name}`);
    console.log(`   Line items: ${RFX_SEED.lineItems.length}`);
    console.log(`   Vendors: ${VENDORS_SEED.length}`);
}
seed().catch(console.error);
//# sourceMappingURL=seed.js.map