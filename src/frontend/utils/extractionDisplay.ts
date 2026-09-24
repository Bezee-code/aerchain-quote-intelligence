export function getConfidenceLabel(confidence: number | undefined | null): { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' } {
  if (confidence === null || confidence === undefined) return { label: '—', variant: 'default' };
  if (confidence >= 0.8) return { label: 'High confidence', variant: 'success' };
  if (confidence >= 0.5) return { label: 'Needs review', variant: 'warning' };
  return { label: 'Low confidence', variant: 'destructive' };
}

export function getConfidenceColor(confidence: number | undefined | null): string {
  if (confidence === null || confidence === undefined) return 'text-muted-foreground';
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
}

export const FLAG_LABELS: Record<string, { label: string; variant: 'destructive' | 'warning' | 'info' | 'default' }> = {
  missing_price: { label: 'Price not provided', variant: 'destructive' },
  currency_mismatch: { label: 'Currency mismatch', variant: 'warning' },
  unit_mismatch: { label: 'Unit differs from RFx', variant: 'warning' },
  unsupported_conversion: { label: 'Cannot safely convert unit', variant: 'destructive' },
  low_confidence: { label: 'Extraction needs review', variant: 'warning' },
  no_match_found: { label: 'No RFx match found', variant: 'destructive' },
  ambiguous_terms: { label: 'Ambiguous terms', variant: 'info' },
  quantity_mismatch: { label: 'Quantity mismatch', variant: 'warning' },
};

export function getFlagDisplay(flag: string): { label: string; variant: 'destructive' | 'warning' | 'info' | 'default' } {
  return FLAG_LABELS[flag] || { label: flag.replace(/_/g, ' '), variant: 'default' };
}

export function getMatchStateLabel(state: string | undefined): { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' } {
  switch (state) {
    case 'MATCHED': return { label: 'Matched', variant: 'success' };
    case 'PROBABLE': return { label: 'Probable match', variant: 'warning' };
    case 'UNMATCHED': return { label: 'No match', variant: 'destructive' };
    case 'REVIEW': return { label: 'Review required', variant: 'warning' };
    default: return { label: 'Unknown', variant: 'default' };
  }
}

export function formatStatus(status: string): { label: string; variant: 'success' | 'warning' | 'destructive' | 'info' | 'default' } {
  switch (status) {
    case 'not_received': return { label: 'Not received', variant: 'default' };
    case 'uploaded': return { label: 'Uploaded', variant: 'info' };
    case 'processing': return { label: 'Processing', variant: 'info' };
    case 'parsing': return { label: 'Parsing', variant: 'info' };
    case 'parsed': return { label: 'Parsed', variant: 'warning' };
    case 'extracting': return { label: 'Extracting', variant: 'info' };
    case 'validating': return { label: 'Validating', variant: 'info' };
    case 'extracted': return { label: 'Extracted', variant: 'success' };
    case 'ready': return { label: 'Ready', variant: 'success' };
    case 'review_required': return { label: 'Review', variant: 'warning' };
    case 'reviewed': return { label: 'Reviewed', variant: 'success' };
    case 'failed': return { label: 'Failed', variant: 'destructive' };
    default: return { label: status, variant: 'default' };
  }
}

export function formatReviewStatus(status: string): { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' } {
  switch (status) {
    case 'auto': return { label: 'Auto-extracted', variant: 'default' };
    case 'reviewed': return { label: 'Reviewed', variant: 'success' };
    case 'corrected': return { label: 'Buyer corrected', variant: 'warning' };
    default: return { label: status, variant: 'default' };
  }
}