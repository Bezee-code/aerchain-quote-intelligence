import { buildComparison, getComparisonForLineItems } from '../services/comparison';
export async function comparisonRoutes(app) {
    app.get('/api/comparison/:rfxId', async (request) => {
        const { rfxId } = request.params;
        const onlyFeasible = request.query.feasible === 'true';
        return await buildComparison(rfxId, onlyFeasible);
    });
    app.post('/api/comparison/:rfxId/lines', async (request) => {
        const { rfxId } = request.params;
        const { lineItemIds } = request.body;
        return await getComparisonForLineItems(rfxId, lineItemIds);
    });
}
//# sourceMappingURL=comparison.js.map