import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from '@/utils/formatting';
export const Tabs = forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex flex-col gap-4', className), ...props })));
Tabs.displayName = 'Tabs';
export const TabsList = forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className), ...props })));
TabsList.displayName = 'TabsList';
export const TabsTrigger = forwardRef(({ className, value, children, ...props }, ref) => (_jsx("button", { ref: ref, className: cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm', className), ...props, children: children })));
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = forwardRef(({ className, value, children, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className), ...props, children: children })));
TabsContent.displayName = 'TabsContent';
//# sourceMappingURL=tabs.js.map