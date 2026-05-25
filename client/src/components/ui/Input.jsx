import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export const Input = forwardRef(function Input({ className, label, hint, error, ...rest }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-muted-fg mb-1.5">{label}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'input-ink',
          error && 'border-care-red/60 focus:ring-care-red/40 focus:border-care-red/60',
          className,
        )}
        {...rest}
      />
      {hint && !error && <span className="block text-xs text-muted-fg/70 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-care-red mt-1.5">{error}</span>}
    </label>
  );
});

export const TextArea = forwardRef(function TextArea({ className, label, hint, error, rows = 4, ...rest }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-muted-fg mb-1.5">{label}</span>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'input-ink resize-y min-h-[88px]',
          error && 'border-care-red/60 focus:ring-care-red/40 focus:border-care-red/60',
          className,
        )}
        {...rest}
      />
      {hint && !error && <span className="block text-xs text-muted-fg/70 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-care-red mt-1.5">{error}</span>}
    </label>
  );
});

export const Select = forwardRef(function Select({ className, label, hint, error, children, ...rest }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-muted-fg mb-1.5">{label}</span>
      )}
      <select
        ref={ref}
        className={cn('input-ink appearance-none pr-9', className)}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && <span className="block text-xs text-muted-fg/70 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-care-red mt-1.5">{error}</span>}
    </label>
  );
});
