import { optimizeSplit } from '../services/split-analysis';
export async function splitRoutes(app) {
    app.post('/api/split/:rfxId', async (request) => {
        const { rfxId } = request.params;
        const { lineItemIds, constraints } = request.body;
        return await optimizeSplit(rfxId, lineItemIds, constraints || {});
    });
}
//# sourceMappingURL=split.js.map