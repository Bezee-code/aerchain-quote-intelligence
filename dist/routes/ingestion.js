import { db } from '../db/client';
import { vendorResponses, sourceDocuments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '../utils/formatting';
import { SUPPORTED_MIME_TYPES } from '../domain/constants';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { processVendorResponse } from '../processors/pipeline';
const UPLOAD_DIR = join(process.cwd(), 'uploads');
export async function ingestionRoutes(app) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    app.post('/api/ingestion/upload', async (request, reply) => {
        const data = await request.file();
        if (!data)
            return reply.code(400).send({ error: 'No file uploaded' });
        const mimeType = data.mimetype;
        if (!SUPPORTED_MIME_TYPES[mimeType]) {
            return reply.code(400).send({ error: `Unsupported file type: ${mimeType}` });
        }
        const vendorResponseId = request.query.vendorResponseId;
        if (!vendorResponseId)
            return reply.code(400).send({ error: 'vendorResponseId required' });
        const vr = await db.select().from(vendorResponses).where(eq(vendorResponses.id, vendorResponseId));
        if (!vr[0])
            return reply.code(404).send({ error: 'Vendor response not found' });
        const fileName = `${generateId('file')}-${data.filename}`;
        const filePath = join(UPLOAD_DIR, fileName);
        const buffer = await data.toBuffer();
        await writeFile(filePath, buffer);
        const docId = generateId('doc');
        await db.insert(sourceDocuments).values({
            id: docId,
            vendorResponseId,
            fileName: data.filename,
            mimeType,
            storagePath: filePath,
            uploadedAt: new Date().toISOString(),
        });
        return { documentId: docId, fileName: data.filename };
    });
    app.post('/api/ingestion/process/:vendorResponseId', async (request) => {
        const { vendorResponseId } = request.params;
        await processVendorResponse(vendorResponseId);
        return { status: 'completed' };
    });
    app.get('/api/ingestion/status/:vendorResponseId', async (request) => {
        const { vendorResponseId } = request.params;
        const vr = await db.select().from(vendorResponses).where(eq(vendorResponses.id, vendorResponseId));
        if (!vr[0])
            throw new Error('Vendor response not found');
        return { status: vr[0].status };
    });
}
//# sourceMappingURL=ingestion.js.map