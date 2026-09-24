import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from '@/utils/formatting';
export const Select = forwardRef(({ className, ...props }, ref) => {
    return (_jsx("select", { className: cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className), ref: ref, ...props }));
});
Select.displayName = 'Select';
//# sourceMappingURL=select.js.map