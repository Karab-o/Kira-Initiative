import { useEffect, useState } from 'react';
import { CalendarDays, Phone } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { api, apiError } from '../../lib/api.js';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/appointments');
        setAppointments(data.appointments);
      } catch (err) { setError(apiError(err)); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (error) return <p className="text-sm text-care-red">{error}</p>;

  const groups = appointments.reduce((acc, a) => {
    const d = new Date(a.scheduledAt).toDateString();
    (acc[d] = acc[d] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl text-coal mb-1">Appointments</h1>
        <p className="text-sm text-coal-muted">All scheduled consultations at your hospital.</p>
      </div>

      {appointments.length === 0 && (
        <EmptyState icon={CalendarDays} title="No appointments yet" description="Bookings will show up here as they come in." />
      )}

      {Object.entries(groups).map(([day, list]) => (
        <section key={day}>
          <h2 className="font-display text-lg text-coal mb-3">{day}</h2>
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a.id} className="card !p-4 flex items-center gap-4">
                <div className="w-14 text-center">
                  <p className="text-[11px] font-mono uppercase text-coal-muted">
                    {new Date(a.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] text-coal-muted mt-0.5 uppercase font-mono">{a.type}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coal truncate">{a.escalation?.patientName || 'Patient'}</p>
                  <p className="text-xs text-coal-muted truncate">{a.doctor?.fullName} · {a.doctor?.specialty}</p>
                </div>
                <Badge tone={
                  a.status === 'completed' ? 'green' :
                  a.status === 'cancelled' ? 'neutral' : 'mint'
                } dot>{a.status}</Badge>
                {a.escalation?.patientPhone && (
                  <a href={`tel:${a.escalation.patientPhone}`} className="text-coal-muted hover:text-coal transition" title={a.escalation.patientPhone}>
                    <Phone size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
