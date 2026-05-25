import { cn } from '../../lib/cn.js';

const variants = {
  primary: 'bg-ember-500 hover:bg-ember-600 text-white shadow-ember',
  mint: 'bg-mint-500 hover:bg-mint-600 text-white shadow-card',
  ghost: 'bg-transparent border border-mint-300/25 hover:border-mint-300/50 hover:bg-mint-300/5 text-white',
  ink: 'bg-ink-700 hover:bg-ink-600 text-white border border-mint-300/10',
  danger: 'bg-care-red hover:opacity-90 text-white',
};

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-5 py-3 text-base rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading,
  disabled,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
