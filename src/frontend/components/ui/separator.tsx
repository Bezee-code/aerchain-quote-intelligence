import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/formatting';

export const Separator = forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        'shrink-0 border-border',
        orientation === 'horizontal' ? 'w-full' : 'h-full',
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = 'Separator';