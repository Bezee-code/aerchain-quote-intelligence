import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useVendorResponses,
  useLoadDemoResponses,
  useUploadAndProcessVendorResponse,
  useReprocessVendorResponse,
  useDeleteVendorResponse,
  useResetRFx,
  VendorResponseSummary,
} from '@/frontend/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/frontend/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/frontend/components/ui/table';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Input } from '@/frontend/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/frontend/components/ui/alert';
import { formatStatus } from '@/frontend/utils/extractionDisplay';
import {
  UploadCloud,
  RotateCcw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  FileSpreadsheet,
  FileImage,
  Mail,
  Trash2,
  Plus,
} from 'lucide-react';

interface VendorResponsesProps {
  rfxId: string;
}

export function VendorResponses({ rfxId }: VendorResponsesProps) {
  const navigate = useNavigate();
  const { data: responses, isLoading, error, refetch } = useVendorResponses(rfxId);
  const loadDemoMutation = useLoadDemoResponses();
  const uploadMutation = useUploadAndProcessVendorResponse();
  const reprocessMutation = useReprocessVendorResponse();
  const deleteMutation = useDeleteVendorResponse();
  const resetMutation = useResetRFx();

  // Modals & Banner state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadVendorId, setUploadVendorId] = useState<string>('');
  const [customVendorName, setCustomVendorName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docModalVendor, setDocModalVendor] = useState<VendorResponseSummary | null>(null);
  const [demoBanner, setDemoBanner] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isProcessingDemo, setIsProcessingDemo] = useState(false);

  const handleLoadDemo = async (force = false) => {
    setIsProcessingDemo(true);
    setDemoBanner(null);
    try {
      const result = await loadDemoMutation.mutateAsync({ rfxId, force });
      if (result.alreadyProcessed) {
        setDemoBanner({
          type: 'info',
          message: 'All 5 demo vendor responses have already been loaded and extracted. Click "Force Reprocess All" if you wish to run the pipeline again.',
        });
      } else if (result.inProgress || result.status === 'processing') {
        setDemoBanner({
          type: 'info',
          message: 'Demo ingestion started! The 5 vendor quotation documents are being parsed and extracted with Gemini in the background. This page will update automatically as each vendor completes.',
        });
      } else {
        setDemoBanner({
          type: 'success',
          message: 'All 5 demo responses were successfully processed through the real Gemini extraction and normalization pipeline!',
        });
      }
      await refetch();
    } catch (err: any) {
      setDemoBanner({
        type: 'error',
        message: `Failed to load demo responses: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsProcessingDemo(false);
    }
  };

  const handleResetToCleanSlate = async () => {
    if (!confirm('Are you sure you want to purge all processed quotation data and reset to a clean slate (0 vendors)?')) return;
    try {
      await resetMutation.mutateAsync(rfxId);
      setDemoBanner({
        type: 'info',
        message: 'Quotation data has been cleared. The workspace is now in a clean slate with 0 vendor quotations.',
      });
      await refetch();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync({
        rfxId,
        vendorResponseId: uploadVendorId || undefined,
        vendorName: customVendorName || undefined,
        file: selectedFile,
      });
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadVendorId('');
      setCustomVendorName('');
      await refetch();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to remove quotation submission for "${vendorName}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ rfxId, vendorResponseId: vendorId });
      await refetch();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleReprocessSingle = async (vendorId: string) => {
    try {
      await reprocessMutation.mutateAsync(vendorId);
      await refetch();
    } catch (err: any) {
      alert(`Reprocessing failed: ${err.message}`);
    }
  };

  const openNewUploadModal = () => {
    setUploadVendorId('');
    setCustomVendorName('');
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const openReplaceUploadModal = (vendor: VendorResponseSummary) => {
    setUploadVendorId(vendor.id);
    setCustomVendorName(vendor.vendorName);
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const getFormatIcon = (format: string) => {
    switch (format.toUpperCase()) {
      case 'XLSX':
      case 'CSV':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600 inline mr-1.5" />;
      case 'PDF':
        return <FileText className="h-4 w-4 text-red-600 inline mr-1.5" />;
      case 'DOCX':
        return <FileText className="h-4 w-4 text-blue-600 inline mr-1.5" />;
      case 'PNG':
      case 'JPG':
      case 'JPEG':
        return <FileImage className="h-4 w-4 text-purple-600 inline mr-1.5" />;
      case 'EML':
        return <Mail className="h-4 w-4 text-amber-600 inline mr-1.5" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading vendor responses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Responses</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const vendorsList = responses || [];
  const processedCount = vendorsList.filter(
    (v) => v.status === 'ready' || v.status === 'review_required' || v.status === 'extracted'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendor Responses</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload supplier quotation documents, inspect automated AI extraction status, and manage the vendor roster.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {vendorsList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToCleanSlate}
              disabled={resetMutation.isPending || isProcessingDemo}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              title="Purge all processed quotation data and return to clean slate (0 vendors)"
            >
              <Trash2 className="h-4 w-4" />
              Reset to Clean Slate
            </Button>
          )}

          <Button
            onClick={openNewUploadModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Upload Quotation Document
          </Button>

          <Button
            variant="outline"
            onClick={() => handleLoadDemo(false)}
            disabled={isProcessingDemo}
            className="flex items-center gap-2"
          >
            {isProcessingDemo ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Processing Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                Load Demo Responses
              </>
            )}
          </Button>

          {processedCount > 0 && (
            <Button
              onClick={() => navigate(`/rfx/${rfxId}/workspace`)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              Compare Quotes
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Info / Status Notification Banner */}
      {demoBanner && (
        <Alert
          className={
            demoBanner.type === 'success'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
              : demoBanner.type === 'info'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
              : 'border-destructive bg-destructive/10'
          }
        >
          {demoBanner.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : demoBanner.type === 'info' ? (
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <AlertTitle className="font-semibold">
            {demoBanner.type === 'success'
              ? 'Pipeline Completed'
              : demoBanner.type === 'info'
              ? 'Status Update'
              : 'Pipeline Error'}
          </AlertTitle>
          <AlertDescription className="mt-1 flex items-center justify-between">
            <span>{demoBanner.message}</span>
            {demoBanner.type === 'info' && demoBanner.message.includes('already been loaded') && (
              <Button
                size="sm"
                variant="outline"
                className="ml-4 h-7 text-xs bg-background"
                onClick={() => handleLoadDemo(true)}
                disabled={isProcessingDemo}
              >
                Force Reprocess All
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Pipeline In-Progress Banner */}
      {isProcessingDemo && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Real Gemini Extraction Pipeline in Progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Executing ingestion → multi-format parsing (Excel, PDF, Word, OCR, Email) → Gemini structured extraction → matching line items → evidence mapping → currency & unit normalization.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Vendor Responses Table or Clean Empty State */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Response Roster</CardTitle>
              <CardDescription>
                {vendorsList.length === 0
                  ? '0 vendor submissions uploaded. Upload a document to start.'
                  : `${processedCount} of ${vendorsList.length} vendor submissions processed`}
              </CardDescription>
            </div>
            {processedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 flex items-center gap-1.5"
                onClick={() => navigate(`/rfx/${rfxId}/workspace`)}
              >
                <span>View Comparison Matrix</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vendorsList.length === 0 ? (
            /* Clean Empty State */
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl m-6 bg-muted/15">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-1">No Vendor Quotations Uploaded Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                Upload your first quotation file (Excel, PDF, Word, Image OCR, or Email). Aerchain AI will extract the vendor company name and quote line items automatically.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={openNewUploadModal}
                  className="flex items-center gap-2 bg-primary text-primary-foreground shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Upload First Vendor Quotation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleLoadDemo(false)}
                  disabled={isProcessingDemo}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Load 5 Demo Quotations
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-72">Vendor</TableHead>
                      <TableHead className="w-36">Status</TableHead>
                      <TableHead className="w-40">Response Format</TableHead>
                      <TableHead className="w-36 text-center">Coverage</TableHead>
                      <TableHead className="w-36 text-center">Exceptions</TableHead>
                      <TableHead className="w-56 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorsList.map((vendor) => {
                      const statusInfo = formatStatus(vendor.status);
                      const isProcessed =
                        vendor.status === 'ready' ||
                        vendor.status === 'review_required' ||
                        vendor.status === 'extracted';
                      const isProcessing = ['uploading', 'parsing', 'extracting', 'validating', 'processing'].includes(
                        vendor.status
                      );

                      return (
                        <TableRow key={vendor.id} className="hover:bg-muted/40 transition-colors">
                          {/* Vendor Column */}
                          <TableCell>
                            <div>
                              <p className="font-semibold text-sm">{vendor.vendorName}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">{vendor.id}</p>
                            </div>
                          </TableCell>

                          {/* Status Column */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                              <Badge variant={statusInfo.variant} className="capitalize">
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </TableCell>

                          {/* Response Format Column */}
                          <TableCell>
                            {vendor.responseFormat !== '—' ? (
                              <div className="flex items-center text-sm font-medium">
                                {getFormatIcon(vendor.responseFormat)}
                                <span>.{vendor.responseFormat.toLowerCase()}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>

                          {/* Coverage Column */}
                          <TableCell className="text-center font-medium">
                            {isProcessed ? (
                              <span
                                className={
                                  vendor.coverage.quotedCount === vendor.coverage.totalCount
                                    ? 'text-foreground'
                                    : 'text-amber-600 dark:text-amber-400'
                                }
                              >
                                {vendor.coverage.quotedCount} / {vendor.coverage.totalCount}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Exceptions Column */}
                          <TableCell className="text-center">
                            {isProcessed ? (
                              vendor.exceptionsCount > 0 ? (
                                <Badge variant="warning" className="text-xs">
                                  {vendor.exceptionsCount} {vendor.exceptionsCount === 1 ? 'flag' : 'flags'}
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-xs">
                                  Clean
                                </Badge>
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>

                          {/* Actions Column */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Review Action */}
                              {isProcessed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-medium"
                                  onClick={() =>
                                    navigate(`/rfx/${rfxId}/review?vendorResponseId=${vendor.id}`)
                                  }
                                >
                                  Review
                                </Button>
                              )}

                              {/* View Document Action */}
                              {vendor.document && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => setDocModalVendor(vendor)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  Doc
                                </Button>
                              )}

                              {/* Reprocess Action */}
                              {isProcessed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                  title="Reprocess submission through extraction pipeline"
                                  onClick={() => handleReprocessSingle(vendor.id)}
                                  disabled={reprocessMutation.isPending}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}

                              {/* Replace Action */}
                              {!isProcessing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => openReplaceUploadModal(vendor)}
                                  title="Replace with a new document"
                                >
                                  <UploadCloud className="h-3.5 w-3.5 mr-1" />
                                  Replace
                                </Button>
                              )}

                              {/* Delete Action */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Delete this vendor quotation"
                                onClick={() => handleDeleteVendor(vendor.id, vendor.vendorName)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Dynamic Plus Button to Add Another Vendor Quotation */}
              <div className="p-4 border-t bg-muted/10 flex items-center justify-center">
                <Button
                  variant="outline"
                  onClick={openNewUploadModal}
                  className="w-full max-w-md border-dashed border-2 flex items-center justify-center gap-2 py-5 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Upload Another Vendor Quotation</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Details Modal Dialog */}
      {docModalVendor && docModalVendor.document && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <Card className="max-w-md w-full shadow-2xl border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Document Details</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setDocModalVendor(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Vendor</span>
                <span className="font-medium">{docModalVendor.vendorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">File Name</span>
                <span className="font-mono text-xs break-all">{docModalVendor.document.fileName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">MIME Type</span>
                <span className="font-mono text-xs">{docModalVendor.document.mimeType}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Uploaded At</span>
                <span>{new Date(docModalVendor.document.uploadedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Disqualification / Feasibility</span>
                {docModalVendor.isEligible === false ? (
                  <div className="mt-1">
                    <Badge variant="destructive" className="mb-1">Disqualified</Badge>
                    <ul className="text-xs text-destructive space-y-0.5 mt-1 list-disc pl-4">
                      {docModalVendor.disqualificationReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Badge variant="success" className="mt-1">Eligible Supplier</Badge>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDocModalVendor(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const id = docModalVendor.id;
                    setDocModalVendor(null);
                    navigate(`/rfx/${rfxId}/review?vendorResponseId=${id}`);
                  }}
                >
                  Inspect in Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dynamic Upload Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <Card className="max-w-lg w-full shadow-2xl border">
            <form onSubmit={handleUploadSubmit}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {uploadVendorId ? 'Replace Vendor Quotation' : 'Upload Vendor Quotation'}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {uploadVendorId
                      ? 'Upload a replacement quotation document for this supplier.'
                      : 'Upload an XLSX, PDF, DOCX, PNG, or EML quotation. Aerchain AI extracts the vendor name automatically.'}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowUploadModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Quotation Document <span className="text-destructive">*</span></label>
                  <Input
                    type="file"
                    accept=".xlsx,.pdf,.docx,.png,.jpg,.jpeg,.eml"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Accepted formats: Excel (.xlsx), PDF (.pdf), Word (.docx), Scanned Image OCR (.png, .jpg), Email (.eml)
                  </p>
                </div>

                {!uploadVendorId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Vendor / Entity Name (Optional)</label>
                    <Input
                      type="text"
                      placeholder="Auto-detect from document header (or type name)"
                      value={customVendorName}
                      onChange={(e) => setCustomVendorName(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Leave blank to let AI detect and extract the company name directly from the letterhead/header.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-md border text-xs space-y-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    📁 Quick Test Fixtures on this machine:
                  </span>
                  <div className="font-mono text-[11px] text-foreground bg-background p-1.5 rounded border select-all overflow-x-auto">
                    demo\fixtures\vendors\
                  </div>
                  <div className="grid grid-cols-1 gap-0.5 text-[11px] text-muted-foreground pt-1">
                    <div>• <strong>vendor-a.xlsx</strong>: Apex Packaging Solutions (Excel Rate Sheet)</div>
                    <div>• <strong>vendor-b.pdf</strong>: PackRight Corrugators (PDF Quote)</div>
                    <div>• <strong>vendor-c.docx</strong>: EcoKraft Paper & Packaging (Word Document)</div>
                    <div>• <strong>vendor-d.png</strong>: Vardhman Cartons (Scanned OCR Image)</div>
                    <div>• <strong>vendor-e.eml</strong>: Global Star Packaging (Email Quotation)</div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading & Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Upload & Extract
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
