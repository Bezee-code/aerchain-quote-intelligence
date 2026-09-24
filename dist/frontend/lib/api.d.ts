export declare function useRfxList(): import("@tanstack/react-query").UseQueryResult<any[], Error>;
export declare function useRfx(id: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useComparison(rfxId: string, feasible?: boolean): import("@tanstack/react-query").UseQueryResult<any[], Error>;
export declare function useExtraction(vendorResponseId: string): import("@tanstack/react-query").UseQueryResult<any[], Error>;
export declare function useOverrideExtraction(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    override: any;
}, unknown>;
export declare function useReviewExtraction(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useAnalystChat(): import("@tanstack/react-query").UseMutationResult<ReadableStream<Uint8Array<ArrayBuffer>> | null, Error, {
    sessionId: string;
    messages: any[];
    rfxId: string;
}, unknown>;
export declare function useSplitAnalysis(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    rfxId: string;
    lineItemIds: string[];
    constraints?: any;
}, unknown>;
//# sourceMappingURL=api.d.ts.map