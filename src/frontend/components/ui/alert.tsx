import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/formatting';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './button';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
        {
          'bg-destructive/10 text-destructive border-destructive': variant === 'destructive',
          'bg-muted/50': variant === 'default',
        },
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed [&_p]:not-last:mb-2', className)}
      {...props}
    />
  )
);
AlertDescription.displayName = 'AlertDescription';