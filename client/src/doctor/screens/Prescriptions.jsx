import { useEffect, useState } from 'react';
import { FileText, Upload, Check } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Input, Select, TextArea } from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { api, apiError } from '../../lib/api.js';

export default function Prescriptions() {
  const [consultations, setConsultations] = useState([]);
  const [consultationId, setConsultationId] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/escalations', { params: { mine: 'true' } });
        const list = data.escalations
          .filter((e) => e.consultation?.id)
          .map((e) => ({ id: e.consultation.id, label: `${e.patientName} — ${e.escalationReason}` }));
        setConsultations(list);
      } catch (err) { setError(apiError(err)); }
      finally { setLoading(false); }
    })();
  }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!consultationId || !file) return;
    setBusy(true); setError(null); setSuccess(false);
    try {
      const fd = new FormData();
      fd.append('consultationId', consultationId);
      fd.append('notes', notes);
      fd.append('prescription', file);
      await api.post('/prescriptions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
      setFile(null); setNotes('');
    } catch (err) { setError(apiError(err)); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-coal mb-1">Prescriptions</h1>
        <p className="text-sm text-coal-muted">Upload a PDF prescription tied to one of your consultations.</p>
      </div>

      {consultations.length === 0 ? (
        <EmptyState icon={FileText} title="No consultations yet" description="Once you start a consultation, you can upload a prescription here." />
      ) : (
        <form onSubmit={upload} className="card p-4 space-y-4">
          <Select label="Consultation" value={consultationId} onChange={(e) => setConsultationId(e.target.value)} required>
            <option value="">Choose a consultation…</option>
            {consultations.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>

          <TextArea label="Notes for patient (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />

          <label className="block">
            <span className="block text-sm font-medium text-coal-muted mb-1.5">Prescription PDF</span>
            <label className="card !p-4 flex items-center gap-3 cursor-pointer hover:border-sage-300 transition">
              <div className="w-10 h-10 rounded-xl bg-sage-100 border border-sage-200 flex items-center justify-center">
                <Upload className="text-sage-500" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-coal truncate">{file?.name || 'Tap to choose PDF'}</p>
                <p className="text-xs text-coal-muted">Max 10MB · PDF only</p>
              </div>
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="hidden" />
            </label>
          </label>

          {error && <p className="text-sm text-care-red">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-sm text-care-green">
              <Check size={16} /> Prescription uploaded and shared with the patient.
            </div>
          )}

          <Button type="submit" disabled={!consultationId || !file} loading={busy} className="w-full">
            Upload prescription
          </Button>
        </form>
      )}
    </div>
  );
}
