import { FastifyInstance } from 'fastify';
import { rfxRoutes } from './rfx';
import { ingestionRoutes } from './ingestion';
import { extractionRoutes } from './extraction';
import { comparisonRoutes } from './comparison';
import { analystRoutes } from './analyst';
import { splitRoutes } from './split';

export async function registerRoutes(app: FastifyInstance) {
  await rfxRoutes(app);
  await ingestionRoutes(app);
  await extractionRoutes(app);
  await comparisonRoutes(app);
  await analystRoutes(app);
  await splitRoutes(app);
}