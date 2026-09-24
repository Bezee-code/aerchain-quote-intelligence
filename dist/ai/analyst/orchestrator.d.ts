export interface AnalystStreamChunk {
    type: 'text' | 'tool_call' | 'tool_result' | 'error';
    content?: string;
    toolCall?: {
        name: string;
        args: Record<string, unknown>;
        id: string;
    };
    toolResult?: {
        name: string;
        result: unknown;
        id: string;
    };
    error?: string;
}
export declare function runAnalystSession(sessionId: string, messages: {
    role: 'user' | 'assistant';
    content: string;
}[], context: {
    rfxId: string;
    rfxName: string;
    lineItemsCount: number;
    vendorsCount: number;
}): AsyncGenerator<AnalystStreamChunk>;
//# sourceMappingURL=orchestrator.d.ts.map