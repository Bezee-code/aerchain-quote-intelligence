import pdfParse from 'pdf-parse';
import { fromPath } from 'pdf2pic';
import { createWorker } from 'tesseract.js';
import { readFile } from 'fs/promises';
export async function parsePdf(filePath) {
    const data = await readFile(filePath);
    const pdfData = await pdfParse(data);
    const text = pdfData.text;
    const pageCount = pdfData.numpages;
    const images = [];
    if (pageCount > 0 && text.trim().length < 100 * pageCount) {
        try {
            const worker = await createWorker('eng');
            const converter = fromPath(filePath, { density: 200, format: 'png' });
            for (let i = 1; i <= Math.min(pageCount, 10); i++) {
                const imagePath = await converter(i, { responseType: 'image' });
                const { data: { text: ocrText } } = await worker.recognize(imagePath.path);
                images.push({ pageNumber: i, text: ocrText });
            }
            await worker.terminate();
        }
        catch (e) {
            console.warn('OCR failed:', e);
        }
    }
    return {
        id: `doc-${Date.now()}`,
        text,
        tables: [],
        images,
        mimeType: 'application/pdf',
    };
}
//# sourceMappingURL=pdf.js.map