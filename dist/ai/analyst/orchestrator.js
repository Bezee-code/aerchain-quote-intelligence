import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { analystTools } from './tools';
import { ANALYST_SYSTEM_PROMPT, buildAnalystPrompt } from './prompts';
export async function* runAnalystSession(sessionId, messages, context) {
    const systemPrompt = ANALYST_SYSTEM_PROMPT;
    const userPrompt = buildAnalystPrompt(messages[messages.length - 1]?.content || '', context);
    const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(0, -1),
        { role: 'user', content: userPrompt },
    ];
    const stream = streamText({
        model: openai('gpt-4o-mini'),
        messages: formattedMessages,
        tools: Object.fromEntries(analystTools.map(t => [t.name, t])),
        maxSteps: 5,
        temperature: 0.2,
    });
    for await (const chunk of stream.fullStream) {
        if (chunk.type === 'text-delta') {
            yield { type: 'text', content: chunk.textDelta };
        }
        else if (chunk.type === 'tool-call') {
            yield {
                type: 'tool_call',
                toolCall: {
                    name: chunk.toolCall.toolName,
                    args: chunk.toolCall.args,
                    id: chunk.toolCall.toolCallId,
                },
            };
        }
        else if (chunk.type === 'tool-result') {
            yield {
                type: 'tool_result',
                toolResult: {
                    name: chunk.toolCall.toolName,
                    result: chunk.result,
                    id: chunk.toolCall.toolCallId,
                },
            };
        }
        else if (chunk.type === 'error') {
            yield { type: 'error', error: chunk.error?.message || 'Unknown error' };
        }
    }
}
//# sourceMappingURL=orchestrator.js.map