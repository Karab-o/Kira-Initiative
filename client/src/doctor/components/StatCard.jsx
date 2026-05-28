import { cn } from '../../lib/cn.js';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'sage' }) {
  const toneClass = {
    sage:  'text-sage-500 bg-sage-100 border-sage-200',
    ember: 'text-care-amber bg-care-amber-bg border-care-amber/30',
    amber: 'text-care-amber bg-care-amber-bg border-care-amber/30',
    red:   'text-care-red bg-care-red-bg border-care-red/30',
    green: 'text-care-green bg-care-green/10 border-care-green/30',
  }[tone] ?? 'text-sage-500 bg-sage-100 border-sage-200';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-mono text-coal-muted">{label}</p>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center', toneClass)}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <p className="font-display text-3xl text-coal leading-none">{value}</p>
      {hint && <p className="text-xs text-coal-muted mt-2">{hint}</p>}
    </div>
  );
}
