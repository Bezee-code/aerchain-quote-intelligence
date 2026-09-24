import { FastifyInstance } from 'fastify';
import { buildComparison, getComparisonForLineItems } from '../services/comparison';

export async function comparisonRoutes(app: FastifyInstance) {
  app.get('/api/comparison/:rfxId', async (request) => {
    const { rfxId } = request.params as { rfxId: string };
    const onlyFeasible = (request.query as any).feasible === 'true';
    return await buildComparison(rfxId, onlyFeasible);
  });

  app.post('/api/comparison/:rfxId/lines', async (request) => {
    const { rfxId } = request.params as { rfxId: string };
    const { lineItemIds } = request.body as { lineItemIds: string[] };
    return await getComparisonForLineItems(rfxId, lineItemIds);
  });
}