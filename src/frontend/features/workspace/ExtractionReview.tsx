import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIngestionStatus, useExtractVendorResponse, useParsedDocument, useVendorDocuments, useOverrideExtraction } from '@/frontend/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/frontend/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/frontend/components/ui/table';
import { Input } from '@/frontend/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { EvidencePanel } from './EvidencePanel';
import { Separator } from '@/frontend/components/ui/separator';
import { Alert, AlertDescription } from '@/frontend/components/ui/alert';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { formatCurrency } from '@/utils/currency';
import { formatNumber, cn } from '@/utils/formatting';
import {
  getConfidenceLabel,
  getFlagDisplay,
  getMatchStateLabel,
  formatStatus,
  formatReviewStatus,
  FLAG_LABELS,
} from '@/frontend/utils/extractionDisplay';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Eye,
  Edit,
  Save,
  RotateCcw,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';

interface ExtractedLineItem {
  id: string;
  vendorLineRef: string | null;
  description: string;
  price: number | null;
  currency: string | null;
  unit: string | null;
  quantity: number | null;
  terms: string | null;
  confidence: {
    price: number;
    currency: number;
    unit: number;
    quantity: number;
    terms: number;
    overall: number;
  };
  evidence: {
    field: string;
    text: string;
    pageNumber?: number;
    bbox?: [number, number, number, number];
    sourceDocId?: string;
  }[];
  flags: string[];
  matchState?: string;
  matchedRfxLineItemId?: string | null;
  raw: {
    vendorLineRef: string | null;
    description: string;
    price: number | null;
    currency: string | null;
    unit: string | null;
    quantity: number | null;
    terms: string | null;
  };
  normalized: {
    pricePerBaseUnit: number | null;
    totalPrice: number | null;
    currency: string;
    unit: string;
    quantity: number;
    terms: any;
  };
  buyerOverride?: {
    pricePerBaseUnit?: number;
    unit?: string;
    terms?: any;
    correctedAt: string;
  };
  status: string;
}

interface ExtractionReviewProps {
  vendorResponseId: string;
  vendorName: string;
}

function ConfidenceBadge({ confidence }: { confidence: number | undefined | null }) {
  const { label, variant } = getConfidenceLabel(confidence);
  return <Badge variant={variant}>{label}</Badge>;
}

function FlagBadge({ flag }: { flag: string }) {
  const { label, variant } = getFlagDisplay(flag);
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function MatchStateBadge({ state }: { state: string | undefined }) {
  const { label, variant } = getMatchStateLabel(state);
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const { label, variant } = formatStatus(status);
  return <Badge variant={variant}>{label}</Badge>;
}

function ReviewStatusBadge({ status }: { status: string }) {
  const { label, variant } = formatReviewStatus(status);
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function EvidenceButton({ evidence, field }: { evidence: ExtractedLineItem['evidence']; field: string }) {
  const fieldEvidence = evidence.filter(e => e.field === field);
  if (fieldEvidence.length === 0) return null;
  
  return (
    <Button variant="ghost" size="icon" onClick={() => window.dispatchEvent(new CustomEvent('show-evidence', { detail: fieldEvidence }))}>
      <Eye className="h-4 w-4" />
    </Button>
  );
}

interface ExtractionTableProps {
  items: ExtractedLineItem[];
  rfxLineItems: { id: string; lineNumber: number; description: string; unit: string; quantity: number }[];
  onOverride: (id: string, override: any) => Promise<void>;
  onEvidenceOpen: (evidence: ExtractedLineItem['evidence']) => void;
}

function ExtractionTable({ items, rfxLineItems, onOverride, onEvidenceOpen }: ExtractionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const rfxMap = new Map(rfxLineItems.map(l => [l.id, l]));

  const handleEdit = (id: string, field: string, value: any) => {
    setEditValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (id: string) => {
    const values = editValues[id];
    if (!values) return;
    
    try {
      await onOverride(id, values);
      setEditingId(null);
      delete editValues[id];
    } catch (error) {
      console.error('Failed to save override:', error);
      alert('Failed to save correction');
    }
  };

  const handleCancel = (id: string) => {
    setEditingId(null);
    delete editValues[id];
  };

  const rfxMatch = (item: ExtractedLineItem) => {
    if (!item.matchedRfxLineItemId) return null;
    return rfxMap.get(item.matchedRfxLineItemId) || null;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">RFx Line Item</TableHead>
            <TableHead className="w-48">Vendor Description</TableHead>
            <TableHead className="w-24">Raw Price</TableHead>
            <TableHead className="w-16">Currency</TableHead>
            <TableHead className="w-16">Unit</TableHead>
            <TableHead className="w-20">Qty</TableHead>
            <TableHead className="w-24">Norm. Price</TableHead>
            <TableHead className="w-20">Confidence</TableHead>
            <TableHead className="w-24">Match</TableHead>
            <TableHead className="w-32">Flags</TableHead>
            <TableHead className="w-20">Status</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const rfx = rfxMatch(item);
            const hasBuyerOverride = !!item.buyerOverride;
            
            return (
              <TableRow key={item.id} className={hasBuyerOverride ? 'bg-yellow-50' : ''}>
                <TableCell className="font-mono text-xs">
                  {rfx ? `${rfx.lineNumber}. ${rfx.description}` : '—'}
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">{item.description}</TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues[item.id]?.pricePerBaseUnit ?? item.raw.price ?? ''}
                      onChange={e => handleEdit(item.id, 'pricePerBaseUnit', parseFloat(e.target.value) || null)}
                      className="w-full"
                      placeholder="Price"
                    />
                  ) : (
                    <span className={item.raw.price === null ? 'text-muted-foreground' : ''}>
                      {item.raw.price !== null ? formatCurrency(item.raw.price, item.raw.currency || undefined) : '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Input
                      value={editValues[item.id]?.currency ?? item.raw.currency ?? ''}
                      onChange={e => handleEdit(item.id, 'currency', e.target.value)}
                      className="w-full"
                      placeholder="USD"
                    />
                  ) : (
                    item.raw.currency || '—'
                  )}
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Input
                      value={editValues[item.id]?.unit ?? item.raw.unit ?? ''}
                      onChange={e => handleEdit(item.id, 'unit', e.target.value)}
                      className="w-full"
                      placeholder="EA"
                    />
                  ) : (
                    item.raw.unit || '—'
                  )}
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Input
                      type="number"
                      value={editValues[item.id]?.quantity ?? item.raw.quantity ?? ''}
                      onChange={e => handleEdit(item.id, 'quantity', parseFloat(e.target.value) || null)}
                      className="w-full"
                      placeholder="Qty"
                    />
                  ) : (
                    item.raw.quantity !== null ? formatNumber(item.raw.quantity) : '—'
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span className={item.normalized.pricePerBaseUnit !== null ? '' : 'text-muted-foreground'}>
                      {item.normalized.pricePerBaseUnit !== null 
                        ? `${formatCurrency(item.normalized.pricePerBaseUnit)} / ${item.normalized.unit}`
                        : '—'}
                    </span>
                    {item.normalized.totalPrice !== null && (
                      <span className="text-xs text-muted-foreground">
                        Total: {formatCurrency(item.normalized.totalPrice)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ConfidenceBadge confidence={item.confidence.overall} />
                </TableCell>
                <TableCell>
                  <MatchStateBadge state={item.matchState} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.flags.length > 0 ? (
                      item.flags.map(flag => (
                        <FlagBadge key={flag} flag={flag} />
                      ))
                    ) : (
                      <Badge variant="success" className="text-xs">Clean</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ReviewStatusBadge status={item.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {editingId === item.id ? (
                      <>
                        <Button variant="default" size="sm" onClick={() => handleSave(item.id)}>
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(item.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setEditValues(prev => ({ ...prev, [item.id]: { pricePerBaseUnit: item.raw.price, currency: item.raw.currency, unit: item.raw.unit, quantity: item.raw.quantity } })) }}>
                          <Edit className="h-4 w-4 mr-1" /> Correct
                        </Button>
                        {hasBuyerOverride && (
                          <Button variant="ghost" size="sm" onClick={() => handleCancel(item.id)} title="Reset to AI value">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    <EvidenceButton evidence={item.evidence} field="price" />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SeparatorVertical() {
  return <Separator className="h-full" orientation="vertical" />;
}

export function ExtractionReview({ vendorResponseId, vendorName }: ExtractionReviewProps) {
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useIngestionStatus(vendorResponseId);
  const { data: documents, isLoading: docsLoading } = useVendorDocuments(vendorResponseId);
  const extractMutation = useExtractVendorResponse();
  const overrideMutation = useOverrideExtraction();
  
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents?.[0]?.id || null);
  const [evidenceOpen, setEvidenceOpen] = useState<ExtractedLineItem['evidence'] | null>(null);
  
  const { data: parsedDoc, isLoading: parsedLoading } = useParsedDocument(selectedDocId || '');

  if (statusLoading || docsLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Extraction Review</h2>
          <StatusBadge status={status?.status || 'unknown'} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><CardContent className="h-64"><Skeleton /></CardContent></Card>
          <Card><CardContent className="h-64"><Skeleton /></CardContent></Card>
        </div>
      </div>
    );
  }

  const parsedItems: ExtractedLineItem[] = parsedDoc ? (parsedDoc.lineItems || []).map((item: any, idx: number) => ({
    id: item.id || `ext-${idx}`,
    vendorLineRef: item.vendorLineRef,
    description: item.description,
    price: item.price,
    currency: item.currency,
    unit: item.unit,
    quantity: item.quantity,
    terms: item.terms,
    confidence: item.confidence || { price: 0, currency: 0, unit: 0, quantity: 0, terms: 0, overall: 0 },
    evidence: item.evidence || [],
    flags: item.flags || [],
    matchState: item.matchState,
    matchedRfxLineItemId: item.matchedRfxLineItemId,
    raw: {
      vendorLineRef: item.vendorLineRef,
      description: item.description,
      price: item.price,
      currency: item.currency,
      unit: item.unit,
      quantity: item.quantity,
      terms: item.terms,
    },
    normalized: {
      pricePerBaseUnit: item.normalized?.pricePerBaseUnit ?? null,
      totalPrice: item.normalized?.totalPrice ?? null,
      currency: item.normalized?.currency || 'USD',
      unit: item.normalized?.unit || item.raw?.unit || '',
      quantity: item.normalized?.quantity || item.raw?.quantity || 0,
      terms: item.normalized?.terms || null,
    },
    buyerOverride: item.buyerOverride,
    status: item.status || 'auto',
  })) : [];

  const totalFlags = parsedItems.reduce((sum, item) => sum + item.flags.length, 0);
  const highConfidence = parsedItems.filter(i => i.confidence.overall >= 0.8).length;
  const needsReview = parsedItems.filter(i => i.confidence.overall < 0.8 && i.confidence.overall >= 0.5).length;
  const lowConfidence = parsedItems.filter(i => i.confidence.overall < 0.5).length;
  const unmatched = parsedItems.filter(i => i.matchState === 'UNMATCHED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Extraction Review</h2>
          <p className="text-muted-foreground">{vendorName} • {parsedItems.length} extracted lines</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status?.status || 'unknown'} />
          {status?.status === 'parsed' && (
            <Button onClick={() => extractMutation.mutateAsync(vendorResponseId).then(refetchStatus)} disabled={extractMutation.isPending}>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Run AI Extraction
            </Button>
          )}
          {status?.status === 'extracted' && (
            <Badge variant="success" className="ml-2">Ready for review</Badge>
          )}
          {status?.status === 'failed' && (
            <Badge variant="destructive" className="ml-2">Extraction failed</Badge>
          )}
        </div>
      </div>

      {status?.status === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AI extraction failed. {status?.error ? `Reason: ${status.error}` : 'Check server logs for details.'}
            {status?.configurationError && ' Missing GEMINI_API_KEY configuration in .env.'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="review" className="space-y-4">
        <TabsList>
          <TabsTrigger value="review">Review ({parsedItems.length})</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Extracted Line Items</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="success">{highConfidence} High</Badge>
                    <Badge variant="warning">{needsReview} Review</Badge>
                    <Badge variant="destructive">{lowConfidence} Low</Badge>
                    <Badge variant="destructive">{unmatched} Unmatched</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {parsedItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No extracted line items yet.</p>
                      {status?.status === 'parsed' && (
                        <p className="text-sm mt-2">Run AI extraction to populate this table.</p>
                      )}
                    </div>
                  ) : (
                    <ExtractionTable
                      items={parsedItems}
                      rfxLineItems={[]}
                      onOverride={overrideMutation.mutateAsync}
                      onEvidenceOpen={setEvidenceOpen}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{highConfidence}</p>
                      <p className="text-sm text-green-700">High Confidence</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{needsReview}</p>
                      <p className="text-sm text-yellow-700">Needs Review</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{lowConfidence}</p>
                      <p className="text-sm text-red-700">Low Confidence</p>
                    </div>
                    <div className="p-4 bg-destructive/10 rounded-lg">
                      <p className="text-2xl font-bold text-destructive">{unmatched}</p>
                      <p className="text-sm text-destructive">Unmatched</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Flag Summary</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(FLAG_LABELS).map(([flag, { label, variant }]) => {
                        const count = parsedItems.filter(i => i.flags.includes(flag)).length;
                        return count > 0 ? (
                          <Badge key={flag} variant={variant} className="text-xs">
                            {label}: {count}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    {parsedItems.every(i => i.flags.length === 0) && parsedItems.length > 0 && (
                      <Badge variant="success">All extracted values currently pass validation.</Badge>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Items Requiring Review</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {parsedItems
                        .filter(i => i.confidence.overall < 0.8 || i.flags.length > 0 || i.matchState !== 'MATCHED')
                        .slice(0, 10)
                        .map(item => (
                          <div key={item.id} className="p-3 bg-muted/50 rounded-lg border text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate max-w-[200px]">{item.description}</span>
                              <div className="flex items-center gap-1">
                                <ConfidenceBadge confidence={item.confidence.overall} />
                                <MatchStateBadge state={item.matchState} />
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.flags.map(flag => <FlagBadge key={flag} flag={flag} />)}
                            </div>
                          </div>
                        ))}
                      {parsedItems.every(i => i.confidence.overall >= 0.8 && i.flags.length === 0 && i.matchState === 'MATCHED') && (
                        <p className="text-sm text-green-600">All items pass review criteria.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evidence">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Source Document Viewer</CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedDoc ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{parsedDoc.id}</h4>
                        <Badge variant="outline">{parsedDoc.mimeType}</Badge>
                      </div>
                      <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">{parsedDoc.text.slice(0, 10000)}</pre>
                      </div>
                      {parsedDoc.tables.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Tables ({parsedDoc.tables.length})</h4>
                          {parsedDoc.tables.map((table: any, idx: number) => (
                            <div key={idx} className="border rounded-lg overflow-hidden">
                              <div className="p-2 bg-muted font-mono text-xs">
                                {table.sheetName ? `Sheet: ${table.sheetName}` : `Page ${table.pageNumber || idx + 1}`}
                                {table.rowCount !== undefined && ` • ${table.rowCount} rows × ${table.colCount} cols`}
                              </div>
                              <div className="overflow-x-auto p-2">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted">
                                      {table.headers.map((h: string, hi: number) => (
                                        <th key={hi} className="p-2 text-left font-medium">{h || `Col ${hi + 1}`}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.rows.slice(0, 10).map((row: string[], ri: number) => (
                                      <tr key={ri} className={ri % 2 === 0 ? 'bg-muted/50' : ''}>
                                        {row.map((cell: string, ci: number) => (
                                          <td key={ci} className="p-2 border">{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {parsedDoc.images.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">OCR Images ({parsedDoc.images.length})</h4>
                          {parsedDoc.images.map((img: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Page {img.pageNumber}</span>
                                {img.confidence !== undefined && (
                                  <Badge variant={img.confidence > 80 ? 'success' : img.confidence > 50 ? 'warning' : 'destructive'}>
                                    OCR Confidence: {img.confidence}%
                                  </Badge>
                                )}
                              </div>
                              <pre className="text-sm font-mono whitespace-pre-wrap max-h-40 overflow-auto">{img.text}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Select a document from the Documents tab to view its parsed content.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Field Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  {evidenceOpen ? (
                    <EvidencePanel
                      evidence={evidenceOpen}
                      onClose={() => setEvidenceOpen(null)}
                      title="Field Evidence"
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Click the eye icon next to a field in the Review tab to view its source evidence.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Source Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents?.map(doc => (
                  <Card key={doc.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.mimeType} • {doc.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.parsedPath?.endsWith('.error.json') ? 'destructive' : doc.parsedPath ? 'success' : 'secondary'}>
                            {doc.parsedPath?.endsWith('.error.json') ? 'Parse Error' : doc.parsedPath ? 'Parsed' : 'Uploaded'}
                          </Badge>
                          {doc.parsedPath && !doc.parsedPath.endsWith('.error.json') && (
                            <Button variant="outline" size="sm" onClick={() => setSelectedDocId(doc.id)}>
                              <Eye className="h-4 w-4 mr-1" /> View Parsed
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!documents || documents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No documents uploaded for this vendor response.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {evidenceOpen && (
        <EvidencePanel
          evidence={evidenceOpen}
          onClose={() => setEvidenceOpen(null)}
          title="Field Evidence"
        />
      )}
    </div>
  );
}