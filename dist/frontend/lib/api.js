import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
const API_BASE = '';
async function fetchJson(url, options) {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export function useRfxList() {
    return useQuery({ queryKey: ['rfx'], queryFn: () => fetchJson('/api/rfx') });
}
export function useRfx(id) {
    return useQuery({ queryKey: ['rfx', id], queryFn: () => fetchJson(`/api/rfx/${id}`), enabled: !!id });
}
export function useComparison(rfxId, feasible = false) {
    return useQuery({
        queryKey: ['comparison', rfxId, feasible],
        queryFn: () => fetchJson(`/api/comparison/${rfxId}?feasible=${feasible}`),
        enabled: !!rfxId,
    });
}
export function useExtraction(vendorResponseId) {
    return useQuery({
        queryKey: ['extraction', vendorResponseId],
        queryFn: () => fetchJson(`/api/extraction/${vendorResponseId}`),
        enabled: !!vendorResponseId,
    });
}
export function useOverrideExtraction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, override }) => fetchJson(`/api/extraction/${id}/override`, { method: 'POST', body: JSON.stringify(override) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comparison'] });
            queryClient.invalidateQueries({ queryKey: ['extraction'] });
        },
    });
}
export function useReviewExtraction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fetchJson(`/api/extraction/${id}/review`, { method: 'POST' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extraction'] }),
    });
}
export function useAnalystChat() {
    return useMutation({
        mutationFn: async ({ sessionId, messages, rfxId }) => {
            const res = await fetch('/api/analyst/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, messages, rfxId }),
            });
            if (!res.ok)
                throw new Error(await res.text());
            return res.body;
        },
    });
}
export function useSplitAnalysis() {
    return useMutation({
        mutationFn: ({ rfxId, lineItemIds, constraints }) => fetchJson(`/api/split/${rfxId}`, { method: 'POST', body: JSON.stringify({ lineItemIds, constraints }) }),
    });
}
//# sourceMappingURL=api.js.map