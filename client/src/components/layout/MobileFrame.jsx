import { cn } from '../../lib/cn.js';

export default function MobileFrame({ className, children }) {
  return (
    <div className="min-h-screen flex justify-center md:bg-sage-50 md:py-8">
      <div
        className={cn(
          'w-full max-w-md min-h-screen md:min-h-[90vh] md:max-h-[90vh] md:rounded-3xl',
          'bg-white md:border md:border-[#E5DDD7] md:shadow-elevated',
          'relative overflow-hidden flex flex-col',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
