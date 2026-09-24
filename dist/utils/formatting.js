export function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined)
        return '—';
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
export function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
}
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
export function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
}
export function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
export function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}
export function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}
//# sourceMappingURL=formatting.js.map