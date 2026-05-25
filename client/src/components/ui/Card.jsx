import { cn } from '../../lib/cn.js';

export default function Card({ className, children, padded = true, ...rest }) {
  return (
    <div
      className={cn(
        'card-ink',
        padded && 'p-5 md:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
