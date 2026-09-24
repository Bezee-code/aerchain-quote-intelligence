import { db } from '../db/client';
import { rfx, rfxLineItems } from '../db/schema';
import { eq } from 'drizzle-orm';
export async function rfxRoutes(app) {
    app.get('/api/rfx', async () => {
        const result = await db.select().from(rfx);
        return result;
    });
    app.get('/api/rfx/:id', async (request) => {
        const { id } = request.params;
        const rfxResult = await db.select().from(rfx).where(eq(rfx.id, id));
        if (!rfxResult[0])
            throw new Error('RFx not found');
        const lines = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, id));
        return { ...rfxResult[0], lineItems: lines };
    });
    app.get('/api/rfx/:id/comparison', async (request) => {
        const { id } = request.params;
        const { buildComparison } = await import('../services/comparison');
        const onlyFeasible = request.query.feasible === 'true';
        return await buildComparison(id, onlyFeasible);
    });
}
//# sourceMappingURL=rfx.js.map