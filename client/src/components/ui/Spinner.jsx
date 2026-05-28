import { cn } from '../../lib/cn.js';

export default function Spinner({ size = 16, className }) {
  return (
    <span
      className={cn('inline-block border-2 border-sage-200 border-t-sage-500 rounded-full animate-spin', className)}
      style={{ width: size, height: size }}
    />
  );
}
