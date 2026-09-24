import { db } from '../db/client';
import { questionnaireAnswers, vendorEligibility } from '../db/schema';
import { eq } from 'drizzle-orm';
import { QUESTIONNAIRE_QUESTIONS } from '../domain/constants';
export function evaluateEligibility(vendorResponse, answers) {
    const disqualificationReasons = [];
    for (const q of QUESTIONNAIRE_QUESTIONS) {
        const answer = answers.find(a => a.questionId === q.id);
        if (!answer)
            continue;
        if (q.disqualifyIfFalse && q.type === 'boolean' && answer.answer === false) {
            disqualificationReasons.push(`Failed: ${q.question}`);
        }
        if (q.disqualifyIfExceeds && q.type === 'number' && typeof answer.answer === 'number' && (q.maxValue !== undefined) && answer.answer > q.maxValue) {
            disqualificationReasons.push(`Failed: ${q.question} (value: ${answer.answer}, max: ${q.maxValue})`);
        }
    }
    return {
        isEligible: disqualificationReasons.length === 0,
        disqualificationReasons,
    };
}
export async function saveQuestionnaireAnswers(vendorResponseId, answers) {
    await db.delete(questionnaireAnswers).where(eq(questionnaireAnswers.vendorResponseId, vendorResponseId));
    if (answers.length > 0) {
        await db.insert(questionnaireAnswers).values(answers.map(a => ({
            id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            vendorResponseId,
            questionId: a.questionId,
            question: a.question,
            answer: JSON.stringify(a.answer),
            confidence: a.confidence,
            evidence: a.evidence ? JSON.stringify(a.evidence) : null,
        })));
    }
    const eligibility = evaluateEligibility({ id: vendorResponseId }, answers);
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
export async function getVendorEligibility(vendorResponseId) {
    const result = await db.select().from(vendorEligibility).where(eq(vendorEligibility.vendorResponseId, vendorResponseId));
    return result[0] || null;
}
export async function getAllEligibility(rfxId) {
    const { vendorResponses } = await import('../db/schema');
    const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));
    const eligibility = await db.select().from(vendorEligibility).where(inArray(vendorEligibility.vendorResponseId, vendors.map(v => v.id)));
    const map = {};
    for (const v of vendors) {
        map[v.id] = eligibility.find(e => e.vendorResponseId === v.id)?.isEligible ?? true;
    }
    return map;
}
import { inArray } from 'drizzle-orm';
//# sourceMappingURL=questionnaire.js.map