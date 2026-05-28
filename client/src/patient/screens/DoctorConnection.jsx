import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Check } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import DoctorCard from '../components/DoctorCard.jsx';
import { api, apiError } from '../../lib/api.js';
import { useSessionStore } from '../../stores/sessionStore.js';

export default function DoctorConnection() {
  const navigate = useNavigate();
  const { escalation, sessionToken, setConsultation } = useSessionStore();
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState([]);
  const [chosenSlot, setChosenSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!escalation) { navigate('/patient/home', { replace: true }); return; }
    (async () => {
      try {
        const { data } = await api.get('/doctors', { params: { hospitalId: escalation.hospitalId } });
        setDoctors(data.doctors);
        if (data.doctors[0]) setSelected(data.doctors[0]);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [escalation, navigate]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      try {
        const { data } = await api.get(`/doctors/${selected.id}/slots`);
        setSlots(data.slots.slice(0, 8));
        setChosenSlot(null);
      } catch {}
    })();
  }, [selected]);

  const book = async () => {
    if (!chosenSlot) return;
    setConfirming(true);
    setError(null);
    try {
      await api.post('/appointments', {
        sessionToken,
        escalationId: escalation.id,
        doctorId: selected.id,
        hospitalId: escalation.hospitalId,
        scheduledAt: chosenSlot,
        type: 'online',
      });
      setConfirmed(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <MobileFrame>
        <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
          <div className="w-20 h-20 rounded-full bg-care-green-bg border border-care-green/30 flex items-center justify-center mb-6">
            <Check className="text-care-green" size={36} />
          </div>
          <h2 className="font-display text-2xl text-coal mb-2">Appointment booked</h2>
          <p className="text-sm text-coal-muted mb-1">{selected.fullName}</p>
          <p className="text-sm text-sage-500 font-medium mb-8">{new Date(chosenSlot).toLocaleString()}</p>
          <Button onClick={() => navigate('/patient/consultation')} className="w-full">Start consultation chat</Button>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      {/* Header */}
      <header className="px-5 py-4 border-b border-border flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-coal-muted hover:text-coal transition">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-base text-coal">Choose a doctor</span>
        <span className="w-5" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={26} /></div>
        ) : (
          <>
            {/* Doctor list */}
            <div className="space-y-2">
              {doctors.map((d) => (
                <DoctorCard key={d.id} doctor={d} selected={selected?.id === d.id} onSelect={setSelected} />
              ))}
              {doctors.length === 0 && (
                <p className="text-sm text-coal-muted text-center py-8">No doctors available at this hospital right now.</p>
              )}
            </div>

            {/* Slot picker */}
            {selected && (
              <div className="card p-4">
                <p className="text-xs uppercase tracking-wider font-mono text-coal-subtle mb-3">Available times</p>
                {slots.length === 0 ? (
                  <p className="text-sm text-coal-muted">No slots available — try the helpdesk to call directly.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((s) => {
                      const d = new Date(s);
                      const active = chosenSlot === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setChosenSlot(s)}
                          className={`px-3 py-2.5 rounded-xl border text-sm transition ${
                            active
                              ? 'border-sage-500 bg-sage-50 text-coal shadow-green'
                              : 'border-border-soft bg-surface-soft text-coal-muted hover:border-sage-300 hover:text-coal'
                          }`}
                        >
                          <div className="font-medium">{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</div>
                          <div className="text-xs">{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-care-red text-center">{error}</p>}

            <Button onClick={book} disabled={!chosenSlot || confirming} loading={confirming} className="w-full">
              Book online consultation
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-coal-subtle text-xs">
              <div className="flex-1 h-px bg-border" />
              <span>or prefer to call</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="ghost" onClick={() => navigate('/patient/helpdesk')} className="w-full">
              <Phone size={16} /> Call to schedule
            </Button>
          </>
        )}
      </div>
    </MobileFrame>
  );
}
