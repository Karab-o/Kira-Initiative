import { useState } from 'react';
import { Save } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { api, apiError } from '../../lib/api.js';
import { useDoctorStore } from '../../stores/doctorStore.js';

export default function Profile() {
  const { doctor, setDoctor } = useDoctorStore();
  const [form, setForm] = useState({
    fullName: doctor?.fullName || '',
    specialty: doctor?.specialty || '',
    department: doctor?.department || '',
  });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('profilePhoto', photo);
      const { data } = await api.patch(`/doctors/${doctor.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDoctor({ ...doctor, ...data.doctor });
      setSavedAt(new Date());
    } catch (err) { setError(apiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-coal mb-1">Profile</h1>
        <p className="text-sm text-coal-muted">Public information shown to patients picking a doctor.</p>
      </div>

      <form onSubmit={save} className="card p-4 space-y-4">
        <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <Input label="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required />
        <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />

        <label className="block">
          <span className="block text-sm font-medium text-coal-muted mb-1.5">Profile photo (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0])}
            className="block text-sm text-coal-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-sage-200 file:bg-sage-50 file:text-sage-600 file:cursor-pointer hover:file:bg-sage-100"
          />
        </label>

        {error && <p className="text-sm text-care-red">{error}</p>}
        {savedAt && <p className="text-sm text-care-green">Profile saved.</p>}

        <Button type="submit" loading={busy}><Save size={14} /> Save changes</Button>
      </form>
    </div>
  );
}
