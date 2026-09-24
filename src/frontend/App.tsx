import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { useRfxList, useComparison } from '@/frontend/lib/api';
import { ComparisonWorkspace } from '@/frontend/features/workspace/ComparisonWorkspace';
import { ExtractionReview } from '@/frontend/features/workspace/ExtractionReview';
import { VendorResponses } from '@/frontend/features/responses/VendorResponses';
import { ProcurementAnalyst } from '@/frontend/features/analyst/ProcurementAnalyst';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/components/ui/select';
import { LayoutDashboard, FileText, MessageSquare, ClipboardCheck, Loader2, Inbox } from 'lucide-react';

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const { data: rfxList, isLoading, error } = useRfxList();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current RFx and active section from pathname
  // Path format: /rfx/:rfxId/:section
  const rfxPathMatch = location.pathname.match(/^\/rfx\/([^/]+)(?:\/([^/]+))?/);
  const pathRfxId = rfxPathMatch ? rfxPathMatch[1] : null;
  const pathSection = rfxPathMatch && rfxPathMatch[2] ? rfxPathMatch[2] : 'workspace';

  // The active RFx is either from the path, or default to first available
  const hasRfxItems = Array.isArray(rfxList) && rfxList.length > 0;
  const currentRfxId = pathRfxId || (hasRfxItems ? rfxList[0].id : null);

  const handleRfxChange = (newRfxId: string) => {
    navigate(`/rfx/${newRfxId}/${pathSection}`);
  };

  const handleTabChange = (newSection: string) => {
    if (currentRfxId) {
      navigate(`/rfx/${currentRfxId}/${newSection}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4 sticky top-0 z-40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Aerchain Quote Intelligence</h1>
            </Link>

            {/* Header RFx Selector */}
            {isLoading ? (
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading RFx...</span>
              </div>
            ) : hasRfxItems ? (
              <Select value={currentRfxId || ''} onValueChange={handleRfxChange}>
                <SelectTrigger className="w-[320px] bg-background">
                  <SelectValue placeholder="Select RFx..." />
                </SelectTrigger>
                <SelectContent>
                  {rfxList.map((rfx) => (
                    <SelectItem key={rfx.id} value={rfx.id}>
                      {rfx.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {/* Section Navigation Tabs (Workspace, Responses, Analyst - Review removed) */}
          {currentRfxId && (
            <div className="flex items-center gap-2">
              <Tabs value={pathSection} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger
                    value="workspace"
                    onClick={() => handleTabChange('workspace')}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Workspace
                  </TabsTrigger>
                  <TabsTrigger
                    value="responses"
                    onClick={() => handleTabChange('responses')}
                  >
                    <Inbox className="mr-2 h-4 w-4" />
                    Responses
                  </TabsTrigger>
                  <TabsTrigger
                    value="analyst"
                    onClick={() => handleTabChange('analyst')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Analyst
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>
      </header>

      <main className="p-6">
        <Routes>
          {/* Root route: auto-select first RFx or show empty state */}
          <Route
            path="/"
            element={
              <HomeRoute
                isLoading={isLoading}
                error={error}
                rfxList={rfxList}
              />
            }
          />

          {/* Direct /rfx/:rfxId redirects to /rfx/:rfxId/workspace */}
          <Route
            path="/rfx/:rfxId"
            element={<RfxRedirect />}
          />

          {/* Workspace Route */}
          <Route
            path="/rfx/:rfxId/workspace"
            element={<WorkspaceWrapper />}
          />

          {/* Responses Route */}
          <Route
            path="/rfx/:rfxId/responses"
            element={<ResponsesWrapper />}
          />

          {/* Extraction Review Route */}
          <Route
            path="/rfx/:rfxId/review"
            element={<ReviewWrapper />}
          />

          {/* Analyst Route */}
          <Route
            path="/rfx/:rfxId/analyst"
            element={<AnalystWrapper />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function HomeRoute({
  isLoading,
  error,
  rfxList,
}: {
  isLoading: boolean;
  error: any;
  rfxList?: any[];
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Loading RFx events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-xl mx-auto mt-12 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to Load RFx</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error?.message || 'An error occurred while loading RFx data.'}</p>
        </CardContent>
      </Card>
    );
  }

  if (rfxList && rfxList.length > 0) {
    // Automatically redirect to the first available RFx
    return <Navigate to={`/rfx/${rfxList[0].id}/workspace`} replace />;
  }

  // Proper empty state when no RFx exists
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">No RFx Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            There are currently no RFx events in the system. Create or import an RFx to begin quote intelligence analysis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RfxRedirect() {
  const { rfxId } = useParams<{ rfxId: string }>();
  return <Navigate to={`/rfx/${rfxId}/workspace`} replace />;
}

function WorkspaceWrapper() {
  const { rfxId } = useParams<{ rfxId: string }>();
  if (!rfxId) return <Navigate to="/" replace />;
  return <ComparisonWorkspace rfxId={rfxId} />;
}

function ResponsesWrapper() {
  const { rfxId } = useParams<{ rfxId: string }>();
  if (!rfxId) return <Navigate to="/" replace />;
  return <VendorResponses rfxId={rfxId} />;
}

function ReviewWrapper() {
  const { rfxId } = useParams<{ rfxId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: comparison } = useComparison(rfxId || '', false);

  if (!rfxId) return <Navigate to="/" replace />;

  const quotations = comparison?.[0]?.quotations || [];
  const vendorResponseId = searchParams.get('vendorResponseId') || quotations[0]?.vendorId || 'vendor-001';

  // Vendor name lookup from comparison data or known defaults
  const vendorNameMap: Record<string, string> = {
    'vendor-001': 'Apex Packaging Solutions Pvt Ltd',
    'vendor-002': 'PackRight Corrugators Ltd',
    'vendor-003': 'EcoKraft Paper & Packaging LLP',
    'vendor-004': 'Vardhman Cartons & Containers',
    'vendor-005': 'Global Star Packaging International LLC',
  };

  const foundVendor = quotations.find((q) => q.vendorId === vendorResponseId);
  const vendorName = foundVendor?.vendorName || vendorNameMap[vendorResponseId] || 'Vendor Quotation';

  return (
    <div className="space-y-4">
      {quotations.length > 1 && (
        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
          <span className="text-sm font-medium">Vendor Response:</span>
          <Select
            value={vendorResponseId}
            onValueChange={(val) => setSearchParams({ vendorResponseId: val })}
          >
            <SelectTrigger className="w-[280px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quotations.map((q) => (
                <SelectItem key={q.vendorId} value={q.vendorId}>
                  {q.vendorName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <ExtractionReview vendorResponseId={vendorResponseId} vendorName={vendorName} />
    </div>
  );
}

function AnalystWrapper() {
  const { rfxId } = useParams<{ rfxId: string }>();
  if (!rfxId) return <Navigate to="/" replace />;
  return <ProcurementAnalyst rfxId={rfxId} />;
}