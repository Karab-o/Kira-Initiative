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
  { id: 'stis-testing', label: 'STIs & Testing' },
  { id: 'hiv-prep-pep', label: 'HIV / PEP / PrEP' },
  { id: 'womens-health', label: "Women's Health" },
  { id: 'mens-health', label: "Men's Health" },
  { id: 'contraception', label: 'Contraception' },
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
      {/* Header */}
      <header className="px-5 py-4 border-b border-border flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-coal-muted hover:text-coal transition">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-base text-coal">Others have asked</span>
        <span className="w-5" />
      </header>

      {/* Topic filter chips */}
      <div className="px-5 pt-4 pb-3 overflow-x-auto border-b border-border">
        <div className="flex gap-2 min-w-max">
          {TOPICS.map((t) => (
            <button
              key={t.id || 'all'}
              onClick={() => setTopic(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap',
                topic === t.id
                  ? 'bg-sage-500 border-sage-500 text-white'
                  : 'bg-surface-soft border-border-soft text-coal-muted hover:text-coal hover:border-sage-300',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading && <div className="flex justify-center py-12"><Spinner size={26} /></div>}
        {error && <p className="text-sm text-care-red text-center">{error}</p>}
        {!loading && entries.length === 0 && (
          <p className="text-center text-sm text-coal-muted py-12">No questions for this topic yet.</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="card p-4 space-y-3">
            {/* Question bubble */}
            <div className="inline-block px-3 py-1.5 rounded-2xl rounded-bl-sm bg-sage-100 text-coal text-sm">
              {e.question}
            </div>
            {/* Kira's answer */}
            <p className="text-sm text-coal leading-relaxed">{e.aiAnswer}</p>
            <CareBadge severity={e.careBadge} />
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}
