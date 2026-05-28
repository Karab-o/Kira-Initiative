import { cn } from '../../lib/cn.js';

const AREAS = [
  { id: 'face', label: 'Face' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'mouth', label: 'Mouth' },
  { id: 'neck', label: 'Neck' },
];

export default function BodyAreaGuide({ className }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5', className)}>
      {AREAS.map((a) => (
        <div key={a.id} className="card-soft !p-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sage-100 border border-sage-200 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-coal">{a.label}</span>
        </div>
      ))}
    </div>
  );
}
