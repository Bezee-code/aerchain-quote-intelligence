import type { QuestionnaireAnswer, VendorEligibility, VendorResponse } from '../domain/types';
export declare function evaluateEligibility(vendorResponse: VendorResponse, answers: QuestionnaireAnswer[]): {
    isEligible: boolean;
    disqualificationReasons: string[];
};
export declare function saveQuestionnaireAnswers(vendorResponseId: string, answers: QuestionnaireAnswer[]): Promise<void>;
export declare function getVendorEligibility(vendorResponseId: string): Promise<VendorEligibility | null>;
export declare function getAllEligibility(rfxId: string): Promise<Record<string, boolean>>;
//# sourceMappingURL=questionnaire.d.ts.map