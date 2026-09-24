export function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
export function now() {
    return new Date().toISOString();
}
//# sourceMappingURL=utils.js.map