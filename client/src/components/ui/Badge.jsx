import { cn } from '../../lib/cn.js';

const tones = {
  mint:   'bg-mint-300/15 text-mint-200 border-mint-300/25',
  ember:  'bg-ember-500/15 text-ember-200 border-ember-400/30',
  green:  'bg-care-green-bg text-care-green border-care-green/30',
  amber:  'bg-care-amber-bg text-care-amber border-care-amber/30',
  red:    'bg-care-red-bg text-care-red border-care-red/30',
  critical: 'bg-care-critical/15 text-care-critical border-care-critical/40',
  neutral:'bg-ink-700 text-muted-fg border-mint-300/10',
};

export default function Badge({ tone = 'neutral', children, className, dot = false }) {
  return (
    <span className={cn('pill border', tones[tone] || tones.neutral, className)}>
      {dot && <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        tone === 'mint' && 'bg-mint-300',
        tone === 'ember' && 'bg-ember-400',
        tone === 'green' && 'bg-care-green',
        tone === 'amber' && 'bg-care-amber',
        tone === 'red' && 'bg-care-red',
        tone === 'critical' && 'bg-care-critical',
        tone === 'neutral' && 'bg-muted-fg',
      )} />}
      {children}
    </span>
  );
}
