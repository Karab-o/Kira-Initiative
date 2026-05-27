import { cn } from '../../lib/cn.js';

const variants = {
  primary: 'bg-sage-500 hover:bg-sage-600 text-white shadow-green',
  soft:    'bg-sage-100 hover:bg-sage-200 text-sage-600',
  ghost:   'bg-transparent border-[1.5px] border-[#E5DDD7] hover:border-sage-300 hover:bg-sage-50 text-coal',
  danger:  'bg-care-red hover:opacity-90 text-white',
  // legacy dark variants
  ember:   'bg-ember-500 hover:bg-ember-600 text-white shadow-ember',
  ink:     'bg-ink-700 hover:bg-ink-600 text-white border border-mint-300/10',
  mint:    'bg-mint-500 hover:bg-mint-600 text-white',
};

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-5 py-3 text-[15px] rounded-xl',
  lg: 'px-6 py-3.5 text-[15px] rounded-xl',
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
        'inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
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
