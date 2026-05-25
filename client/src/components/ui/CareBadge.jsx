import Badge from './Badge.jsx';

const LABELS = {
  green: 'Handle at home',
  amber: 'Consider seeing a doctor',
  red:   'See a doctor today',
  critical: 'Urgent — get help',
};

export default function CareBadge({ severity, text, className }) {
  const tone = severity || 'green';
  return (
    <Badge tone={tone} dot className={className}>
      {text || LABELS[severity] || LABELS.green}
    </Badge>
  );
}
