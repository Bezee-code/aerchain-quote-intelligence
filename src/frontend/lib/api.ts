import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useRfxList() {
  return useQuery({ queryKey: ['rfx'], queryFn: () => fetchJson<any[]>('/api/rfx') });
}

export function useRfx(id: string) {
  return useQuery({ queryKey: ['rfx', id], queryFn: () => fetchJson<any>(`/api/rfx/${id}`), enabled: !!id });
}

export function useComparison(rfxId: string, feasible = false) {
  return useQuery({
    queryKey: ['comparison', rfxId, feasible],
    queryFn: () => fetchJson<any[]>(`/api/comparison/${rfxId}?feasible=${feasible}`),
    enabled: !!rfxId,
  });
}

export function useExtraction(vendorResponseId: string) {
  return useQuery({
    queryKey: ['extraction', vendorResponseId],
    queryFn: () => fetchJson<any[]>(`/api/extraction/${vendorResponseId}`),
    enabled: !!vendorResponseId,
  });
}

export function useIngestionStatus(vendorResponseId: string) {
  return useQuery({
    queryKey: ['ingestion-status', vendorResponseId],
    queryFn: () => fetchJson<any>(`/api/ingestion/status/${vendorResponseId}`),
    enabled: !!vendorResponseId,
    refetchInterval: 3000,
  });
}

export function useParsedDocument(documentId: string) {
  return useQuery({
    queryKey: ['parsed-document', documentId],
    queryFn: () => fetchJson<any>(`/api/ingestion/parsed/${documentId}`),
    enabled: !!documentId,
  });
}

export function useVendorDocuments(vendorResponseId: string) {
  return useQuery({
    queryKey: ['vendor-documents', vendorResponseId],
    queryFn: () => fetchJson<any[]>(`/api/ingestion/documents/${vendorResponseId}`),
    enabled: !!vendorResponseId,
  });
}

export interface VendorResponseSummary {
  id: string;
  vendorName: string;
  status: string;
  responseFormat: string;
  document: {
    id: string;
    fileName: string;
    mimeType: string;
    uploadedAt: string;
  } | null;
  coverage: {
    quotedCount: number;
    totalCount: number;
  };
  exceptionsCount: number;
  isEligible: boolean | null;
  disqualificationReasons: string[];
  updatedAt: string;
}

export function useVendorResponses(rfxId: string) {
  return useQuery({
    queryKey: ['vendor-responses', rfxId],
    queryFn: () => fetchJson<VendorResponseSummary[]>(`/api/rfx/${rfxId}/responses`),
    enabled: !!rfxId,
    refetchInterval: (query) => {
      // Poll every 2s if any response is actively processing
      const hasActive = query.state.data?.some(r => ['uploading', 'parsing', 'extracting', 'validating', 'processing'].includes(r.status));
      return hasActive ? 2000 : false;
    },
  });
}

export function useLoadDemoResponses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfxId, force }: { rfxId: string; force?: boolean }) =>
      fetchJson<any>(`/api/ingestion/load-demo-responses/${rfxId}${force ? '?force=true' : ''}`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-responses'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['extraction'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-status'] });
    },
  });
}

export function useResetRFx() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rfxId: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/rfx/${rfxId}/reset`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-responses'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['extraction'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-status'] });
    },
  });
}

export function useUploadAndProcessVendorResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      vendorResponseId,
      rfxId = 'rfx-001',
      vendorName,
    }: {
      file: File;
      vendorResponseId?: string;
      rfxId?: string;
      vendorName?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);

      const params = new URLSearchParams();
      if (vendorResponseId) params.append('vendorResponseId', vendorResponseId);
      if (rfxId) params.append('rfxId', rfxId);
      if (vendorName) params.append('vendorName', vendorName);

      const uploadRes = await fetch(`/api/ingestion/upload?${params.toString()}`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error(await uploadRes.text());
      const uploadData = await uploadRes.json();
      const targetVendorId = uploadData.vendorResponseId || vendorResponseId;

      // Trigger automatic pipeline processing
      return await fetchJson(`/api/ingestion/process/${targetVendorId}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-responses'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['extraction'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-status'] });
    },
  });
}

export function useDeleteVendorResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfxId, vendorResponseId }: { rfxId: string; vendorResponseId: string }) =>
      fetchJson<{ success: boolean }>(`/api/rfx/${rfxId}/responses/${vendorResponseId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-responses'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['extraction'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-status'] });
    },
  });
}

export function useReprocessVendorResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorResponseId: string) =>
      fetchJson(`/api/ingestion/reprocess/${vendorResponseId}`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-responses'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['extraction'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-status'] });
    },
  });
}

export function useExtractVendorResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorResponseId: string) =>
      fetchJson(`/api/ingestion/extract/${vendorResponseId}`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-status'] });
      queryClient.invalidateQueries({ queryKey: ['extraction'] });
    },
  });
}

export function useOverrideExtraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, override }: { id: string; override: any }) =>
      fetchJson(`/api/extraction/${id}/override`, { method: 'POST', body: JSON.stringify(override) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['extraction'] });
    },
  });
}

export function useReviewExtraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/extraction/${id}/review`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extraction'] }),
  });
}

export function useAnalystChat() {
  return useMutation({
    mutationFn: async ({ sessionId, messages, rfxId }: { sessionId: string; messages: any[]; rfxId: string }) => {
      const res = await fetch('/api/analyst/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages, rfxId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.body;
    },
  });
}

export function useSplitAnalysis() {
  return useMutation({
    mutationFn: ({ rfxId, lineItemIds, constraints }: { rfxId: string; lineItemIds: string[]; constraints?: any }) =>
      fetchJson(`/api/split/${rfxId}`, { method: 'POST', body: JSON.stringify({ lineItemIds, constraints }) }),
  });
}