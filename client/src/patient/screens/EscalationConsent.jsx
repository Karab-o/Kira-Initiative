import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { api, apiError } from '../../lib/api.js';
import { useSessionStore } from '../../stores/sessionStore.js';

export default function EscalationConsent() {
  const navigate = useNavigate();
  const { sessionToken, severityLevel, setEscalation, setPatientIdentity } = useSessionStore();
  const [step, setStep] = useState('explain'); // explain | form | submitting
  const [hospitals, setHospitals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', phone: '', email: '', hospitalId: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionToken) { navigate('/patient/home', { replace: true }); return; }
    (async () => {
      try {
        const [hRes, sRes] = await Promise.all([
          api.get('/hospitals'),
          api.post('/ai/summarise', { sessionToken }),
        ]);
        setHospitals(hRes.data.hospitals);
        setSummary(sRes.data.summary);
        if (hRes.data.hospitals[0]) setForm((f) => ({ ...f, hospitalId: hRes.data.hospitals[0].id }));
      } catch (err) {
        setError(apiError(err));
      }
    })();
  }, [sessionToken, navigate]);

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);
    setStep('submitting');
    try {
      const payload = {
        sessionToken,
        name: form.name,
        age: Number(form.age),
        phone: form.phone,
        email: form.email || undefined,
        hospitalId: form.hospitalId,
        symptomSummary: summary
          ? `${summary.chiefConcern}\n\nKey symptoms: ${(summary.keySymptoms || []).join(', ')}\nDuration: ${summary.duration}\nSelf-reported: ${summary.selfReported}\n\nAI note: ${summary.aiNote}`
          : 'Patient requested consultation through Kira.',
        escalationReason: summary?.chiefConcern || 'Patient escalation from AI chat',
        severityAtEscalation: summary?.severityAtEscalation || severityLevel || 'amber',
        consentConfirmed: true,
      };
      const { data } = await api.post('/escalations', payload);
      setEscalation(data.escalation);
      setPatientIdentity({ name: form.name, phone: form.phone, age: Number(form.age) });
      navigate('/patient/doctor-connect');
    } catch (err) {
      setError(apiError(err));
      setStep('form');
    }
  };

  return (
    <MobileFrame>
      <header className="px-5 py-4 border-b border-mint-300/10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-muted-fg hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-base">Connect a doctor</span>
        <span className="w-5" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {step === 'explain' && (
          <>
            <div className="card-ink mb-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-mint-300 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-white">Your AI chat stays private</p>
                  <p className="text-xs text-muted-fg mt-1 leading-relaxed">
                    To speak with a doctor we need a few basic details. The doctor only sees a brief medical summary — never the chat itself.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="font-display text-xl text-white mb-3">What doctors receive</h3>
            <ul className="space-y-2 mb-8">
              {['Your first name', 'Your age', 'A phone number to reach you', 'AI-generated summary of your concern', 'Your chosen hospital'].map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm text-muted-fg">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint-300" />
                  {x}
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <Button className="w-full" onClick={() => setStep('form')}>I understand — continue</Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/patient/chat')}>Stay in anonymous chat</Button>
            </div>
          </>
        )}

        {(step === 'form' || step === 'submitting') && (
          <form onSubmit={submit} className="space-y-4">
            <h3 className="font-display text-xl text-white mb-1">A few details</h3>
            <p className="text-sm text-muted-fg mb-3">Doctors need a way to reach you.</p>

            <Input label="First name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Age" type="number" min={13} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            <Input label="Phone number" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

            <Select label="Hospital preference" value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })} required>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Select>

            {error && <p className="text-sm text-care-red">{error}</p>}

            <Button type="submit" className="w-full mt-2" loading={step === 'submitting'}>
              {step === 'submitting' ? (
                <><Loader2 className="animate-spin" size={16} /> Finding available doctors…</>
              ) : 'Connect me with a doctor'}
            </Button>
          </form>
        )}
      </div>
    </MobileFrame>
  );
}
