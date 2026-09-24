import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useRfxList } from '@/frontend/lib/api';
import { ComparisonWorkspace } from '@/frontend/features/workspace/ComparisonWorkspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { LayoutDashboard, MessageSquare } from 'lucide-react';
export function App() {
    const { data: rfxList, isLoading } = useRfxList();
    const [activeRfxId, setActiveRfxId] = useState(rfxList?.[0]?.id || null);
    const [activeTab, setActiveTab] = useState('workspace');
    if (isLoading)
        return _jsx("div", { className: "p-8 text-center", children: "Loading..." });
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx("header", { className: "border-b bg-card px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h1", { className: "text-xl font-bold", children: "Aerchain Quote Intelligence" }), _jsx(Tabs, { value: activeRfxId || '', onValueChange: setActiveRfxId, className: "w-80", children: _jsx(TabsList, { children: rfxList?.map(rfx => (_jsx(TabsTrigger, { value: rfx.id, children: rfx.name }, rfx.id))) }) })] }), _jsx("div", { className: "flex items-center gap-2", children: activeRfxId && (_jsx(Tabs, { value: activeTab, onValueChange: setActiveTab, children: _jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "workspace", children: [_jsx(LayoutDashboard, { className: "mr-2 h-4 w-4" }), "Workspace"] }), _jsxs(TabsTrigger, { value: "analyst", children: [_jsx(MessageSquare, { className: "mr-2 h-4 w-4" }), "Analyst"] })] }) })) })] }) }), _jsxs("main", { className: "p-6", children: [activeRfxId && activeTab === 'workspace' && _jsx(ComparisonWorkspace, { rfxId: activeRfxId }), activeRfxId && activeTab === 'analyst' && _jsx(AnalystPanel, { rfxId: activeRfxId }), !activeRfxId && (_jsxs(Card, { className: "max-w-2xl mx-auto", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Select an RFx to begin" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-muted-foreground", children: "No RFx selected. Choose one from the header dropdown." }) })] }))] })] }));
}
function AnalystPanel({ rfxId }) {
    return (_jsxs(Card, { className: "h-[calc(100vh-200px)] flex flex-col", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Procurement Analyst" }) }), _jsx(CardContent, { className: "flex-1 p-0", children: _jsxs("div", { className: "p-6 text-center text-muted-foreground", children: [_jsx(MessageSquare, { className: "mx-auto h-12 w-12 mb-4 opacity-50" }), _jsx("p", { children: "Analyst chat interface coming soon" }), _jsxs("p", { className: "text-sm", children: ["RFx: ", rfxId] })] }) })] }));
}
//# sourceMappingURL=App.js.map