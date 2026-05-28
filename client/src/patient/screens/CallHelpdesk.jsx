import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Clock } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { api, apiError } from '../../lib/api.js';

export default function CallHelpdesk() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/hospitals');
        setHospitals(data.hospitals);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <MobileFrame>
      {/* Header */}
      <header className="px-5 py-4 border-b border-border flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-coal-muted hover:text-coal transition">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-base text-coal">Call helpdesk</span>
        <span className="w-5" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <h2 className="font-display text-2xl text-coal mb-1">Talk to a real person now</h2>
        <p className="text-sm text-coal-muted mb-5 flex items-center gap-1.5">
          <Clock size={12} /> Lines open 8am–6pm Mon–Sat
        </p>

        {loading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}
        {error && <p className="text-sm text-care-red">{error}</p>}

        <div className="space-y-3">
          {hospitals.map((h) => (
            <div key={h.id} className="card p-4">
              <p className="text-sm font-medium text-coal">{h.name}</p>
              <p className="text-xs text-coal-muted mb-3">{h.address}</p>
              <a
                href={`tel:${h.helpdeskPhone}`}
                className="btn-primary w-full"
              >
                <Phone size={16} /> {h.helpdeskPhone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
}
