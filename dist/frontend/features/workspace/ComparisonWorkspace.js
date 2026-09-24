import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useComparison, useOverrideExtraction, useReviewExtraction } from '@/frontend/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/frontend/components/ui/table';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Input } from '@/frontend/components/ui/input';
import { formatCurrency } from '@/utils/currency';
import { formatPercent, formatNumber } from '@/utils/formatting';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/utils/formatting';
export function ComparisonWorkspace({ rfxId }) {
    const [feasibleOnly, setFeasibleOnly] = useState(false);
    const { data: comparison, isLoading, error, refetch } = useComparison(rfxId, feasibleOnly);
    const overrideMutation = useOverrideExtraction();
    const reviewMutation = useReviewExtraction();
    const [expandedRow, setExpandedRow] = useState(null);
    if (isLoading)
        return _jsx("div", { className: "p-8 text-center", children: "Loading comparison..." });
    if (error)
        return _jsxs("div", { className: "p-8 text-center text-destructive", children: ["Error: ", error.message] });
    if (!comparison || comparison.length === 0)
        return _jsx("div", { className: "p-8 text-center", children: "No comparison data" });
    const vendors = comparison[0]?.quotations?.map(q => q.vendorName) || [];
    const vendorIds = comparison[0]?.quotations?.map(q => q.vendorId) || [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Comparison Workspace" }), _jsxs("p", { className: "text-muted-foreground", children: [comparison.length, " line items \u00D7 ", vendors.length, " vendors"] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: feasibleOnly, onChange: e => setFeasibleOnly(e.target.checked), className: "rounded border-input" }), _jsx("span", { className: "text-sm", children: "Feasible vendors only" })] }), _jsx(Button, { onClick: () => refetch(), variant: "outline", children: "Refresh" })] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-48", children: "Line Item" }), _jsx(TableHead, { className: "w-24", children: "Qty" }), _jsx(TableHead, { className: "w-24", children: "Unit" }), _jsx(TableHead, { className: "w-24", children: "Category" }), vendors.map((vendor, i) => (_jsxs(TableHead, { className: "w-48 text-center", children: [vendor, comparison[0]?.quotations?.[i]?.isFeasible === false && (_jsx(Badge, { variant: "destructive", className: "ml-1", children: "Ineligible" }))] }, vendorIds[i]))), _jsx(TableHead, { className: "w-48 text-center", children: "Cheapest" }), _jsx(TableHead, { className: "w-32", children: "Flags" })] }) }), _jsx(TableBody, { children: comparison.map(item => (_jsx(ComparisonRow, { item: item, vendors: vendors, vendorIds: vendorIds, expanded: expandedRow === item.rfxLineItem.id, onToggle: () => setExpandedRow(expandedRow === item.rfxLineItem.id ? null : item.rfxLineItem.id), onOverride: overrideMutation.mutateAsync, onReview: reviewMutation.mutateAsync }, item.rfxLineItem.id))) })] }) }) }) })] }));
}
function ComparisonRow({ item, vendors, vendorIds, expanded, onToggle, onOverride, onReview }) {
    const { rfxLineItem, quotations, cheapestVendorId } = item;
    return (_jsxs(_Fragment, { children: [_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: onToggle, className: "h-8 w-8 p-0", children: expanded ? _jsx(ChevronUp, { className: "h-4 w-4" }) : _jsx(ChevronDown, { className: "h-4 w-4" }) }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [rfxLineItem.lineNumber, ". ", rfxLineItem.description] }), _jsx("p", { className: "text-xs text-muted-foreground", children: rfxLineItem.specification })] })] }) }), _jsx(TableCell, { children: formatNumber(rfxLineItem.quantity) }), _jsx(TableCell, { children: rfxLineItem.unit }), _jsx(TableCell, { children: _jsx(Badge, { variant: "secondary", children: rfxLineItem.category }) }), quotations.map((q, i) => (_jsx(TableCell, { className: "text-center", children: _jsx(QuotationCell, { quotation: q, isCheapest: q.vendorId === cheapestVendorId, onOverride: onOverride, onReview: onReview }) }, vendorIds[i]))), _jsx(TableCell, { className: "text-center font-medium text-primary", children: cheapestVendorId ? vendors[vendorIds.indexOf(cheapestVendorId)] : '—' }), _jsx(TableCell, { children: _jsx("div", { className: "flex flex-wrap gap-1", children: Array.from(new Set(quotations.flatMap((q) => q.flags))).map(flag => (_jsx(Badge, { variant: getFlagVariant(flag), className: "text-xs", children: formatFlag(flag) }, flag))) }) })] }), expanded && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6 + vendors.length + 2, className: "p-0", children: _jsx("div", { className: "bg-muted/30 p-4 border-t", children: _jsx(ExpandedQuotationDetail, { quotations: quotations, vendors: vendors, vendorIds: vendorIds }) }) }) }))] }));
}
function QuotationCell({ quotation, isCheapest, onOverride, onReview }) {
    if (!quotation.pricePerBaseUnit) {
        return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("span", { className: "text-muted-foreground", children: "Not quoted" }), quotation.flags.includes('missing_price') && _jsx(HelpCircle, { className: "h-3 w-3 text-yellow-500" })] }));
    }
    const [editPrice, setEditPrice] = useState(false);
    const [newPrice, setNewPrice] = useState(quotation.pricePerBaseUnit.toString());
    const savePrice = async () => {
        const price = parseFloat(newPrice);
        if (!isNaN(price)) {
            await onOverride({ id: quotation.extractedLineId, override: { pricePerBaseUnit: price } });
        }
        setEditPrice(false);
    };
    if (editPrice) {
        return (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Input, { type: "number", step: "0.01", value: newPrice, onChange: e => setNewPrice(e.target.value), onBlur: () => savePrice(), onKeyDown: e => e.key === 'Enter' && savePrice(), className: "w-24", autoFocus: true }), _jsx(Button, { variant: "ghost", size: "icon", onClick: savePrice, children: _jsx(CheckCircle, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setEditPrice(false), children: _jsx(XCircle, { className: "h-4 w-4" }) })] }));
    }
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn('font-medium', isCheapest && 'text-primary'), children: formatCurrency(quotation.pricePerBaseUnit) }), isCheapest && _jsx(CheckCircle, { className: "h-3 w-3 text-primary" })] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [formatCurrency(quotation.totalPrice), " total"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Badge, { variant: quotation.confidence > 0.7 ? 'success' : quotation.confidence > 0.4 ? 'warning' : 'destructive', children: formatPercent(quotation.confidence) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => setEditPrice(true), children: _jsx(ChevronDown, { className: "h-3 w-3" }) })] }), quotation.flags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 justify-center", children: quotation.flags.map((flag) => (_jsx(Badge, { variant: getFlagVariant(flag), className: "text-[10px]", children: formatFlag(flag) }, flag))) }))] }));
}
function ExpandedQuotationDetail({ quotations, vendors, vendorIds }) {
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: quotations.map((q, i) => (_jsxs("div", { className: "border rounded-lg p-4 bg-background", children: [_jsx("h4", { className: "font-medium mb-2", children: vendors[i] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Raw Price: " }), q.rawPrice ? formatCurrency(q.rawPrice, q.rawCurrency) : '—'] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Normalized: " }), formatCurrency(q.pricePerBaseUnit), " / ", q.unit] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Total: " }), formatCurrency(q.totalPrice)] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Confidence: " }), formatPercent(q.confidence)] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Flags: " }), q.flags.length > 0 ? (q.flags.map((f) => _jsx(Badge, { variant: getFlagVariant(f), className: "mr-1", children: formatFlag(f) }, f))) : 'None'] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Evidence: " }), q.evidence.length, " spans"] })] })] }, vendorIds[i]))) }));
}
function getFlagVariant(flag) {
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
function formatFlag(flag) {
    return flag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
//# sourceMappingURL=ComparisonWorkspace.js.map