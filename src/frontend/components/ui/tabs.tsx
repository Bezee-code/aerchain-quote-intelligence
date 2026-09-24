import React, { createContext, useContext, forwardRef } from 'react';
import { cn } from '@/utils/formatting';

interface TabsContextValue {
  value?: string;
  onValueChange?: (val: string) => void;
}

const TabsContext = createContext<TabsContextValue>({});

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, defaultValue, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const activeValue = value !== undefined ? value : internalValue;

    const handleValueChange = (newVal: string) => {
      if (value === undefined) {
        setInternalValue(newVal);
      }
      onValueChange?.(newVal);
    };

    return (
      <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export const TabsList = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, onClick, ...props }, ref) => {
    const context = useContext(TabsContext);
    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3.5 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          isActive
            ? 'bg-background text-foreground shadow-sm font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
          className
        )}
        onClick={(e) => {
          onClick?.(e);
          context.onValueChange?.(value);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (context.value !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

