export function buildExtractionPrompt(rfxLineItems, documentText, documentType) {
    const lineItemsJson = JSON.stringify(rfxLineItems.map(li => ({
        id: li.id,
        lineNumber: li.lineNumber,
        description: li.description,
        specification: li.specification,
        quantity: li.quantity,
        unit: li.unit,
    })), null, 2);
    return `You are a procurement data extraction specialist. Extract line items from vendor quotations matching the provided RFx line items.

RFx Line Items:
${lineItemsJson}

Document Type: ${documentType}
Document Text:
${documentText}

RULES:
1. ONLY extract values explicitly stated in the document. If a value is missing, use null. NEVER infer or assume.
2. For each field, provide confidence (0-1) and exact source text snippet.
3. Match vendor lines to RFx lines by description similarity.
4. Flag: currency_mismatch, unit_mismatch, missing_price, ambiguous_terms, low_confidence, unsupported_conversion, quantity_mismatch, no_match_found.
5. Return structured JSON matching the schema exactly.

Output JSON with this structure:
{
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
      "flags": []
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
5. Flag any discrepancies: currency mismatch, unit mismatch, missing values, ambiguous terms.
6. Output must be valid JSON matching the provided schema exactly.`;
//# sourceMappingURL=prompts.js.map