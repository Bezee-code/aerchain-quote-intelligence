import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { rfx, vendorResponses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { runAnalystSession } from '../ai/analyst/orchestrator';

export async function analystRoutes(app: FastifyInstance) {
  // Streaming SSE endpoint
  app.post('/api/analyst/chat', async (request, reply) => {
    const body = (request.body as any) || {};
    const sessionId = body.sessionId || 'session-default';
    const messages = body.messages || [];
    const rfxId = body.rfxId;

    if (!rfxId) return reply.code(400).send({ error: 'rfxId required' });

    const rfxResult = await db.select().from(rfx).where(eq(rfx.id, rfxId));
    const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));

    if (!rfxResult[0]) return reply.code(404).send({ error: 'RFx not found' });

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
    } catch (error) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
      reply.raw.end();
    }
  });

  // Standard JSON query endpoint for instant, non-streaming UI requests
  app.post('/api/analyst/ask', async (request, reply) => {
    const body = (request.body as any) || {};
    const sessionId = body.sessionId || 'session-default';
    const messages = body.messages || [];
    const rfxId = body.rfxId;

    if (!rfxId) return reply.code(400).send({ error: 'rfxId required' });

    const rfxResult = await db.select().from(rfx).where(eq(rfx.id, rfxId));
    const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));

    if (!rfxResult[0]) return reply.code(404).send({ error: 'RFx not found' });

    const context = {
      rfxId,
      rfxName: rfxResult[0].name,
      lineItemsCount: 30,
      vendorsCount: vendors.length,
    };

    let fullText = '';
    let scenarioData: any = null;
    const toolCalls: any[] = [];

    try {
      for await (const chunk of runAnalystSession(sessionId, messages, context)) {
        if (chunk.type === 'text' && chunk.content) {
          fullText += chunk.content;
        } else if (chunk.type === 'scenario' && chunk.scenario) {
          scenarioData = chunk.scenario;
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          toolCalls.push(chunk.toolCall);
        }
      }
      return { answer: fullText, scenario: scenarioData, toolCalls };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });
}