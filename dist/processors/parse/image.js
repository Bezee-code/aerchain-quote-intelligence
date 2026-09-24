import { createWorker } from 'tesseract.js';
export async function parseImage(filePath) {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return {
        id: `doc-${Date.now()}`,
        text,
        tables: [],
        images: [{ pageNumber: 1, text }],
        mimeType: 'image/png',
    };
}
//# sourceMappingURL=image.js.map