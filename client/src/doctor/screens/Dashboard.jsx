import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, CalendarDays, AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { api, apiError } from '../../lib/api.js';
import { useDoctorStore } from '../../stores/doctorStore.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { doctor } = useDoctorStore();
  const [escalations, setEscalations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [eRes, aRes] = await Promise.all([
          api.get('/escalations'),
          api.get('/appointments', { params: { mine: 'true' } }),
        ]);
        setEscalations(eRes.data.escalations);
        setAppointments(aRes.data.appointments);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const todaysAppts = appointments.filter((a) => new Date(a.scheduledAt) >= today && new Date(a.scheduledAt) < new Date(today.getTime() + 86400000));
  const highRisk = escalations.filter((e) => e.severityAtEscalation === 'red');
  const pending = escalations.filter((e) => e.status === 'pending');
  const mine = escalations.filter((e) => e.assignedDoctorId === doctor?.id && e.status === 'active');

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Welcome, {doctor?.fullName?.split(' ').slice(-1)[0] || 'Doctor'}</h1>
        <p className="text-sm text-muted-fg">Here's where things stand right now.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : error ? (
        <p className="text-sm text-care-red">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active cases" value={mine.length} hint="Assigned to you" icon={Activity} />
            <StatCard label="Pending review" value={pending.length} hint="Queue" tone="amber" icon={Inbox} />
            <StatCard label="Today's appointments" value={todaysAppts.length} icon={CalendarDays} tone="ember" />
            <StatCard label="High risk" value={highRisk.length} hint="Severity: red" icon={AlertTriangle} tone="red" />
          </div>

          {highRisk.length > 0 && (
            <section>
              <h2 className="font-display text-lg mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-care-red animate-pulse" /> High-risk alerts
              </h2>
              <div className="space-y-2">
                {highRisk.slice(0, 4).map((e) => (
                  <CaseRow key={e.id} esc={e} onOpen={() => navigate(`/doctor/case/${e.id}`)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-lg mb-3">Case queue</h2>
            {escalations.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No cases yet"
                description="When a patient escalates from the AI chat, the case will appear here."
              />
            ) : (
              <div className="space-y-2">
                {escalations.slice(0, 10).map((e) => (
                  <CaseRow key={e.id} esc={e} onOpen={() => navigate(`/doctor/case/${e.id}`)} />
                ))}
              </div>
            )}
          </section>

          {todaysAppts.length > 0 && (
            <section>
              <h2 className="font-display text-lg mb-3">Today's appointments</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {todaysAppts.map((a) => (
                  <div key={a.id} className="card-ink !p-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-fg mb-1">
                      {new Date(a.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {a.type}
                    </p>
                    <p className="text-sm font-medium text-white">{a.escalation?.patientName || 'Patient'}</p>
                    <p className="text-xs text-muted-fg">{a.escalation?.patientPhone}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CaseRow({ esc, onOpen }) {
  const minutesAgo = Math.floor((Date.now() - new Date(esc.createdAt).getTime()) / 60000);
  return (
    <button
      onClick={onOpen}
      className="w-full card-ink !p-4 flex items-center gap-4 hover:border-mint-300/30 transition text-left"
    >
      <RiskBadge value={esc.severityAtEscalation} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{esc.patientName}, {esc.patientAge}</p>
        <p className="text-xs text-muted-fg truncate">{esc.escalationReason}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end text-right">
        <p className="text-[11px] text-muted-fg">{minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo/60)}h ago`}</p>
        <p className="text-[11px] text-mint-200 capitalize">{esc.status}</p>
      </div>
      <ArrowRight size={16} className="text-muted-fg" />
    </button>
  );
}
