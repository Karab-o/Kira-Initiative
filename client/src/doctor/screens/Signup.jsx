import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Check } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../lib/api.js';

const STEPS = ['Personal', 'Professional', 'Documents'];

export default function Signup() {
  const navigate = useNavigate();
  const { signup, apiError: getErr } = useAuth();
  const [step, setStep] = useState(0);
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    medicalLicenseId: '', specialty: '', department: '', hospitalId: '',
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get('/hospitals').then(({ data }) => {
      setHospitals(data.hospitals);
      if (data.hospitals[0]) setForm((f) => ({ ...f, hospitalId: data.hospitals[0].id }));
    });
  }, []);

  const next = (e) => { e?.preventDefault(); setStep((s) => Math.min(STEPS.length - 1, s + 1)); };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (licenseFile) fd.append('license', licenseFile);
      await signup(fd);
      setDone(true);
    } catch (err) {
      setError(getErr(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
        <div className="card-ink max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-care-green-bg border border-care-green/40 flex items-center justify-center mb-4">
            <Check className="text-care-green" size={28} />
          </div>
          <h2 className="font-display text-2xl mb-2">Application submitted</h2>
          <p className="text-sm text-muted-fg mb-6">
            We'll review your medical license within 24–48 hours. You'll receive an email once verified.
          </p>
          <Link to="/doctor/login" className="btn-mint inline-flex">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 px-6 py-10 text-white">
      <div className="max-w-lg mx-auto">
        <Link to="/doctor/login" className="inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-white mb-6">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <div className="flex items-center justify-between mb-7">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div className={`flex items-center gap-2 ${i === step ? 'text-white' : 'text-muted-fg'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
                  i < step ? 'bg-mint-500 text-white' : i === step ? 'bg-ember-500 text-white' : 'bg-ink-700 text-muted-fg'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </span>
                <span className="hidden sm:inline text-sm">{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-mint-300/15 mx-2" />}
            </div>
          ))}
        </div>

        <div className="card-ink">
          <h2 className="font-display text-2xl mb-1">Create doctor account</h2>
          <p className="text-sm text-muted-fg mb-6">
            {step === 0 && 'Tell us who you are.'}
            {step === 1 && 'Your professional details.'}
            {step === 2 && 'Upload proof of license.'}
          </p>

          {step === 0 && (
            <form onSubmit={next} className="space-y-4">
              <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              <Input label="Work email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} hint="At least 8 characters" />
              <Button type="submit" className="w-full mt-2">Continue</Button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={next} className="space-y-4">
              <Input label="Medical license ID" value={form.medicalLicenseId} onChange={(e) => setForm({ ...form, medicalLicenseId: e.target.value })} required />
              <Input label="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required placeholder="e.g. Urology" />
              <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
              <Select label="Hospital" value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })} required>
                {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </Select>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={prev} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1">Continue</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="block text-sm font-medium text-muted-fg mb-1.5">Medical license document</span>
                <label className="card-ink !p-5 flex items-center gap-3 cursor-pointer hover:border-mint-300/40 transition">
                  <div className="w-10 h-10 rounded-xl bg-mint-300/15 border border-mint-300/30 flex items-center justify-center">
                    <Upload className="text-mint-300" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{licenseFile?.name || 'Tap to upload (PDF or image)'}</p>
                    <p className="text-xs text-muted-fg">Max 10MB</p>
                  </div>
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => setLicenseFile(e.target.files?.[0])} className="hidden" />
                </label>
              </label>

              {error && <p className="text-sm text-care-red">{error}</p>}

              <div className="flex gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={prev} className="flex-1">Back</Button>
                <Button type="submit" loading={loading} className="flex-1">Submit application</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
