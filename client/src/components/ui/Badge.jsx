import { cn } from '../../lib/cn.js';

const tones = {
  sage:     'bg-sage-100 text-sage-600 border-sage-200',
  green:    'bg-care-green-bg text-care-green border-care-green/30',
  amber:    'bg-care-amber-bg text-care-amber border-care-amber/30',
  red:      'bg-care-red-bg text-care-red border-care-red/30',
  critical: 'bg-care-critical/10 text-care-critical border-care-critical/30',
  neutral:  'bg-surface-muted text-coal-muted border-[#E5DDD7]',
  // legacy dark
  mint:     'bg-mint-300/15 text-mint-200 border-mint-300/25',
  ember:    'bg-ember-500/15 text-ember-200 border-ember-400/30',
};

const dotColors = {
  sage:     'bg-sage-400',
  green:    'bg-care-green',
  amber:    'bg-care-amber',
  red:      'bg-care-red',
  critical: 'bg-care-critical',
  neutral:  'bg-coal-muted',
  mint:     'bg-mint-300',
  ember:    'bg-ember-400',
};

export default function Badge({ tone = 'neutral', children, className, dot = false }) {
  return (
    <span className={cn('pill border', tones[tone] || tones.neutral, className)}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[tone] || dotColors.neutral)} />
      )}
      {children}
    </span>
  );
}
