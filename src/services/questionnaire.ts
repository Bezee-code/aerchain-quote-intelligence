import { db } from '../db/client';
import { questionnaireAnswers, vendorEligibility } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { QuestionnaireAnswer, VendorEligibility, VendorResponse } from '../domain/types';
import { QUESTIONNAIRE_QUESTIONS } from '../domain/constants';

export function evaluateEligibility(
  vendorResponse: VendorResponse,
  answers: QuestionnaireAnswer[]
): { isEligible: boolean; disqualificationReasons: string[] } {
  const disqualificationReasons: string[] = [];

  for (const q of QUESTIONNAIRE_QUESTIONS) {
    const answer = answers.find(a => a.questionId === q.id);
    if (!answer) continue;

    let val: any = answer.answer;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch {
        // Keep as string
      }
    }

    const strVal = String(val).trim().toUpperCase();

    // Check boolean failure
    if (q.disqualifyIfFalse && q.type === 'boolean') {
      const isAffirmative = val === true || strVal === 'TRUE' || strVal === 'YES';
      if (!isAffirmative) {
        disqualificationReasons.push(`Failed: ${q.question}`);
        continue;
      }
    }

    // Check number threshold failure
    if (q.disqualifyIfExceeds && q.type === 'number') {
      const numVal = typeof val === 'number' ? val : parseFloat(String(val));
      if (!isNaN(numVal) && q.maxValue !== undefined && numVal > q.maxValue) {
        disqualificationReasons.push(`Failed: ${q.question} (value: ${numVal} days, ceiling: ${q.maxValue} days)`);
        continue;
      }
    }

    // Check required unresolved/pending terms
    if (q.required) {
      if (
        val === null ||
        val === undefined ||
        strVal === 'UNRESOLVED' ||
        strVal === 'PENDING' ||
        strVal === 'FALSE' ||
        strVal === 'NO'
      ) {
        disqualificationReasons.push(`Failed/Unresolved: ${q.question}`);
      }
    }
  }

  return {
    isEligible: disqualificationReasons.length === 0,
    disqualificationReasons,
  };
}

export async function saveQuestionnaireAnswers(
  vendorResponseId: string,
  answers: QuestionnaireAnswer[]
): Promise<void> {
  await db.delete(questionnaireAnswers).where(eq(questionnaireAnswers.vendorResponseId, vendorResponseId));

  if (answers.length > 0) {
    await db.insert(questionnaireAnswers).values(answers.map(a => {
      const qDef = QUESTIONNAIRE_QUESTIONS.find(q => q.id === a.questionId);
      return {
        id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        vendorResponseId,
        questionId: a.questionId,
        question: a.question || qDef?.question || a.questionId,
        answer: JSON.stringify(a.answer),
        confidence: a.confidence,
        evidence: a.evidence ? JSON.stringify(a.evidence) : null,
      };
    }));
  }

  const eligibility = evaluateEligibility(
    { id: vendorResponseId } as VendorResponse,
    answers
  );

  await db.insert(vendorEligibility).values({
    vendorResponseId,
    isEligible: eligibility.isEligible,
    disqualificationReasons: eligibility.disqualificationReasons,
    updatedAt: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: vendorEligibility.vendorResponseId,
    set: {
      isEligible: eligibility.isEligible,
      disqualificationReasons: eligibility.disqualificationReasons,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function getVendorEligibility(vendorResponseId: string): Promise<VendorEligibility | null> {
  const result = await db.select().from(vendorEligibility).where(eq(vendorEligibility.vendorResponseId, vendorResponseId));
  return result[0] || null;
}

export async function getAllEligibility(rfxId: string): Promise<Record<string, boolean>> {
  const { vendorResponses } = await import('../db/schema');
  const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));
  const eligibility = await db.select().from(vendorEligibility).where(inArray(vendorEligibility.vendorResponseId, vendors.map(v => v.id)));

  const map: Record<string, boolean> = {};
  for (const v of vendors) {
    map[v.id] = eligibility.find(e => e.vendorResponseId === v.id)?.isEligible ?? true;
  }
  return map;
}

import { inArray } from 'drizzle-orm';