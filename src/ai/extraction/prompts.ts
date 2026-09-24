import type { RFxLineItem } from '@/domain/types';
import { QUESTIONNAIRE_QUESTIONS } from '@/domain/constants';

export function buildExtractionPrompt(
  rfxLineItems: RFxLineItem[],
  documentText: string,
  documentType: string
): string {
  const lineItemsJson = JSON.stringify(rfxLineItems.map(li => ({
    id: li.id,
    lineNumber: li.lineNumber,
    description: li.description,
    specification: li.specification,
    quantity: li.quantity,
    unit: li.unit,
  })), null, 2);

  const questionnaireJson = JSON.stringify(QUESTIONNAIRE_QUESTIONS.map(q => ({
    id: q.id,
    question: q.question,
    type: q.type,
  })), null, 2);

  return `You are a procurement data extraction specialist. Extract line items from vendor quotations matching the provided RFx line items, and extract questionnaire answers where present.

RFx Line Items:
${lineItemsJson}

Questionnaire Questions:
${questionnaireJson}

Document Type: ${documentType}
Document Text:
${documentText}

RULES:
1. ONLY extract values explicitly stated in the document. If a value is missing, use null. NEVER infer or assume.
2. Extract the commercial vendor / company entity name from the document header, letterhead, logo, or email sender into "vendorName" (e.g. "Apex Packaging Solutions Pvt Ltd").
3. For each field, provide confidence (0-1) and exact source text snippet.
4. Match vendor lines to RFx lines by description similarity.
5. For each vendor line, determine match state:
   - MATCHED: Clear, unambiguous match to an RFx line
   - PROBABLE: Likely match but some ambiguity in description
   - UNMATCHED: No corresponding RFx line found
   - REVIEW: Uncertain match requiring human review
6. Extract questionnaire answers from the document where the vendor provides this information.
7. Flag: currency_mismatch, unit_mismatch, missing_price, ambiguous_terms, low_confidence, unsupported_conversion, quantity_mismatch, no_match_found.
8. Return structured JSON matching the schema exactly.

Output JSON with this structure:
{
  "vendorName": "Commercial Vendor Name extracted from header",
  "lineItems": [
    {
      "vendorLineRef": "string or null",
      "description": "string",
      "price": "number or null",
      "currency": "string or null",
      "unit": "string or null",
      "quantity": "number or null",
      "terms": "string or null",
      "confidence": {
        "price": 0.0-1.0,
        "currency": 0.0-1.0,
        "unit": 0.0-1.0,
        "quantity": 0.0-1.0,
        "terms": 0.0-1.0,
        "overall": 0.0-1.0
      },
      "evidence": [
        {
          "field": "price|currency|unit|quantity|terms",
          "text": "exact text from document",
          "pageNumber": 0,
          "bbox": [0.0, 0.0, 0.0, 0.0]
        }
      ],
      "flags": [],
      "matchState": "MATCHED|PROBABLE|UNMATCHED|REVIEW",
      "matchedRfxLineItemId": "string or null"
    }
  ],
  "questionnaireAnswers": [
    {
      "questionId": "string",
      "answer": "string|boolean|number",
      "confidence": 0.0-1.0,
      "evidence": [...]
    }
  ]
}`;
}

export const EXTRACTION_SYSTEM_PROMPT = `You are a procurement data extraction specialist. Your job is to extract structured line-item data from vendor quotation documents.

CRITICAL RULES:
1. NEVER invent prices, quantities, units, currencies, or terms. If not explicitly stated, use null.
2. Extract confidence scores (0-1) for each field based on clarity of source text.
3. Provide exact text snippets as evidence for each extracted field.
4. Match vendor lines to RFx lines by semantic similarity of descriptions.
5. For each vendor line, determine match state: MATCHED, PROBABLE, UNMATCHED, or REVIEW.
6. Extract questionnaire answers from the document where the vendor provides this information.
7. Flag any discrepancies: currency mismatch, unit mismatch, missing values, ambiguous terms.
8. Output must be valid JSON matching the provided schema exactly.`;