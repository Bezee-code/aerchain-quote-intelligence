import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { extractionResultSchema } from './schemas';
import { buildExtractionPrompt, EXTRACTION_SYSTEM_PROMPT } from './prompts';
export async function extractLineItems(input) {
    const { rfxLineItems, parsedDoc } = input;
    const documentText = buildDocumentText(parsedDoc);
    const documentType = parsedDoc.mimeType;
    const prompt = buildExtractionPrompt(rfxLineItems, documentText, documentType);
    const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        system: EXTRACTION_SYSTEM_PROMPT,
        prompt,
        schema: extractionResultSchema,
        temperature: 0.1,
        maxRetries: 2,
    });
    return object;
}
function buildDocumentText(doc) {
    let text = doc.text || '';
    if (doc.tables.length > 0) {
        text += '\n\n--- TABLES ---\n';
        for (const table of doc.tables) {
            text += `Page ${table.pageNumber || '?'}: `;
            text += table.headers.join(' | ') + '\n';
            for (const row of table.rows.slice(0, 20)) {
                text += row.join(' | ') + '\n';
            }
        }
    }
    if (doc.images.length > 0) {
        text += '\n--- OCR TEXT ---\n';
        for (const img of doc.images) {
            text += `Page ${img.pageNumber}: ${img.text}\n`;
        }
    }
    return text.slice(0, 50000);
}
export function mapEvidenceToSpans(extracted, parsedDoc) {
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
function findTextLocation(searchText, parsedDoc) {
    const cleanSearch = searchText.toLowerCase().trim();
    if (!cleanSearch)
        return null;
    const fullText = parsedDoc.text || '';
    const index = fullText.toLowerCase().indexOf(cleanSearch);
    if (index === -1)
        return null;
    const pageSize = 3000;
    const pageNumber = Math.floor(index / pageSize) + 1;
    return {
        bbox: [0.1, 0.1, 0.8, 0.05],
        pageNumber,
    };
}
//# sourceMappingURL=extractor.js.map