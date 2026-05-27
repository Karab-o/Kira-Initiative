import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const base = 'w-full bg-white border-[1.5px] border-[#E5DDD7] rounded-xl px-4 py-3 text-coal text-[15px] placeholder:text-coal-subtle focus:outline-none focus:ring-2 focus:ring-sage-300/40 focus:border-sage-300 transition';
const errCls = '!border-care-red/60 focus:!ring-care-red/30 focus:!border-care-red/60';

export const Input = forwardRef(function Input({ className, label, hint, error, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-[13px] font-semibold text-coal-light mb-1.5">{label}</span>}
      <input ref={ref} className={cn(base, error && errCls, className)} {...rest} />
      {hint && !error && <span className="block text-[12px] text-coal-muted mt-1.5">{hint}</span>}
      {error && <span className="block text-[12px] text-care-red mt-1.5">{error}</span>}
    </label>
  );
});

export const TextArea = forwardRef(function TextArea({ className, label, hint, error, rows = 4, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-[13px] font-semibold text-coal-light mb-1.5">{label}</span>}
      <textarea ref={ref} rows={rows} className={cn(base, 'resize-y min-h-[88px]', error && errCls, className)} {...rest} />
      {hint && !error && <span className="block text-[12px] text-coal-muted mt-1.5">{hint}</span>}
      {error && <span className="block text-[12px] text-care-red mt-1.5">{error}</span>}
    </label>
  );
});

export const Select = forwardRef(function Select({ className, label, hint, error, children, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-[13px] font-semibold text-coal-light mb-1.5">{label}</span>}
      <select ref={ref} className={cn(base, 'appearance-none pr-9 cursor-pointer', error && errCls, className)} {...rest}>
        {children}
      </select>
      {hint && !error && <span className="block text-[12px] text-coal-muted mt-1.5">{hint}</span>}
      {error && <span className="block text-[12px] text-care-red mt-1.5">{error}</span>}
    </label>
  );
});
