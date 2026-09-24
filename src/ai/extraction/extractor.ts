import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { extractionResultSchema, type ExtractionResult, type ExtractedLineItem } from './schemas';
import { buildExtractionPrompt, EXTRACTION_SYSTEM_PROMPT } from './prompts';
import type { RFxLineItem, ParsedDocument, ParsedTable, ParsedImage } from '@/domain/types';
import { env } from '@/env';

export interface ExtractionInput {
  rfxLineItems: RFxLineItem[];
  parsedDoc: ParsedDocument;
}

export interface ExtractionError extends Error {
  code?: string;
  isConfigurationError?: boolean;
}

function getExtractionModel() {
  const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey) {
    const error = new Error('GEMINI_API_KEY not configured. Please set GEMINI_API_KEY in .env.') as ExtractionError;
    error.code = 'MISSING_API_KEY';
    error.isConfigurationError = true;
    throw error;
  }

  const google = createGoogleGenerativeAI({ apiKey: geminiKey });
  const modelName = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  console.log(`[AI Extractor] Using Google Gemini provider with model: ${modelName}`);
  return { model: google(modelName), modelName };
}

export async function extractLineItems(input: ExtractionInput): Promise<ExtractionResult> {
  const { model, modelName } = getExtractionModel();
  const { rfxLineItems, parsedDoc } = input;

  const documentText = buildDocumentText(parsedDoc);
  const documentType = parsedDoc.mimeType;

  const prompt = buildExtractionPrompt(rfxLineItems, documentText, documentType);

  try {
    const { object } = await generateObject({
      model,
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt,
      schema: extractionResultSchema,
      temperature: 0.1,
      maxRetries: 2,
    });

    return addMatchStateToItems(object, rfxLineItems);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('API_KEY') || error.message.includes('API key') || error.message.includes('API_KEY_INVALID'))) {
      const configError = new Error(error.message) as ExtractionError;
      configError.code = 'CONFIG_ERROR';
      configError.isConfigurationError = true;
      throw configError;
    }

    // Resilience: If primary model hits high demand (503) or rate limit, retry with resilient fallback models
    const fallbackModels = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'].filter(m => m !== modelName);
    for (const fallbackName of fallbackModels) {
      try {
        console.warn(`[AI Extractor] Primary model ${modelName} failed. Falling back to resilient model: ${fallbackName}...`);
        const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const google = createGoogleGenerativeAI({ apiKey: geminiKey! });
        const { object } = await generateObject({
          model: google(fallbackName),
          system: EXTRACTION_SYSTEM_PROMPT,
          prompt,
          schema: extractionResultSchema,
          temperature: 0.1,
          maxRetries: 2,
        });
        console.log(`[AI Extractor] Fallback model ${fallbackName} succeeded!`);
        return addMatchStateToItems(object, rfxLineItems);
      } catch (fallbackError) {
        console.warn(`[AI Extractor] Fallback model ${fallbackName} also failed:`, (fallbackError as Error).message);
      }
    }

    throw error;
  }
}

function addMatchStateToItems(result: ExtractionResult, rfxLineItems: RFxLineItem[]): ExtractionResult {
  return {
    ...result,
    lineItems: result.lineItems.map(item => ({
      ...item,
      matchState: item.matchState || 'REVIEW',
      matchedRfxLineItemId: item.matchedRfxLineItemId || null,
    })),
  };
}

function buildDocumentText(doc: ParsedDocument): string {
  let text = doc.text || '';

  if (doc.tables.length > 0) {
    text += '\n\n--- TABLES ---\n';
    for (const table of doc.tables) {
      const pageInfo = table.sheetName ? `Sheet: ${table.sheetName}` : `Page ${table.pageNumber || '?'}`;
      text += `${pageInfo}: `;
      text += table.headers.join(' | ') + '\n';
      for (const row of table.rows.slice(0, 100)) {
        text += row.join(' | ') + '\n';
      }
    }
  }

  if (doc.images.length > 0) {
    text += '\n--- OCR TEXT ---\n';
    for (const img of doc.images) {
      const conf = img.confidence !== undefined ? ` (conf: ${Math.round(img.confidence * 100)}%)` : '';
      text += `Page ${img.pageNumber}${conf}: ${img.text}\n`;
    }
  }

  return text.slice(0, 50000);
}

export function mapEvidenceToSpans(
  extracted: ExtractionResult,
  parsedDoc: ParsedDocument
): ExtractionResult {
  for (const item of extracted.lineItems) {
    for (const ev of item.evidence) {
      if (!ev.bbox || ev.bbox.every(v => v === 0)) {
        const bbox = findTextLocation(ev.text, parsedDoc);
        if (bbox) {
          ev.bbox = bbox.bbox;
          ev.pageNumber = bbox.pageNumber;
        }
      }
    }
  }
  return extracted;
}

function findTextLocation(
  searchText: string,
  parsedDoc: ParsedDocument
): { bbox: [number, number, number, number]; pageNumber: number } | null {
  const cleanSearch = searchText.toLowerCase().trim();
  if (!cleanSearch) return null;

  const fullText = parsedDoc.text || '';
  const index = fullText.toLowerCase().indexOf(cleanSearch);
  if (index === -1) return null;

  const pageSize = 3000;
  const pageNumber = Math.floor(index / pageSize) + 1;

  return {
    bbox: [0.1, 0.1, 0.8, 0.05],
    pageNumber,
  };
}