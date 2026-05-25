import { cn } from '../../lib/cn.js';

export default function Spinner({ size = 16, className }) {
  return (
    <span
      className={cn('inline-block border-2 border-mint-300/25 border-t-mint-300 rounded-full animate-spin', className)}
      style={{ width: size, height: size }}
    />
  );
}
