import { useState } from 'react';
import { cn } from '@/utils/formatting';
import { Badge } from '@/frontend/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { FileText, Eye, Copy } from 'lucide-react';
import { Button } from '@/frontend/components/ui/button';

interface EvidencePanelProps {
  evidence: {
    field: string;
    text: string;
    pageNumber?: number;
    bbox?: [number, number, number, number];
    sourceDocId?: string;
  }[];
  onClose: () => void;
  title?: string;
}

export function EvidencePanel({ evidence, onClose, title = 'Source Evidence' }: EvidencePanelProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidencePanelProps['evidence'][0] | null>(null);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No evidence available for this field.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b p-4">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
          <div className="flex flex-col gap-4 overflow-y-auto flex-1">
            {evidence.map((ev, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="capitalize">{ev.field}</Badge>
                      {ev.pageNumber !== undefined && (
                        <Badge variant="secondary">Page {ev.pageNumber}</Badge>
                      )}
                      {ev.sourceDocId && (
                        <Badge variant="secondary" className="font-mono text-xs">{ev.sourceDocId.slice(0, 12)}...</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-mono whitespace-pre-wrap break-all text-foreground/90">{ev.text}</p>
                    {ev.bbox && (
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        BBox: [{ev.bbox.map(v => v.toFixed(2)).join(', ')}]
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvidence(ev)}
                    className="shrink-0"
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {selectedEvidence && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                  <CardTitle className="text-lg">Evidence Detail</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEvidence(null)}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="capitalize">{selectedEvidence.field}</Badge>
                      {selectedEvidence.pageNumber !== undefined && (
                        <Badge variant="secondary">Page {selectedEvidence.pageNumber}</Badge>
                      )}
                      {selectedEvidence.sourceDocId && (
                        <Badge variant="secondary" className="font-mono text-xs">{selectedEvidence.sourceDocId}</Badge>
                      )}
                    </div>
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="text-sm font-mono whitespace-pre-wrap break-all">{selectedEvidence.text}</p>
                    </div>
                    {selectedEvidence.bbox && (
                      <div className="p-4 bg-muted rounded-lg border">
                        <p className="text-xs text-muted-foreground font-mono">
                          BBox: [{selectedEvidence.bbox.map(v => v.toFixed(2)).join(', ')}]
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => setSelectedEvidence(null)}>Close</Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}