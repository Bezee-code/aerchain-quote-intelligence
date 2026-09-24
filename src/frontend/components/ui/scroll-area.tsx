import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/formatting';

export const ScrollArea = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('overflow-auto scrollbar-thin', className)}
      {...props}
    />
  )
);
ScrollArea.displayName = 'ScrollArea';