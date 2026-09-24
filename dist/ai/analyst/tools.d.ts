import { z } from 'zod';
export declare const getComparisonTool: import("ai").CoreTool<z.ZodObject<{
    rfxId: z.ZodString;
    lineItemIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    vendorIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeFlagged: z.ZodDefault<z.ZodBoolean>;
    onlyFeasible: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    rfxId: string;
    includeFlagged: boolean;
    onlyFeasible: boolean;
    lineItemIds?: string[] | undefined;
    vendorIds?: string[] | undefined;
}, {
    rfxId: string;
    lineItemIds?: string[] | undefined;
    vendorIds?: string[] | undefined;
    includeFlagged?: boolean | undefined;
    onlyFeasible?: boolean | undefined;
}>, any> & {
    execute: (args: {
        rfxId: string;
        includeFlagged: boolean;
        onlyFeasible: boolean;
        lineItemIds?: string[] | undefined;
        vendorIds?: string[] | undefined;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<any>;
};
export declare const getEvidenceTool: import("ai").CoreTool<z.ZodObject<{
    extractedLineId: z.ZodString;
    field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
}, "strip", z.ZodTypeAny, {
    extractedLineId: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
}, {
    extractedLineId: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
}>, {
    evidence: null;
    documentId?: undefined;
} | {
    evidence: any;
    documentId: any;
}> & {
    execute: (args: {
        extractedLineId: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<{
        evidence: null;
        documentId?: undefined;
    } | {
        evidence: any;
        documentId: any;
    }>;
};
export declare const calculateSplitTool: import("ai").CoreTool<z.ZodObject<{
    rfxId: z.ZodString;
    lineItemIds: z.ZodArray<z.ZodString, "many">;
    constraints: z.ZodOptional<z.ZodObject<{
        maxVendors: z.ZodOptional<z.ZodNumber>;
        minVolumePerVendor: z.ZodOptional<z.ZodNumber>;
        preferredVendors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedVendors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        requireFeasible: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        requireFeasible: boolean;
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
    }, {
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
        requireFeasible?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    rfxId: string;
    lineItemIds: string[];
    constraints?: {
        requireFeasible: boolean;
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
    } | undefined;
}, {
    rfxId: string;
    lineItemIds: string[];
    constraints?: {
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
        requireFeasible?: boolean | undefined;
    } | undefined;
}>, any> & {
    execute: (args: {
        rfxId: string;
        lineItemIds: string[];
        constraints?: {
            requireFeasible: boolean;
            maxVendors?: number | undefined;
            minVolumePerVendor?: number | undefined;
            preferredVendors?: string[] | undefined;
            excludedVendors?: string[] | undefined;
        } | undefined;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<any>;
};
export declare const filterFeasibleTool: import("ai").CoreTool<z.ZodObject<{
    rfxId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rfxId: string;
}, {
    rfxId: string;
}>, any> & {
    execute: (args: {
        rfxId: string;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<any>;
};
export declare const convertUnitsTool: import("ai").CoreTool<z.ZodObject<{
    value: z.ZodNumber;
    fromUnit: z.ZodString;
    toUnit: z.ZodString;
    conversionRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    value: number;
    fromUnit: string;
    toUnit: string;
    conversionRate?: number | undefined;
}, {
    value: number;
    fromUnit: string;
    toUnit: string;
    conversionRate?: number | undefined;
}>, {
    error: string;
    converted?: undefined;
    rate?: undefined;
} | {
    converted: number;
    rate: any;
    error?: undefined;
}> & {
    execute: (args: {
        value: number;
        fromUnit: string;
        toUnit: string;
        conversionRate?: number | undefined;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<{
        error: string;
        converted?: undefined;
        rate?: undefined;
    } | {
        converted: number;
        rate: any;
        error?: undefined;
    }>;
};
export declare const analystTools: ((import("ai").CoreTool<z.ZodObject<{
    rfxId: z.ZodString;
    lineItemIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    vendorIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeFlagged: z.ZodDefault<z.ZodBoolean>;
    onlyFeasible: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    rfxId: string;
    includeFlagged: boolean;
    onlyFeasible: boolean;
    lineItemIds?: string[] | undefined;
    vendorIds?: string[] | undefined;
}, {
    rfxId: string;
    lineItemIds?: string[] | undefined;
    vendorIds?: string[] | undefined;
    includeFlagged?: boolean | undefined;
    onlyFeasible?: boolean | undefined;
}>, any> & {
    execute: (args: {
        rfxId: string;
        includeFlagged: boolean;
        onlyFeasible: boolean;
        lineItemIds?: string[] | undefined;
        vendorIds?: string[] | undefined;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<any>;
}) | (import("ai").CoreTool<z.ZodObject<{
    extractedLineId: z.ZodString;
    field: z.ZodEnum<["price", "currency", "unit", "quantity", "terms"]>;
}, "strip", z.ZodTypeAny, {
    extractedLineId: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
}, {
    extractedLineId: string;
    field: "price" | "currency" | "unit" | "quantity" | "terms";
}>, {
    evidence: null;
    documentId?: undefined;
} | {
    evidence: any;
    documentId: any;
}> & {
    execute: (args: {
        extractedLineId: string;
        field: "price" | "currency" | "unit" | "quantity" | "terms";
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<{
        evidence: null;
        documentId?: undefined;
    } | {
        evidence: any;
        documentId: any;
    }>;
}) | (import("ai").CoreTool<z.ZodObject<{
    rfxId: z.ZodString;
    lineItemIds: z.ZodArray<z.ZodString, "many">;
    constraints: z.ZodOptional<z.ZodObject<{
        maxVendors: z.ZodOptional<z.ZodNumber>;
        minVolumePerVendor: z.ZodOptional<z.ZodNumber>;
        preferredVendors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedVendors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        requireFeasible: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        requireFeasible: boolean;
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
    }, {
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
        requireFeasible?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    rfxId: string;
    lineItemIds: string[];
    constraints?: {
        requireFeasible: boolean;
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
    } | undefined;
}, {
    rfxId: string;
    lineItemIds: string[];
    constraints?: {
        maxVendors?: number | undefined;
        minVolumePerVendor?: number | undefined;
        preferredVendors?: string[] | undefined;
        excludedVendors?: string[] | undefined;
        requireFeasible?: boolean | undefined;
    } | undefined;
}>, any> & {
    execute: (args: {
        rfxId: string;
        lineItemIds: string[];
        constraints?: {
            requireFeasible: boolean;
            maxVendors?: number | undefined;
            minVolumePerVendor?: number | undefined;
            preferredVendors?: string[] | undefined;
            excludedVendors?: string[] | undefined;
        } | undefined;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<any>;
}) | (import("ai").CoreTool<z.ZodObject<{
    rfxId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rfxId: string;
}, {
    rfxId: string;
}>, any> & {
    execute: (args: {
        rfxId: string;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<any>;
}) | (import("ai").CoreTool<z.ZodObject<{
    value: z.ZodNumber;
    fromUnit: z.ZodString;
    toUnit: z.ZodString;
    conversionRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    value: number;
    fromUnit: string;
    toUnit: string;
    conversionRate?: number | undefined;
}, {
    value: number;
    fromUnit: string;
    toUnit: string;
    conversionRate?: number | undefined;
}>, {
    error: string;
    converted?: undefined;
    rate?: undefined;
} | {
    converted: number;
    rate: any;
    error?: undefined;
}> & {
    execute: (args: {
        value: number;
        fromUnit: string;
        toUnit: string;
        conversionRate?: number | undefined;
    }, options: {
        abortSignal?: AbortSignal;
    }) => PromiseLike<{
        error: string;
        converted?: undefined;
        rate?: undefined;
    } | {
        converted: number;
        rate: any;
        error?: undefined;
    }>;
}))[];
//# sourceMappingURL=tools.d.ts.map