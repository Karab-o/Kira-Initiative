import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export default function AISummaryCard({ summary, className }) {
  if (!summary) return null;
  return (
    <div className={cn('card-ink !bg-mint-300/5 !border-mint-300/25', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-mint-300/15 border border-mint-300/30 flex items-center justify-center">
          <Sparkles size={14} className="text-mint-300" />
        </div>
        <p className="font-display text-lg">AI summary</p>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-fg">From anonymous session</span>
      </div>

      <div className="space-y-3 text-sm">
        {summary.chiefConcern && (
          <Field label="Chief concern" value={summary.chiefConcern} />
        )}
        {summary.duration && <Field label="Duration" value={summary.duration} />}
        {summary.keySymptoms?.length > 0 && (
          <Field label="Key symptoms" value={summary.keySymptoms.join(', ')} />
        )}
        {summary.selfReported && <Field label="Self-reported" value={summary.selfReported} />}
        {summary.aiNote && (
          <div className="pt-3 border-t border-mint-300/10">
            <p className="text-[11px] uppercase tracking-wider font-mono text-ember-400 mb-1">AI note</p>
            <p className="text-sm text-white leading-relaxed">{summary.aiNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider font-mono text-muted-fg mb-0.5">{label}</p>
      <p className="text-sm text-white leading-relaxed">{value}</p>
    </div>
  );
}
