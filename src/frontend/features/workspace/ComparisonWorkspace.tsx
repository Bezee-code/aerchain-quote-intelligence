import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useComparison,
  useOverrideExtraction,
  useReviewExtraction,
  useLoadDemoResponses,
  useResetRFx,
} from '@/frontend/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/frontend/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Input } from '@/frontend/components/ui/input';
import { formatCurrency } from '@/utils/currency';
import { formatPercent, formatNumber, cn } from '@/utils/formatting';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  UploadCloud,
  Loader2,
  FileQuestion,
  ExternalLink,
  Eye,
  X,
  FileText,
  Trash2,
  ArrowRight,
} from 'lucide-react';

interface ComparisonWorkspaceProps {
  rfxId: string;
}

export function ComparisonWorkspace({ rfxId }: ComparisonWorkspaceProps) {
  const navigate = useNavigate();
  const [feasibleOnly, setFeasibleOnly] = useState(false);
  const { data: comparison, isLoading, error, refetch } = useComparison(rfxId, feasibleOnly);
  const overrideMutation = useOverrideExtraction();
  const reviewMutation = useReviewExtraction();
  const loadDemoMutation = useLoadDemoResponses();
  const resetMutation = useResetRFx();

  const handleResetToCleanSlate = async () => {
    if (!confirm('Are you sure you want to purge all processed quotation data and reset to a clean empty state?')) return;
    try {
      await resetMutation.mutateAsync(rfxId);
      await refetch();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isProcessingDemo, setIsProcessingDemo] = useState(false);
  const [inspectQuotation, setInspectQuotation] = useState<{
    quotation: any;
    lineItem: any;
  } | null>(null);

  const handleLoadDemo = async () => {
    setIsProcessingDemo(true);
    try {
      await loadDemoMutation.mutateAsync({ rfxId, force: false });
      navigate(`/rfx/${rfxId}/responses`);
    } catch (err: any) {
      alert(`Failed to load demo responses: ${err.message}`);
      setIsProcessingDemo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading quotation comparison matrix...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error: {error.message}</div>;
  }

  // Check whether any vendor responses have actually been processed through the pipeline
  const hasExtractedQuotes = comparison?.some(row =>
    row.quotations?.some(q => q.extractedLineId && q.extractedLineId !== '')
  );

  // Requirement 6: Empty Comparison State
  if (!comparison || comparison.length === 0 || !hasExtractedQuotes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Card className="max-w-xl w-full text-center border-dashed border-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <FileQuestion className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">No vendor responses processed yet.</CardTitle>
            <CardDescription className="text-sm mt-2 max-w-md mx-auto">
              Quotations must originate from actual vendor response documents processed through the ingestion, parsing, Gemini extraction, and normalization pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => handleLoadDemo()}
                disabled={isProcessingDemo}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {isProcessingDemo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting Demo Submissions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Load Demo Responses
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(`/rfx/${rfxId}/responses`)}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <UploadCloud className="h-4 w-4" />
                Upload Vendor Response
              </Button>
            </div>

            {isProcessingDemo && (
              <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground animate-pulse text-left">
                <p className="font-semibold text-foreground">Pipeline in progress...</p>
                <p className="mt-0.5">Calling Google Gemini to parse, extract, match 30 line items, and normalize corrugated packaging responses.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendors = comparison[0]?.quotations?.map(q => q.vendorName) || [];
  const vendorIds = comparison[0]?.quotations?.map(q => q.vendorId) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Comparison Workspace</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {comparison.length} RFx Line Items × {vendors.length} Vendor Quotations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={feasibleOnly}
              onChange={e => setFeasibleOnly(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-sm font-medium">Feasible vendors only</span>
          </label>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Refresh
          </Button>
          <Button
            onClick={handleResetToCleanSlate}
            disabled={resetMutation.isPending}
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {resetMutation.isPending ? 'Resetting...' : 'Reset Quotations'}
          </Button>

          <Button
            onClick={() => navigate(`/rfx/${rfxId}/analyst`)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            size="sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask Analyst Co-Pilot
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64">Line Item</TableHead>
                  <TableHead className="w-24 text-right">Qty</TableHead>
                  <TableHead className="w-20 text-center">Unit</TableHead>
                  <TableHead className="w-28 text-center">Category</TableHead>
                  {vendors.map((vendor, i) => (
                    <TableHead key={vendorIds[i]} className="w-48 text-center">
                      <div className="font-semibold text-xs truncate" title={vendor}>{vendor}</div>
                      {comparison[0]?.quotations?.[i]?.isFeasible === false && (
                        <Badge variant="destructive" className="text-[10px] mt-0.5">Ineligible</Badge>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-40 text-center font-bold text-primary">Cheapest</TableHead>
                  <TableHead className="w-36">Exceptions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.map(item => (
                  <ComparisonRow
                    key={item.rfxLineItem.id}
                    item={item}
                    vendors={vendors}
                    vendorIds={vendorIds}
                    expanded={expandedRow === item.rfxLineItem.id}
                    onToggle={() => setExpandedRow(expandedRow === item.rfxLineItem.id ? null : item.rfxLineItem.id)}
                    onInspect={(quotation) => setInspectQuotation({ quotation, lineItem: item.rfxLineItem })}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Provenance & Override Inspection Dialog */}
      {inspectQuotation && (
        <QuotationInspectionModal
          rfxId={rfxId}
          lineItem={inspectQuotation.lineItem}
          quotation={inspectQuotation.quotation}
          onClose={() => setInspectQuotation(null)}
          onOverride={overrideMutation.mutateAsync}
          refetchComparison={refetch}
        />
      )}
    </div>
  );
}

interface ComparisonRowProps {
  item: any;
  vendors: string[];
  vendorIds: string[];
  expanded: boolean;
  onToggle: () => void;
  onInspect: (quotation: any) => void;
}

function ComparisonRow({ item, vendors, vendorIds, expanded, onToggle, onInspect }: ComparisonRowProps) {
  const { rfxLineItem, quotations, cheapestVendorId } = item;

  return (
    <>
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell>
          <div className="flex items-start gap-2">
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6 p-0 mt-0.5">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <div>
              <p className="font-semibold text-sm leading-snug">
                {rfxLineItem.lineNumber}. {rfxLineItem.description}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={rfxLineItem.specification}>
                {rfxLineItem.specification}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right font-mono text-sm">{formatNumber(rfxLineItem.quantity)}</TableCell>
        <TableCell className="text-center text-sm font-medium">{rfxLineItem.unit}</TableCell>
        <TableCell className="text-center">
          <Badge variant="secondary" className="text-[11px] font-normal">{rfxLineItem.category}</Badge>
        </TableCell>

        {quotations.map((q: any, i: number) => (
          <TableCell key={vendorIds[i]} className="text-center p-2">
            <QuotationCell
              quotation={q}
              isCheapest={q.vendorId === cheapestVendorId}
              onClick={() => onInspect(q)}
            />
          </TableCell>
        ))}

        <TableCell className="text-center font-bold text-sm text-primary">
          {cheapestVendorId ? vendors[vendorIds.indexOf(cheapestVendorId)] : '—'}
        </TableCell>

        <TableCell>
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set(quotations.flatMap((q: any) => q.flags || []))).map(flag => (
              <Badge key={flag as string} variant={getFlagVariant(flag as string)} className="text-[10px]">
                {formatFlag(flag as string)}
              </Badge>
            ))}
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={5 + vendors.length + 2} className="p-0">
            <div className="bg-muted/20 p-4 border-t border-b">
              <ExpandedQuotationDetail quotations={quotations} vendors={vendors} vendorIds={vendorIds} onInspect={onInspect} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function QuotationCell({ quotation, isCheapest, onClick }: { quotation: any; isCheapest: boolean; onClick: () => void }) {
  if (!quotation.pricePerBaseUnit || !quotation.extractedLineId) {
    return (
      <div
        onClick={quotation.extractedLineId ? onClick : undefined}
        className={cn(
          'flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-transparent transition-all',
          quotation.extractedLineId && 'hover:border-border hover:bg-muted/50 cursor-pointer'
        )}
      >
        <span className="text-muted-foreground text-xs">
          {quotation.unit === 'Unit not provided' ? 'Unit not provided' : 'Not quoted'}
        </span>
        {quotation.flags?.includes('missing_price') && <HelpCircle className="h-3 w-3 text-amber-500 mt-0.5" />}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-0.5 p-2 rounded-lg border border-transparent transition-all cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-xs',
        isCheapest && 'bg-primary/10 border-primary/30'
      )}
      title="Click to inspect source document evidence and review / correct quotation values"
    >
      <div className="flex items-center gap-1">
        <span className={cn('font-semibold text-sm', isCheapest ? 'text-primary' : 'text-foreground')}>
          {formatCurrency(quotation.pricePerBaseUnit, quotation.currency)}
        </span>
        {isCheapest && <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />}
      </div>

      <div className="text-[11px] text-muted-foreground">
        {formatCurrency(quotation.totalPrice, quotation.currency)}
      </div>

      <div className="flex items-center gap-1 mt-0.5">
        <Badge
          variant={quotation.confidence > 0.7 ? 'success' : quotation.confidence > 0.4 ? 'warning' : 'destructive'}
          className="text-[9px] px-1 py-0 h-4"
        >
          {formatPercent(quotation.confidence)}
        </Badge>
        {quotation.flags?.length > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" title={`${quotation.flags.length} flags`} />
        )}
      </div>
    </div>
  );
}

function ExpandedQuotationDetail({ quotations, vendors, vendorIds, onInspect }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {quotations.map((q: any, i: number) => (
        <div
          key={vendorIds[i]}
          onClick={() => q.extractedLineId && onInspect(q)}
          className={cn(
            'border rounded-lg p-3 bg-card text-xs space-y-1.5 transition-all',
            q.extractedLineId && 'cursor-pointer hover:border-primary hover:shadow-xs'
          )}
        >
          <div className="font-semibold text-foreground flex items-center justify-between">
            <span>{vendors[i]}</span>
            {q.extractedLineId && <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <div><span className="text-muted-foreground">Raw Price: </span>{q.pricePerBaseUnit !== null ? formatCurrency(q.pricePerBaseUnit, q.currency) : '—'}</div>
          <div><span className="text-muted-foreground">Normalized: </span>{q.pricePerBaseUnit !== null ? `${formatCurrency(q.pricePerBaseUnit, q.currency)} / ${q.unit}` : (q.unit === 'Unit not provided' ? 'Unit not provided' : '—')}</div>
          <div><span className="text-muted-foreground">Total: </span>{formatCurrency(q.totalPrice, q.currency)}</div>
          <div><span className="text-muted-foreground">Confidence: </span>{formatPercent(q.confidence)}</div>
          <div>
            <span className="text-muted-foreground">Flags: </span>
            {q.flags && q.flags.length > 0 ? (
              q.flags.map((f: string) => <Badge key={f} variant={getFlagVariant(f)} className="text-[9px] mr-1">{formatFlag(f)}</Badge>)
            ) : 'None'}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuotationInspectionModal({
  rfxId,
  lineItem,
  quotation,
  onClose,
  onOverride,
  refetchComparison,
}: {
  rfxId: string;
  lineItem: any;
  quotation: any;
  onClose: () => void;
  onOverride: (args: { id: string; override: any }) => Promise<void>;
  refetchComparison: () => void;
}) {
  const navigate = useNavigate();
  const [priceVal, setPriceVal] = useState(
    quotation.pricePerBaseUnit !== null && quotation.pricePerBaseUnit !== undefined
      ? quotation.pricePerBaseUnit.toString()
      : ''
  );
  const [unitVal, setUnitVal] = useState(quotation.unit || lineItem.unit || 'EA');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation.extractedLineId) return;

    setIsSaving(true);
    try {
      const price = parseFloat(priceVal);
      await onOverride({
        id: quotation.extractedLineId,
        override: {
          pricePerBaseUnit: !isNaN(price) ? price : null,
          unit: unitVal,
        },
      });
      await refetchComparison();
      onClose();
    } catch (err: any) {
      alert(`Correction failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <Card className="max-w-xl w-full shadow-2xl border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div>
            <CardTitle className="text-base font-semibold">Quotation Cell Provenance & Review</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Item {lineItem.lineNumber}: {lineItem.description}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-xs">
          {/* Provenance Traceability Chain (Requirement 7) */}
          <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
            <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">
              Provenance Traceability Chain
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Vendor</span>
                <span className="font-medium text-foreground">{quotation.vendorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">ExtractedLine ID</span>
                <span className="font-mono text-foreground">{quotation.extractedLineId || 'None (Unquoted)'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Confidence Score</span>
                <span className="font-medium text-foreground">{formatPercent(quotation.confidence)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Supplier Feasibility</span>
                <span className="font-medium text-foreground">{quotation.isFeasible ? 'Eligible' : 'Ineligible'}</span>
              </div>
            </div>
          </div>

          {/* Evidence Snippet */}
          {quotation.evidence && quotation.evidence.length > 0 && (
            <div className="p-3 bg-muted/20 rounded-lg border space-y-1">
              <span className="font-semibold text-muted-foreground text-[11px] block">Extracted Evidence Snippet</span>
              {quotation.evidence.map((ev: any, idx: number) => (
                <div key={idx} className="font-mono text-[11px] bg-background p-2 rounded border">
                  "{ev.text || JSON.stringify(ev)}"
                </div>
              ))}
            </div>
          )}

          {/* Exception Flags */}
          {quotation.flags && quotation.flags.length > 0 && (
            <div>
              <span className="text-muted-foreground block mb-1 font-semibold text-[11px]">Detected Exceptions</span>
              <div className="flex flex-wrap gap-1">
                {quotation.flags.map((f: string) => (
                  <Badge key={f} variant={getFlagVariant(f)} className="text-[10px]">
                    {formatFlag(f)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Override Form (Requirement 10) */}
          <form onSubmit={handleSave} className="space-y-3 pt-2 border-t">
            <span className="font-semibold text-foreground text-xs block">Buyer Correction & Normalization</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Price Per Base Unit</label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceVal}
                  onChange={e => setPriceVal(e.target.value)}
                  placeholder="e.g. 24.50"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Unit</label>
                <Input
                  type="text"
                  value={unitVal}
                  onChange={e => setUnitVal(e.target.value)}
                  placeholder="e.g. EA"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 text-xs flex items-center gap-1.5"
                onClick={() => {
                  onClose();
                  navigate(`/rfx/${rfxId}/review?vendorResponseId=${quotation.vendorId}`);
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Full Review Screen</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving || !quotation.extractedLineId}
                  className="bg-primary text-primary-foreground"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Save Correction
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function getFlagVariant(flag: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (flag) {
    case 'missing_price': return 'destructive';
    case 'currency_mismatch':
    case 'unit_mismatch':
    case 'quantity_mismatch': return 'warning';
    case 'low_confidence': return 'destructive';
    case 'ambiguous_terms': return 'info';
    case 'unsupported_conversion': return 'destructive';
    case 'no_match_found': return 'secondary';
    default: return 'default';
  }
}

function formatFlag(flag: string): string {
  return flag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}