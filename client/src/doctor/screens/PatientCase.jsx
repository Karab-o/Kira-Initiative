import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, CalendarPlus, ShieldCheck, Phone, User } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import AISummaryCard from '../components/AISummaryCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { api, apiError } from '../../lib/api.js';

export default function PatientCase() {
  const { escalationId } = useParams();
  const navigate = useNavigate();
  const [escalation, setEscalation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [risk, setRisk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [escalationId]); // eslint-disable-line

  async function load() {
    try {
      const { data } = await api.get(`/escalations/${escalationId}`);
      setEscalation(data.escalation);
      setRisk(data.escalation.consultation?.riskLevel || '');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  const openConsultation = async () => {
    setBusy(true);
    try {
      let cId = escalation.consultation?.id;
      if (!cId) {
        const { data } = await api.post('/consultations', { escalationId });
        cId = data.consultation.id;
      }
      navigate(`/doctor/consultation/${cId}`);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const saveRisk = async (level) => {
    setRisk(level);
    if (!escalation.consultation?.id) return;
    try {
      await api.patch(`/consultations/${escalation.consultation.id}/risk`, { riskLevel: level });
    } catch {}
  };

  const buildSummaryObj = (text) => {
    // The handoff summary was concatenated text on the patient side; reconstruct a display object.
    if (!text) return null;
    const lines = text.split(/\n+/);
    return {
      chiefConcern: lines[0] || '',
      duration: lines.find((l) => l.startsWith('Duration:'))?.replace('Duration:', '').trim(),
      keySymptoms: lines.find((l) => l.startsWith('Key symptoms:'))?.replace('Key symptoms:', '').split(',').map((s) => s.trim()).filter(Boolean),
      selfReported: lines.find((l) => l.startsWith('Self-reported:'))?.replace('Self-reported:', '').trim(),
      aiNote: lines.find((l) => l.startsWith('AI note:'))?.replace('AI note:', '').trim(),
    };
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (error) return <p className="text-sm text-care-red">{error}</p>;
  if (!escalation) return null;

  const summary = buildSummaryObj(escalation.symptomSummary);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/doctor/dashboard')} className="text-muted-fg hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl text-white leading-tight">Patient case</h1>
          <p className="text-xs text-muted-fg">Opened {new Date(escalation.createdAt).toLocaleString()}</p>
        </div>
        <RiskBadge value={escalation.severityAtEscalation} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <AISummaryCard summary={summary} />

          <div className="card-ink">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-fg mb-3">Escalation reason</p>
            <p className="text-sm text-white leading-relaxed">{escalation.escalationReason}</p>
          </div>

          <div className="card-ink !bg-mint-300/5 !border-mint-300/20">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-mint-300 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-white">Anonymous AI chat is not shown</p>
                <p className="text-xs text-muted-fg mt-1">Only the structured summary above is shared with you. The full chat stays private to the patient.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="card-ink">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-mint-300/15 border border-mint-300/25 flex items-center justify-center">
                <User className="text-mint-300" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{escalation.patientName}, {escalation.patientAge}</p>
                <p className="text-xs text-muted-fg">{escalation.hospital?.name}</p>
              </div>
            </div>
            <a href={`tel:${escalation.patientPhone}`} className="btn-ghost w-full">
              <Phone size={14} /> {escalation.patientPhone}
            </a>
          </div>

          <div className="card-ink">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-fg mb-3">Risk level</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {['low', 'medium', 'high', 'critical'].map((lv) => (
                <button
                  key={lv}
                  onClick={() => saveRisk(lv)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize border transition ${
                    risk === lv
                      ? 'border-ember-500/60 bg-ember-500/10 text-white'
                      : 'border-mint-300/15 bg-ink-800 text-muted-fg hover:border-mint-300/40'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={openConsultation} loading={busy} className="w-full">
              <MessageSquare size={16} /> {escalation.consultation ? 'Open consultation' : 'Start consultation'}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/doctor/appointments')} className="w-full">
              <CalendarPlus size={16} /> Schedule follow-up
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
