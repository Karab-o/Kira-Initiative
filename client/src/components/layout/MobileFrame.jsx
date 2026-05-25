import { cn } from '../../lib/cn.js';

// Mobile-first centered frame for the patient app.
// Renders edge-to-edge on phones, contained card on desktop.
export default function MobileFrame({ className, children }) {
  return (
    <div className="min-h-screen flex justify-center md:py-8">
      <div
        className={cn(
          'w-full max-w-md min-h-screen md:min-h-[90vh] md:max-h-[90vh] md:rounded-3xl',
          'bg-ink-900 md:border md:border-mint-300/10 md:shadow-card',
          'relative overflow-hidden flex flex-col',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
