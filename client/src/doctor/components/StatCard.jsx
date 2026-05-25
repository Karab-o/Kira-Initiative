import { cn } from '../../lib/cn.js';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'mint' }) {
  const toneClass = {
    mint:  'text-mint-300 bg-mint-300/10 border-mint-300/20',
    ember: 'text-ember-400 bg-ember-500/10 border-ember-400/30',
    amber: 'text-care-amber bg-care-amber-bg border-care-amber/30',
    red:   'text-care-red bg-care-red-bg border-care-red/30',
  }[tone];

  return (
    <div className="card-ink">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-mono text-muted-fg">{label}</p>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center', toneClass)}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <p className="font-display text-3xl text-white leading-none">{value}</p>
      {hint && <p className="text-xs text-muted-fg mt-2">{hint}</p>}
    </div>
  );
}
