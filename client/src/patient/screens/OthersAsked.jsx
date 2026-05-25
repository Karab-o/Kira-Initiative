import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import CareBadge from '../../components/ui/CareBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { api, apiError } from '../../lib/api.js';
import { cn } from '../../lib/cn.js';

const TOPICS = [
  { id: '', label: 'All' },
  { id: 'sexual-health', label: 'Sexual' },
  { id: 'prostate-urology', label: 'Prostate' },
  { id: 'heart-hypertension', label: 'Heart' },
  { id: 'mental-health', label: 'Mental' },
  { id: 'hiv-stis', label: 'HIV/STI' },
  { id: 'malaria-fever', label: 'Malaria' },
  { id: 'diabetes-nutrition', label: 'Nutrition' },
  { id: 'skin-eye', label: 'Skin/Eye' },
];

export default function OthersAsked() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get('/feed', { params: { topic: topic || undefined, limit: 50 } });
        setEntries(data.entries);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [topic]);

  return (
    <MobileFrame>
      <header className="px-5 py-4 border-b border-mint-300/10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-muted-fg hover:text-white"><ArrowLeft size={18} /></button>
        <span className="font-display text-base">Others have asked</span>
        <span className="w-5" />
      </header>

      <div className="px-5 pt-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {TOPICS.map((t) => (
            <button
              key={t.id || 'all'}
              onClick={() => setTopic(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap',
                topic === t.id
                  ? 'bg-ember-500 border-ember-500 text-white'
                  : 'bg-ink-700 border-mint-300/15 text-muted-fg hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {loading && <div className="flex justify-center py-12"><Spinner size={26} /></div>}
        {error && <p className="text-sm text-care-red text-center">{error}</p>}
        {!loading && entries.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-12">No questions for this topic yet.</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="card-ink space-y-3">
            <div className="inline-block px-3 py-1.5 rounded-2xl rounded-bl-sm bg-mint-500/80 text-white text-sm">
              {e.question}
            </div>
            <p className="text-sm text-white leading-relaxed">{e.aiAnswer}</p>
            <CareBadge severity={e.careBadge} />
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}
