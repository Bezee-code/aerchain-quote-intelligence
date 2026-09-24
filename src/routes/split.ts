import { FastifyInstance } from 'fastify';
import { optimizeSplit } from '../services/split-analysis';

export async function splitRoutes(app: FastifyInstance) {
  app.post('/api/split/:rfxId', async (request) => {
    const { rfxId } = request.params as { rfxId: string };
    const { lineItemIds, constraints } = request.body as {
      lineItemIds: string[];
      constraints?: {
        maxVendors?: number;
        minVolumePerVendor?: number;
        preferredVendors?: string[];
        excludedVendors?: string[];
        requireFeasible?: boolean;
      };
    };
    return await optimizeSplit(rfxId, lineItemIds, constraints || {});
  });
}