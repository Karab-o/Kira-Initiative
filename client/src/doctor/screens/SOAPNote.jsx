import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Save } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { TextArea } from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { api, apiError } from '../../lib/api.js';

const FIELDS = [
  { key: 'subjective', label: 'Subjective', hint: "Patient's reported symptoms in their own words." },
  { key: 'objective',  label: 'Objective',  hint: 'Clinical observations and measurable findings.' },
  { key: 'assessment', label: 'Assessment', hint: 'Your clinical assessment and differential.' },
  { key: 'plan',       label: 'Plan',       hint: 'Treatment plan, follow-ups, prescriptions.' },
];

export default function SOAPNote() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [finalized, setFinalized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/consultations/${consultationId}`);
        const s = data.consultation.soapNote;
        if (s) {
          setForm({ subjective: s.subjective, objective: s.objective, assessment: s.assessment, plan: s.plan });
          setFinalized(s.finalized);
        }
      } catch (err) { setError(apiError(err)); }
      finally { setLoading(false); }
    })();
  }, [consultationId]);

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post(`/consultations/${consultationId}/soap`, form);
      setSavedAt(new Date());
    } catch (err) { setError(apiError(err)); }
    finally { setSaving(false); }
  };

  const finalize = async () => {
    if (!confirm('Finalize this SOAP note? After finalizing, the case will be marked completed.')) return;
    setSaving(true);
    try {
      await api.post(`/consultations/${consultationId}/soap`, form);
      await api.post(`/consultations/${consultationId}/finalize`);
      setFinalized(true);
    } catch (err) { setError(apiError(err)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/doctor/consultation/${consultationId}`)} className="text-muted-fg hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl text-white leading-tight">SOAP note</h1>
          <p className="text-xs text-muted-fg">
            {savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : finalized ? 'Finalized' : 'Draft'}
          </p>
        </div>
        {finalized && <Badge tone="green" dot><Lock size={11} /> Finalized</Badge>}
      </div>

      <form onSubmit={save} className="space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key} className="card-ink">
            <div className="flex items-baseline justify-between mb-1">
              <p className="font-display text-lg">{f.label}</p>
              <p className="text-[11px] text-muted-fg font-mono uppercase tracking-wider">{f.key[0].toUpperCase()}</p>
            </div>
            <p className="text-xs text-muted-fg mb-3">{f.hint}</p>
            <TextArea
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              disabled={finalized}
              rows={5}
            />
          </div>
        ))}

        {error && <p className="text-sm text-care-red">{error}</p>}

        <div className="flex gap-3 sticky bottom-3 bg-ink-950/80 backdrop-blur px-2 py-3 -mx-2 rounded-xl">
          <Button type="submit" variant="ghost" disabled={finalized} loading={saving} className="flex-1">
            <Save size={14} /> Save draft
          </Button>
          <Button type="button" onClick={finalize} disabled={finalized} loading={saving} className="flex-1">
            <Check size={14} /> Finalize consultation
          </Button>
        </div>
      </form>
    </div>
  );
}
