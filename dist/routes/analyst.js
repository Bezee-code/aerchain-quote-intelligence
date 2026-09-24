import { db } from '../db/client';
import { rfx, vendorResponses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { runAnalystSession } from '../ai/analyst/orchestrator';
export async function analystRoutes(app) {
    app.post('/api/analyst/chat', async (request, reply) => {
        const { sessionId, messages, rfxId } = request.body;
        const rfxResult = await db.select().from(rfx).where(eq(rfx.id, rfxId));
        const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));
        if (!rfxResult[0])
            return reply.code(404).send({ error: 'RFx not found' });
        const context = {
            rfxId,
            rfxName: rfxResult[0].name,
            lineItemsCount: 30,
            vendorsCount: vendors.length,
        };
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        try {
            for await (const chunk of runAnalystSession(sessionId, messages, context)) {
                reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
        catch (error) {
            reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
            reply.raw.end();
        }
    });
}
//# sourceMappingURL=analyst.js.map