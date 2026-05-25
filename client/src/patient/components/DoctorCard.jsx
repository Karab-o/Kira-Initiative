import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../lib/cn.js';

export default function DoctorCard({ doctor, selected, onSelect }) {
  const initials = doctor.fullName.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase();
  return (
    <button
      onClick={() => onSelect?.(doctor)}
      className={cn(
        'w-full text-left card-ink !p-4 flex items-center gap-3 transition',
        selected ? 'border-mint-300/60 shadow-glow' : 'hover:border-mint-300/30',
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white font-display text-lg">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{doctor.fullName}</p>
        <p className="text-xs text-muted-fg truncate">{doctor.specialty} · {doctor.hospital?.name}</p>
      </div>
      <Badge tone={doctor.isOnline ? 'green' : 'neutral'} dot>
        {doctor.isOnline ? 'Online' : 'Offline'}
      </Badge>
    </button>
  );
}
