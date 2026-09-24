import { z } from 'zod';
import type { UnitOfMeasure, Currency, FlagType, ExtractionStatus, VendorResponseStatus, RFxLineItem, RFx, SourceDoc, VendorResponse, CommercialTerms, EvidenceSpan, ConfidenceScores, RawExtractedValues, NormalizedValues, BuyerOverride, ExtractedLine, QuestionnaireAnswer, VendorEligibility, NormalizedLineItem, NormalizedQuotation, SplitAllocation, SplitResult, Citation, AnalystMessage, ToolCall } from './types';
export declare const unitSchema: z.ZodEnum<["EA", "KG", "M", "HR", "L", "PC", "SET", "M2", "M3", "TON"]>;
export declare const currencySchema: z.ZodEnum<["USD", "EUR", "GBP", "CNY", "JPY", "INR"]>;
export declare const flagTypeSchema: z.ZodEnum<["currency_mismatch", "unit_mismatch", "missing_price", "ambiguous_terms", "low_confidence", "unsupported_conversion", "quantity_mismatch", "no_match_found"]>;
export declare const extractionStatusSchema: z.ZodEnum<["auto", "reviewed", "corrected"]>;
export declare const vendorResponseStatusSchema: z.ZodEnum<["uploaded", "processing", "extracted", "reviewed"]>;
export declare const commercialTermsSchema: z.ZodObject<{
    paymentTerms: z.ZodOptional<z.ZodString>;
    deliveryTerms: z.ZodOptional<z.ZodString>;
    incoterms: z.ZodOptional<z.ZodString>;
    validityDays: z.ZodOptional<z.ZodNumber>;
    minimumOrderQty: z.ZodOptional<z.ZodNumber>;
    leadTimeDays: z.ZodOptional<z.ZodNumber>;
    custom: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    custom: Record<string, string>;
    paymentTerms?: string | undefined;
    deliveryTerms?: string | undefined;
    incoterms?: string | undefined;
    validityDays?: number | undefined;
    minimumOrderQty?: number | undefined;
    leadTimeDays?: number | undefined;
}, {
    custom: Record<string, string>;
    paymentTerms?: string | undefined;
    deliveryTerms?: string | undefined;
    incoterms?: string | undefined;
    validityDays?: number | undefined;
    minimumOrderQty?: number | undefined;
    leadTimeDays?: number | undefined;
}>;
export declare const evidenceSpanSchema: z.ZodObject<{
    sourceDocId: z.ZodString;
    pageNumber: z.ZodNumber;
    bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
    text: z.ZodString;
    field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
}, "strip", z.ZodTypeAny, {
    text: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
    pageNumber: number;
    bbox: [number, number, number, number];
    sourceDocId: string;
}, {
    text: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
    pageNumber: number;
    bbox: [number, number, number, number];
    sourceDocId: string;
}>;
export declare const confidenceScoresSchema: z.ZodObject<{
    overall: z.ZodNumber;
    price: z.ZodNumber;
    currency: z.ZodNumber;
    unit: z.ZodNumber;
    quantity: z.ZodNumber;
    terms: z.ZodNumber;
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
export declare const rawExtractedValuesSchema: z.ZodObject<{
    vendorLineRef: z.ZodNullable<z.ZodString>;
    description: z.ZodString;
    price: z.ZodNullable<z.ZodNumber>;
    currency: z.ZodNullable<z.ZodString>;
    unit: z.ZodNullable<z.ZodString>;
    quantity: z.ZodNullable<z.ZodNumber>;
    terms: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    price: number | null;
    currency: string | null;
    unit: string | null;
    quantity: number | null;
    terms: string | null;
    vendorLineRef: string | null;
}, {
    description: string;
    price: number | null;
    currency: string | null;
    unit: string | null;
    quantity: number | null;
    terms: string | null;
    vendorLineRef: string | null;
}>;
export declare const normalizedValuesSchema: z.ZodObject<{
    pricePerBaseUnit: z.ZodNullable<z.ZodNumber>;
    totalPrice: z.ZodNullable<z.ZodNumber>;
    currency: z.ZodLiteral<"USD">;
    unit: z.ZodString;
    quantity: z.ZodNumber;
    terms: z.ZodNullable<z.ZodObject<{
        paymentTerms: z.ZodOptional<z.ZodString>;
        deliveryTerms: z.ZodOptional<z.ZodString>;
        incoterms: z.ZodOptional<z.ZodString>;
        validityDays: z.ZodOptional<z.ZodNumber>;
        minimumOrderQty: z.ZodOptional<z.ZodNumber>;
        leadTimeDays: z.ZodOptional<z.ZodNumber>;
        custom: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    }, {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    currency: "USD";
    unit: string;
    quantity: number;
    terms: {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    } | null;
    pricePerBaseUnit: number | null;
    totalPrice: number | null;
}, {
    currency: "USD";
    unit: string;
    quantity: number;
    terms: {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    } | null;
    pricePerBaseUnit: number | null;
    totalPrice: number | null;
}>;
export declare const buyerOverrideSchema: z.ZodObject<{
    pricePerBaseUnit: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodObject<{
        paymentTerms: z.ZodOptional<z.ZodString>;
        deliveryTerms: z.ZodOptional<z.ZodString>;
        incoterms: z.ZodOptional<z.ZodString>;
        validityDays: z.ZodOptional<z.ZodNumber>;
        minimumOrderQty: z.ZodOptional<z.ZodNumber>;
        leadTimeDays: z.ZodOptional<z.ZodNumber>;
        custom: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    }, {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    }>>;
    correctedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    correctedAt: string;
    unit?: string | undefined;
    terms?: {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    } | undefined;
    pricePerBaseUnit?: number | undefined;
}, {
    correctedAt: string;
    unit?: string | undefined;
    terms?: {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    } | undefined;
    pricePerBaseUnit?: number | undefined;
}>;
export declare const extractedLineSchema: z.ZodObject<{
    id: z.ZodString;
    vendorResponseId: z.ZodString;
    sourceDocId: z.ZodString;
    rfxLineItemId: z.ZodString;
    raw: z.ZodObject<{
        vendorLineRef: z.ZodNullable<z.ZodString>;
        description: z.ZodString;
        price: z.ZodNullable<z.ZodNumber>;
        currency: z.ZodNullable<z.ZodString>;
        unit: z.ZodNullable<z.ZodString>;
        quantity: z.ZodNullable<z.ZodNumber>;
        terms: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        vendorLineRef: string | null;
    }, {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        vendorLineRef: string | null;
    }>;
    normalized: z.ZodObject<{
        pricePerBaseUnit: z.ZodNullable<z.ZodNumber>;
        totalPrice: z.ZodNullable<z.ZodNumber>;
        currency: z.ZodLiteral<"USD">;
        unit: z.ZodString;
        quantity: z.ZodNumber;
        terms: z.ZodNullable<z.ZodObject<{
            paymentTerms: z.ZodOptional<z.ZodString>;
            deliveryTerms: z.ZodOptional<z.ZodString>;
            incoterms: z.ZodOptional<z.ZodString>;
            validityDays: z.ZodOptional<z.ZodNumber>;
            minimumOrderQty: z.ZodOptional<z.ZodNumber>;
            leadTimeDays: z.ZodOptional<z.ZodNumber>;
            custom: z.ZodRecord<z.ZodString, z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        }, {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        currency: "USD";
        unit: string;
        quantity: number;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
    }, {
        currency: "USD";
        unit: string;
        quantity: number;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
    }>;
    confidence: z.ZodObject<{
        overall: z.ZodNumber;
        price: z.ZodNumber;
        currency: z.ZodNumber;
        unit: z.ZodNumber;
        quantity: z.ZodNumber;
        terms: z.ZodNumber;
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
        sourceDocId: z.ZodString;
        pageNumber: z.ZodNumber;
        bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        text: z.ZodString;
        field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }>, "many">;
    flags: z.ZodArray<z.ZodEnum<["currency_mismatch", "unit_mismatch", "missing_price", "ambiguous_terms", "low_confidence", "unsupported_conversion", "quantity_mismatch", "no_match_found"]>, "many">;
    buyerOverride: z.ZodOptional<z.ZodObject<{
        pricePerBaseUnit: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        terms: z.ZodOptional<z.ZodObject<{
            paymentTerms: z.ZodOptional<z.ZodString>;
            deliveryTerms: z.ZodOptional<z.ZodString>;
            incoterms: z.ZodOptional<z.ZodString>;
            validityDays: z.ZodOptional<z.ZodNumber>;
            minimumOrderQty: z.ZodOptional<z.ZodNumber>;
            leadTimeDays: z.ZodOptional<z.ZodNumber>;
            custom: z.ZodRecord<z.ZodString, z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        }, {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        }>>;
        correctedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        correctedAt: string;
        unit?: string | undefined;
        terms?: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | undefined;
        pricePerBaseUnit?: number | undefined;
    }, {
        correctedAt: string;
        unit?: string | undefined;
        terms?: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | undefined;
        pricePerBaseUnit?: number | undefined;
    }>>;
    status: z.ZodEnum<["auto", "reviewed", "corrected"]>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "auto" | "reviewed" | "corrected";
    id: string;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }[];
    raw: {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        vendorLineRef: string | null;
    };
    confidence: {
        price: number;
        currency: number;
        unit: number;
        quantity: number;
        terms: number;
        overall: number;
    };
    flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
    updatedAt: string;
    vendorResponseId: string;
    sourceDocId: string;
    rfxLineItemId: string;
    normalized: {
        currency: "USD";
        unit: string;
        quantity: number;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
    };
    buyerOverride?: {
        correctedAt: string;
        unit?: string | undefined;
        terms?: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | undefined;
        pricePerBaseUnit?: number | undefined;
    } | undefined;
}, {
    status: "auto" | "reviewed" | "corrected";
    id: string;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }[];
    raw: {
        description: string;
        price: number | null;
        currency: string | null;
        unit: string | null;
        quantity: number | null;
        terms: string | null;
        vendorLineRef: string | null;
    };
    confidence: {
        price: number;
        currency: number;
        unit: number;
        quantity: number;
        terms: number;
        overall: number;
    };
    flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
    updatedAt: string;
    vendorResponseId: string;
    sourceDocId: string;
    rfxLineItemId: string;
    normalized: {
        currency: "USD";
        unit: string;
        quantity: number;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
    };
    buyerOverride?: {
        correctedAt: string;
        unit?: string | undefined;
        terms?: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | undefined;
        pricePerBaseUnit?: number | undefined;
    } | undefined;
}>;
export declare const rfxLineItemSchema: z.ZodObject<{
    id: z.ZodString;
    lineNumber: z.ZodNumber;
    description: z.ZodString;
    specification: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodEnum<["EA", "KG", "M", "HR", "L", "PC", "SET", "M2", "M3", "TON"]>;
    category: z.ZodString;
    mandatory: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
    quantity: number;
    lineNumber: number;
    specification: string;
    category: string;
    mandatory: boolean;
}, {
    id: string;
    description: string;
    unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
    quantity: number;
    lineNumber: number;
    specification: string;
    category: string;
    mandatory: boolean;
}>;
export declare const rfxSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    lineItems: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        lineNumber: z.ZodNumber;
        description: z.ZodString;
        specification: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodEnum<["EA", "KG", "M", "HR", "L", "PC", "SET", "M2", "M3", "TON"]>;
        category: z.ZodString;
        mandatory: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    }, {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    }>, "many">;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string;
    lineItems: {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
}, {
    name: string;
    id: string;
    description: string;
    lineItems: {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
}>;
export declare const sourceDocSchema: z.ZodObject<{
    id: z.ZodString;
    vendorResponseId: z.ZodString;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    storagePath: z.ZodString;
    parsedPath: z.ZodOptional<z.ZodString>;
    pageCount: z.ZodOptional<z.ZodNumber>;
    uploadedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    vendorResponseId: string;
    fileName: string;
    mimeType: string;
    storagePath: string;
    uploadedAt: string;
    parsedPath?: string | undefined;
    pageCount?: number | undefined;
}, {
    id: string;
    vendorResponseId: string;
    fileName: string;
    mimeType: string;
    storagePath: string;
    uploadedAt: string;
    parsedPath?: string | undefined;
    pageCount?: number | undefined;
}>;
export declare const vendorResponseSchema: z.ZodObject<{
    id: z.ZodString;
    rfxId: z.ZodString;
    vendorName: z.ZodString;
    status: z.ZodEnum<["uploaded", "processing", "extracted", "reviewed"]>;
    sourceDocuments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        vendorResponseId: z.ZodString;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        storagePath: z.ZodString;
        parsedPath: z.ZodOptional<z.ZodString>;
        pageCount: z.ZodOptional<z.ZodNumber>;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        vendorResponseId: string;
        fileName: string;
        mimeType: string;
        storagePath: string;
        uploadedAt: string;
        parsedPath?: string | undefined;
        pageCount?: number | undefined;
    }, {
        id: string;
        vendorResponseId: string;
        fileName: string;
        mimeType: string;
        storagePath: string;
        uploadedAt: string;
        parsedPath?: string | undefined;
        pageCount?: number | undefined;
    }>, "many">;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "uploaded" | "processing" | "extracted" | "reviewed";
    id: string;
    rfxId: string;
    createdAt: string;
    updatedAt: string;
    vendorName: string;
    sourceDocuments: {
        id: string;
        vendorResponseId: string;
        fileName: string;
        mimeType: string;
        storagePath: string;
        uploadedAt: string;
        parsedPath?: string | undefined;
        pageCount?: number | undefined;
    }[];
}, {
    status: "uploaded" | "processing" | "extracted" | "reviewed";
    id: string;
    rfxId: string;
    createdAt: string;
    updatedAt: string;
    vendorName: string;
    sourceDocuments: {
        id: string;
        vendorResponseId: string;
        fileName: string;
        mimeType: string;
        storagePath: string;
        uploadedAt: string;
        parsedPath?: string | undefined;
        pageCount?: number | undefined;
    }[];
}>;
export declare const questionnaireAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    question: z.ZodString;
    answer: z.ZodUnion<[z.ZodString, z.ZodBoolean, z.ZodNumber]>;
    confidence: z.ZodNumber;
    evidence: z.ZodOptional<z.ZodObject<{
        sourceDocId: z.ZodString;
        pageNumber: z.ZodNumber;
        bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        text: z.ZodString;
        field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    questionId: string;
    answer: string | number | boolean;
    question: string;
    evidence?: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    } | undefined;
}, {
    confidence: number;
    questionId: string;
    answer: string | number | boolean;
    question: string;
    evidence?: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    } | undefined;
}>;
export declare const vendorEligibilitySchema: z.ZodObject<{
    vendorResponseId: z.ZodString;
    isEligible: z.ZodBoolean;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        question: z.ZodString;
        answer: z.ZodUnion<[z.ZodString, z.ZodBoolean, z.ZodNumber]>;
        confidence: z.ZodNumber;
        evidence: z.ZodOptional<z.ZodObject<{
            sourceDocId: z.ZodString;
            pageNumber: z.ZodNumber;
            bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
            text: z.ZodString;
            field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        question: string;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        } | undefined;
    }, {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        question: string;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        } | undefined;
    }>, "many">;
    disqualificationReasons: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    vendorResponseId: string;
    isEligible: boolean;
    disqualificationReasons: string[];
    answers: {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        question: string;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        } | undefined;
    }[];
}, {
    vendorResponseId: string;
    isEligible: boolean;
    disqualificationReasons: string[];
    answers: {
        confidence: number;
        questionId: string;
        answer: string | number | boolean;
        question: string;
        evidence?: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        } | undefined;
    }[];
}>;
export declare const normalizedQuotationSchema: z.ZodObject<{
    vendorId: z.ZodString;
    vendorName: z.ZodString;
    extractedLineId: z.ZodString;
    pricePerBaseUnit: z.ZodNullable<z.ZodNumber>;
    totalPrice: z.ZodNullable<z.ZodNumber>;
    currency: z.ZodLiteral<"USD">;
    unit: z.ZodString;
    terms: z.ZodNullable<z.ZodObject<{
        paymentTerms: z.ZodOptional<z.ZodString>;
        deliveryTerms: z.ZodOptional<z.ZodString>;
        incoterms: z.ZodOptional<z.ZodString>;
        validityDays: z.ZodOptional<z.ZodNumber>;
        minimumOrderQty: z.ZodOptional<z.ZodNumber>;
        leadTimeDays: z.ZodOptional<z.ZodNumber>;
        custom: z.ZodRecord<z.ZodString, z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    }, {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    }>>;
    flags: z.ZodArray<z.ZodEnum<["currency_mismatch", "unit_mismatch", "missing_price", "ambiguous_terms", "low_confidence", "unsupported_conversion", "quantity_mismatch", "no_match_found"]>, "many">;
    confidence: z.ZodNumber;
    isFeasible: z.ZodBoolean;
    evidence: z.ZodArray<z.ZodObject<{
        sourceDocId: z.ZodString;
        pageNumber: z.ZodNumber;
        bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        text: z.ZodString;
        field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    extractedLineId: string;
    currency: "USD";
    unit: string;
    terms: {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    } | null;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }[];
    confidence: number;
    flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
    vendorName: string;
    pricePerBaseUnit: number | null;
    totalPrice: number | null;
    vendorId: string;
    isFeasible: boolean;
}, {
    extractedLineId: string;
    currency: "USD";
    unit: string;
    terms: {
        custom: Record<string, string>;
        paymentTerms?: string | undefined;
        deliveryTerms?: string | undefined;
        incoterms?: string | undefined;
        validityDays?: number | undefined;
        minimumOrderQty?: number | undefined;
        leadTimeDays?: number | undefined;
    } | null;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }[];
    confidence: number;
    flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
    vendorName: string;
    pricePerBaseUnit: number | null;
    totalPrice: number | null;
    vendorId: string;
    isFeasible: boolean;
}>;
export declare const normalizedLineItemSchema: z.ZodObject<{
    rfxLineItem: z.ZodObject<{
        id: z.ZodString;
        lineNumber: z.ZodNumber;
        description: z.ZodString;
        specification: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodEnum<["EA", "KG", "M", "HR", "L", "PC", "SET", "M2", "M3", "TON"]>;
        category: z.ZodString;
        mandatory: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    }, {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    }>;
    quotations: z.ZodArray<z.ZodObject<{
        vendorId: z.ZodString;
        vendorName: z.ZodString;
        extractedLineId: z.ZodString;
        pricePerBaseUnit: z.ZodNullable<z.ZodNumber>;
        totalPrice: z.ZodNullable<z.ZodNumber>;
        currency: z.ZodLiteral<"USD">;
        unit: z.ZodString;
        terms: z.ZodNullable<z.ZodObject<{
            paymentTerms: z.ZodOptional<z.ZodString>;
            deliveryTerms: z.ZodOptional<z.ZodString>;
            incoterms: z.ZodOptional<z.ZodString>;
            validityDays: z.ZodOptional<z.ZodNumber>;
            minimumOrderQty: z.ZodOptional<z.ZodNumber>;
            leadTimeDays: z.ZodOptional<z.ZodNumber>;
            custom: z.ZodRecord<z.ZodString, z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        }, {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        }>>;
        flags: z.ZodArray<z.ZodEnum<["currency_mismatch", "unit_mismatch", "missing_price", "ambiguous_terms", "low_confidence", "unsupported_conversion", "quantity_mismatch", "no_match_found"]>, "many">;
        confidence: z.ZodNumber;
        isFeasible: z.ZodBoolean;
        evidence: z.ZodArray<z.ZodObject<{
            sourceDocId: z.ZodString;
            pageNumber: z.ZodNumber;
            bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
            text: z.ZodString;
            field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        extractedLineId: string;
        currency: "USD";
        unit: string;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }[];
        confidence: number;
        flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
        vendorName: string;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
        vendorId: string;
        isFeasible: boolean;
    }, {
        extractedLineId: string;
        currency: "USD";
        unit: string;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }[];
        confidence: number;
        flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
        vendorName: string;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
        vendorId: string;
        isFeasible: boolean;
    }>, "many">;
    cheapestVendorId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rfxLineItem: {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    };
    quotations: {
        extractedLineId: string;
        currency: "USD";
        unit: string;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }[];
        confidence: number;
        flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
        vendorName: string;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
        vendorId: string;
        isFeasible: boolean;
    }[];
    cheapestVendorId?: string | undefined;
}, {
    rfxLineItem: {
        id: string;
        description: string;
        unit: "EA" | "PC" | "SET" | "KG" | "TON" | "M" | "M2" | "M3" | "HR" | "L";
        quantity: number;
        lineNumber: number;
        specification: string;
        category: string;
        mandatory: boolean;
    };
    quotations: {
        extractedLineId: string;
        currency: "USD";
        unit: string;
        terms: {
            custom: Record<string, string>;
            paymentTerms?: string | undefined;
            deliveryTerms?: string | undefined;
            incoterms?: string | undefined;
            validityDays?: number | undefined;
            minimumOrderQty?: number | undefined;
            leadTimeDays?: number | undefined;
        } | null;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }[];
        confidence: number;
        flags: ("currency_mismatch" | "unit_mismatch" | "missing_price" | "ambiguous_terms" | "low_confidence" | "unsupported_conversion" | "quantity_mismatch" | "no_match_found")[];
        vendorName: string;
        pricePerBaseUnit: number | null;
        totalPrice: number | null;
        vendorId: string;
        isFeasible: boolean;
    }[];
    cheapestVendorId?: string | undefined;
}>;
export declare const splitAllocationSchema: z.ZodObject<{
    vendorId: z.ZodString;
    vendorName: z.ZodString;
    lineItems: z.ZodArray<z.ZodObject<{
        rfxLineItemId: z.ZodString;
        quantity: z.ZodNumber;
        pricePerUnit: z.ZodNumber;
        totalPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        rfxLineItemId: string;
        totalPrice: number;
        pricePerUnit: number;
    }, {
        quantity: number;
        rfxLineItemId: string;
        totalPrice: number;
        pricePerUnit: number;
    }>, "many">;
    subtotal: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        quantity: number;
        rfxLineItemId: string;
        totalPrice: number;
        pricePerUnit: number;
    }[];
    vendorName: string;
    vendorId: string;
    subtotal: number;
}, {
    lineItems: {
        quantity: number;
        rfxLineItemId: string;
        totalPrice: number;
        pricePerUnit: number;
    }[];
    vendorName: string;
    vendorId: string;
    subtotal: number;
}>;
export declare const splitResultSchema: z.ZodObject<{
    allocations: z.ZodArray<z.ZodObject<{
        vendorId: z.ZodString;
        vendorName: z.ZodString;
        lineItems: z.ZodArray<z.ZodObject<{
            rfxLineItemId: z.ZodString;
            quantity: z.ZodNumber;
            pricePerUnit: z.ZodNumber;
            totalPrice: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            quantity: number;
            rfxLineItemId: string;
            totalPrice: number;
            pricePerUnit: number;
        }, {
            quantity: number;
            rfxLineItemId: string;
            totalPrice: number;
            pricePerUnit: number;
        }>, "many">;
        subtotal: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lineItems: {
            quantity: number;
            rfxLineItemId: string;
            totalPrice: number;
            pricePerUnit: number;
        }[];
        vendorName: string;
        vendorId: string;
        subtotal: number;
    }, {
        lineItems: {
            quantity: number;
            rfxLineItemId: string;
            totalPrice: number;
            pricePerUnit: number;
        }[];
        vendorName: string;
        vendorId: string;
        subtotal: number;
    }>, "many">;
    totalCost: z.ZodNumber;
    currency: z.ZodLiteral<"USD">;
    unallocated: z.ZodArray<z.ZodString, "many">;
    assumptions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    currency: "USD";
    allocations: {
        lineItems: {
            quantity: number;
            rfxLineItemId: string;
            totalPrice: number;
            pricePerUnit: number;
        }[];
        vendorName: string;
        vendorId: string;
        subtotal: number;
    }[];
    totalCost: number;
    unallocated: string[];
    assumptions: string[];
}, {
    currency: "USD";
    allocations: {
        lineItems: {
            quantity: number;
            rfxLineItemId: string;
            totalPrice: number;
            pricePerUnit: number;
        }[];
        vendorName: string;
        vendorId: string;
        subtotal: number;
    }[];
    totalCost: number;
    unallocated: string[];
    assumptions: string[];
}>;
export declare const citationSchema: z.ZodObject<{
    extractedLineId: z.ZodString;
    vendorName: z.ZodString;
    lineDescription: z.ZodString;
    field: z.ZodString;
    value: z.ZodString;
    evidence: z.ZodObject<{
        sourceDocId: z.ZodString;
        pageNumber: z.ZodNumber;
        bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        text: z.ZodString;
        field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }, {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    value: string;
    extractedLineId: string;
    field: string;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    };
    vendorName: string;
    lineDescription: string;
}, {
    value: string;
    extractedLineId: string;
    field: string;
    evidence: {
        text: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
        pageNumber: number;
        bbox: [number, number, number, number];
        sourceDocId: string;
    };
    vendorName: string;
    lineDescription: string;
}>;
export declare const toolCallSchema: z.ZodObject<{
    name: z.ZodString;
    args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    args: Record<string, unknown>;
    id: string;
}, {
    name: string;
    args: Record<string, unknown>;
    id: string;
}>;
export declare const analystMessageSchema: z.ZodObject<{
    id: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "tool"]>;
    content: z.ZodString;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        args: Record<string, unknown>;
        id: string;
    }, {
        name: string;
        args: Record<string, unknown>;
        id: string;
    }>, "many">>;
    citations: z.ZodArray<z.ZodObject<{
        extractedLineId: z.ZodString;
        vendorName: z.ZodString;
        lineDescription: z.ZodString;
        field: z.ZodString;
        value: z.ZodString;
        evidence: z.ZodObject<{
            sourceDocId: z.ZodString;
            pageNumber: z.ZodNumber;
            bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
            text: z.ZodString;
            field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }, {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        extractedLineId: string;
        field: string;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        };
        vendorName: string;
        lineDescription: string;
    }, {
        value: string;
        extractedLineId: string;
        field: string;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        };
        vendorName: string;
        lineDescription: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    content: string;
    id: string;
    role: "user" | "assistant" | "tool";
    citations: {
        value: string;
        extractedLineId: string;
        field: string;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        };
        vendorName: string;
        lineDescription: string;
    }[];
    toolCalls?: {
        name: string;
        args: Record<string, unknown>;
        id: string;
    }[] | undefined;
}, {
    content: string;
    id: string;
    role: "user" | "assistant" | "tool";
    citations: {
        value: string;
        extractedLineId: string;
        field: string;
        evidence: {
            text: string;
            field: "price" | "currency" | "unit" | "quantity" | "terms";
            pageNumber: number;
            bbox: [number, number, number, number];
            sourceDocId: string;
        };
        vendorName: string;
        lineDescription: string;
    }[];
    toolCalls?: {
        name: string;
        args: Record<string, unknown>;
        id: string;
    }[] | undefined;
}>;
export type { UnitOfMeasure, Currency, FlagType, ExtractionStatus, VendorResponseStatus, RFxLineItem, RFx, SourceDoc, VendorResponse, CommercialTerms, EvidenceSpan, ConfidenceScores, RawExtractedValues, NormalizedValues, BuyerOverride, ExtractedLine, QuestionnaireAnswer, VendorEligibility, NormalizedLineItem, NormalizedQuotation, SplitAllocation, SplitResult, Citation, AnalystMessage, ToolCall, };
//# sourceMappingURL=validation.d.ts.map