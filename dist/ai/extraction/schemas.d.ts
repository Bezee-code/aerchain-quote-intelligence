import { z } from 'zod';
export declare const evidenceSchema: z.ZodObject<{
    field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
    text: z.ZodString;
    pageNumber: z.ZodOptional<z.ZodNumber>;
    bbox: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
    pageNumber?: number | undefined;
    bbox?: [number, number, number, number] | undefined;
}, {
    text: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
    pageNumber?: number | undefined;
    bbox?: [number, number, number, number] | undefined;
}>;
export declare const lineItemConfidenceSchema: z.ZodObject<{
    price: z.ZodNumber;
    currency: z.ZodNumber;
    unit: z.ZodNumber;
    quantity: z.ZodNumber;
    terms: z.ZodNumber;
    overall: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    price: number;
    currency: number;
    unit: number;
    quantity: number;
    terms: number;
    overall: number;
}, {
    price: number;
    currency: number;
    unit: number;
    quantity: number;
    terms: number;
    overall: number;
}>;
export declare const extractedLineItemSchema: z.ZodObject<{
    vendorLineRef: z.ZodNullable<z.ZodString>;
    description: z.ZodString;
    price: z.ZodNullable<z.ZodNumber>;
    currency: z.ZodNullable<z.ZodString>;
    unit: z.ZodNullable<z.ZodString>;
    quantity: z.ZodNullable<z.ZodNumber>;
    terms: z.ZodNullable<z.ZodString>;
    confidence: z.ZodObject<{
        price: z.ZodNumber;
        currency: z.ZodNumber;
        unit: z.ZodNumber;
        quantity: z.ZodNumber;
        terms: z.ZodNumber;
        overall: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        price: number;
        currency: number;
        unit: number;
        quantity: number;
        terms: number;
        overall: number;
    }, {
        price: number;
        currency: number;
        unit: number;
        quantity: number;
        terms: number;
        overall: number;
    }>;
    evidence: z.ZodArray<z.ZodObject<{
        field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
        text: z.ZodString;
        pageNumber: z.ZodOptional<z.ZodNumber>;
        bbox: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }>, "many">;
    flags: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    description: string;
    price: number | null;
    currency: string | null;
    unit: string | null;
    quantity: number | null;
    terms: string | null;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }[];
    vendorLineRef: string | null;
    confidence: {
        price: number;
        currency: number;
        unit: number;
        quantity: number;
        terms: number;
        overall: number;
    };
    flags: string[];
}, {
    description: string;
    price: number | null;
    currency: string | null;
    unit: string | null;
    quantity: number | null;
    terms: string | null;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }[];
    vendorLineRef: string | null;
    confidence: {
        price: number;
        currency: number;
        unit: number;
        quantity: number;
        terms: number;
        overall: number;
    };
    flags: string[];
}>;
export declare const questionnaireAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    answer: z.ZodUnion<[z.ZodString, z.ZodBoolean, z.ZodNumber]>;
    confidence: z.ZodNumber;
    evidence: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
        text: z.ZodString;
        pageNumber: z.ZodOptional<z.ZodNumber>;
        bbox: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    questionId: string;
    answer: string | number | boolean;
    evidence?: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }[] | undefined;
}, {
    confidence: number;
    questionId: string;
    answer: string | number | boolean;
    evidence?: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber?: number | undefined;
        bbox?: [number, number, number, number] | undefined;
    }[] | undefined;
}>;
export declare const extractionResultSchema: z.ZodObject<{
    lineItems: z.ZodArray<z.ZodObject<{
        vendorLineRef: z.ZodNullable<z.ZodString>;
        description: z.ZodString;
        price: z.ZodNullable<z.ZodNumber>;
        currency: z.ZodNullable<z.ZodString>;
        unit: z.ZodNullable<z.ZodString>;
        quantity: z.ZodNullable<z.ZodNumber>;
        terms: z.ZodNullable<z.ZodString>;
        confidence: z.ZodObject<{
            price: z.ZodNumber;
            currency: z.ZodNumber;
            unit: z.ZodNumber;
            quantity: z.ZodNumber;
            terms: z.ZodNumber;
            overall: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            price: number;
            currency: number;
            unit: number;
            quantity: number;
            terms: number;
            overall: number;
        }, {
            price: number;
            currency: number;
            unit: number;
            quantity: number;
            terms: number;
            overall: number;
        }>;
        evidence: z.ZodArray<z.ZodObject<{
            field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
            text: z.ZodString;
            pageNumber: z.ZodOptional<z.ZodNumber>;
            bbox: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }>, "many">;
        flags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[];
        vendorLineRef: string | null;
        confidence: {
            price: number;
            currency: number;
            unit: number;
            quantity: number;
            terms: number;
            overall: number;
        };
        flags: string[];
    }, {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[];
        vendorLineRef: string | null;
        confidence: {
            price: number;
            currency: number;
            unit: number;
            quantity: number;
            terms: number;
            overall: number;
        };
        flags: string[];
    }>, "many">;
    questionnaireAnswers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        answer: z.ZodUnion<[z.ZodString, z.ZodBoolean, z.ZodNumber]>;
        confidence: z.ZodNumber;
        evidence: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
            text: z.ZodString;
            pageNumber: z.ZodOptional<z.ZodNumber>;
            bbox: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[] | undefined;
    }, {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[];
        vendorLineRef: string | null;
        confidence: {
            price: number;
            currency: number;
            unit: number;
            quantity: number;
            terms: number;
            overall: number;
        };
        flags: string[];
    }[];
    questionnaireAnswers?: {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[] | undefined;
    }[] | undefined;
}, {
    lineItems: {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[];
        vendorLineRef: string | null;
        confidence: {
            price: number;
            currency: number;
            unit: number;
            quantity: number;
            terms: number;
            overall: number;
        };
        flags: string[];
    }[];
    questionnaireAnswers?: {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber?: number | undefined;
            bbox?: [number, number, number, number] | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractedLineItem = z.infer<typeof extractedLineItemSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
//# sourceMappingURL=schemas.d.ts.map