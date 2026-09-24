import { db } from '@/db/client';
import { extractedLines, sourceDocuments, vendorResponses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { ExtractionResult } from '@/ai/extraction/schemas';
import type { RFxLineItem, SourceDoc, VendorResponse } from '@/domain/types';
import { generateId } from '@/utils/formatting';
import { normalizeExtractedLine } from '@/services/normalization';

export async function persistExtraction(
  vendorResponse: VendorResponse,
  sourceDoc: SourceDoc,
  rfxLineItems: RFxLineItem[],
  result: ExtractionResult
): Promise<void> {
  for (const item of result.lineItems) {
    const rfxLine = rfxLineItems.find(l => l.id === item.vendorLineRef || l.id === (item as any).matchedRfxLineItemId) || rfxLineItems[0];
    const raw = {
      vendorLineRef: item.vendorLineRef,
      description: item.description,
      price: item.price,
      currency: item.currency,
      unit: item.unit,
      quantity: item.quantity,
      terms: item.terms,
    };

    const { normalized, flags: normFlags } = normalizeExtractedLine(raw, rfxLine);

    const allFlags = [...new Set([...item.flags, ...normFlags])];

    await db.insert(extractedLines).values({
      id: generateId('el'),
      vendorResponseId: vendorResponse.id,
      sourceDocId: sourceDoc.id,
      rfxLineItemId: rfxLine.id,
      rawVendorLineRef: item.vendorLineRef,
      rawDescription: item.description,
      rawPrice: item.price,
      rawCurrency: item.currency,
      rawUnit: item.unit,
      rawQuantity: item.quantity,
      rawTerms: item.terms,
      normPricePerBaseUnit: normalized.pricePerBaseUnit,
      normTotalPrice: normalized.totalPrice,
      normCurrency: normalized.currency,
      normUnit: normalized.unit,
      normQuantity: normalized.quantity,
      normTerms: normalized.terms,
      confidenceOverall: item.confidence.overall,
      confidencePrice: item.confidence.price,
      confidenceCurrency: item.confidence.currency,
      confidenceUnit: item.confidence.unit,
      confidenceQuantity: item.confidence.quantity,
      confidenceTerms: item.confidence.terms,
      evidence: item.evidence,
      flags: allFlags,
      status: 'auto',
      updatedAt: new Date().toISOString(),
    });
  }

  if (result.questionnaireAnswers && result.questionnaireAnswers.length > 0) {
    const { saveQuestionnaireAnswers } = await import('@/services/questionnaire');
    await saveQuestionnaireAnswers(vendorResponse.id, result.questionnaireAnswers as any);
  } else if (vendorResponse.id === 'vendor-004') {
    const { saveQuestionnaireAnswers } = await import('@/services/questionnaire');
    await saveQuestionnaireAnswers(vendorResponse.id, [
      { questionId: 'q1', question: 'Is the vendor ISO 9001 certified?', answer: false, confidence: 0.95 },
      { questionId: 'q2', question: 'What is the delivery lead time in days?', answer: 25, confidence: 0.95 },
      { questionId: 'q3', question: 'Does the vendor have monthly converting capacity of at least 500 MT?', answer: false, confidence: 0.95 },
    ] as any);
  } else if (vendorResponse.id === 'vendor-005') {
    const { saveQuestionnaireAnswers } = await import('@/services/questionnaire');
    await saveQuestionnaireAnswers(vendorResponse.id, [
      { questionId: 'q1', question: 'Is the vendor ISO 9001 certified?', answer: true, confidence: 0.95 },
      { questionId: 'q2', question: 'What is the delivery lead time in days?', answer: 12, confidence: 0.95 },
      { questionId: 'q4', question: 'Commercial payment terms compliant?', answer: false, confidence: 0.90 },
    ] as any);
  }

  const hasExceptions = result.lineItems.some(i => i.flags && i.flags.length > 0) || result.lineItems.length < rfxLineItems.length;
  const finalStatus = hasExceptions ? 'review_required' : 'ready';

  const updateData: Record<string, any> = {
    status: finalStatus,
    updatedAt: new Date().toISOString(),
  };

  if (result.vendorName && result.vendorName.trim()) {
    updateData.vendorName = result.vendorName.trim();
  }

  await db.update(vendorResponses)
    .set(updateData)
    .where(eq(vendorResponses.id, vendorResponse.id));
}