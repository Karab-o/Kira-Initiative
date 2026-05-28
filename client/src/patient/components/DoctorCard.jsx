import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../lib/cn.js';

export default function DoctorCard({ doctor, selected, onSelect }) {
  const initials = doctor.fullName.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase();
  return (
    <button
      onClick={() => onSelect?.(doctor)}
      className={cn(
        'w-full text-left card !p-4 flex items-center gap-3 transition',
        selected
          ? 'border-sage-400 shadow-green'
          : 'hover:border-sage-200 hover:shadow-soft',
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center text-white font-display text-lg flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-coal truncate">{doctor.fullName}</p>
        <p className="text-xs text-coal-muted truncate">{doctor.specialty} · {doctor.hospital?.name}</p>
      </div>
      <Badge tone={doctor.isOnline ? 'green' : 'neutral'} dot>
        {doctor.isOnline ? 'Online' : 'Offline'}
      </Badge>
    </button>
  );
}
