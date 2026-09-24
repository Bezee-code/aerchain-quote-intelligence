import { HTMLAttributes } from 'react';
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}
export declare const Badge: import("react").ForwardRefExoticComponent<BadgeProps & import("react").RefAttributes<HTMLSpanElement>>;
export {};
//# sourceMappingURL=badge.d.ts.map