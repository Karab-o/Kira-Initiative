import Badge from '../../components/ui/Badge.jsx';

const MAP = {
  green: { tone: 'green', label: 'Routine' },
  amber: { tone: 'amber', label: 'Watch' },
  red:   { tone: 'red',   label: 'Urgent' },
  low: { tone: 'green', label: 'Low' },
  medium: { tone: 'amber', label: 'Medium' },
  high: { tone: 'red', label: 'High' },
  critical: { tone: 'critical', label: 'Critical' },
};

export default function RiskBadge({ value }) {
  const m = MAP[value] || { tone: 'neutral', label: value || '—' };
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}
