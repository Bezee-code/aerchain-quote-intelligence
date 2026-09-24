import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import type { ParsedDocument, ParsedImage, ParsedMetadata } from '@/domain/types';

export async function parseImage(filePath: string): Promise<ParsedDocument> {
  const processedPath = await preprocessImage(filePath);
  
  const worker = await createWorker('eng');
  const { data: { text, confidence } } = await worker.recognize(processedPath);
  await worker.terminate();

  const image: ParsedImage = {
    pageNumber: 1,
    text,
    confidence,
  };

  const metadata: ParsedMetadata = {
    pageCount: 1,
    ocrConfidence: confidence,
  };

  return {
    id: `doc-${Date.now()}`,
    text,
    tables: [],
    images: [image],
    mimeType: 'image/png',
    metadata,
  };
}

async function preprocessImage(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, '_processed.png');
  
  await sharp(inputPath)
    .resize({ width: 2000, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toFile(outputPath);
  
  return outputPath;
}