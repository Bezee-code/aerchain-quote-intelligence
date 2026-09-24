import pdfParse from 'pdf-parse';
import { readFile } from 'fs/promises';
import type { ParsedDocument, ParsedTable, ParsedImage, ParsedMetadata } from '@/domain/types';

export async function parsePdf(filePath: string): Promise<ParsedDocument> {
  const data = await readFile(filePath);
  const pdfData = await pdfParse(data);
  const text = pdfData.text;

  const pageCount = pdfData.numpages;
  const images: ParsedImage[] = [];
  let ocrRequired = false;

  if (pageCount > 0 && text.trim().length < 100 * pageCount) {
    ocrRequired = true;
    try {
      const { createWorker } = await import('tesseract.js');
      const { fromPath } = await import('pdf2pic');
      const worker = await createWorker('eng');
      const converter = fromPath(filePath, { density: 200, format: 'png' });

      for (let i = 1; i <= Math.min(pageCount, 10); i++) {
        const imagePath = await converter(i, { responseType: 'image' });
        if (imagePath.path) {
          const { data: { text: ocrText, confidence } } = await worker.recognize(imagePath.path);
          images.push({ pageNumber: i, text: ocrText, confidence });
        }
      }
      await worker.terminate();
    } catch (e) {
      console.warn('OCR failed:', e);
    }
  }

  const metadata: ParsedMetadata = {
    pageCount,
    ocrRequired,
  };

  return {
    id: `doc-${Date.now()}`,
    text,
    tables: [],
    images,
    mimeType: 'application/pdf',
    metadata,
  };
}