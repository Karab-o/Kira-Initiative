import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Inbox, CalendarDays, AlertTriangle, Activity,
  ArrowRight, Stethoscope, Clock, Users, CheckCircle2,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { api, apiError } from '../../lib/api.js';
import { useDoctorStore } from '../../stores/doctorStore.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { doctor } = useDoctorStore();
  const [escalations,  setEscalations]  = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

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

  const today        = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow     = new Date(today.getTime() + 86400000);
  const todaysAppts  = appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    return d >= today && d < tomorrow;
  });
  const highRisk  = escalations.filter((e) => e.severityAtEscalation === 'red');
  const pending   = escalations.filter((e) => e.status === 'pending');
  const mine      = escalations.filter((e) => e.assignedDoctorId === doctor?.id && e.status === 'active');
  const followUps = escalations.filter((e) => e.status === 'follow_up');

  return (
    <div className="space-y-7 max-w-5xl">

      {/* ── Greeting ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display font-bold text-[30px] text-coal mb-1">
          Good {getTimeOfDay()}, {doctor?.fullName?.split(' ').find(w => !w.startsWith('Dr')) || 'Doctor'}
        </h1>
        <p className="text-[14px] text-coal-muted">
          Here's your clinical overview for {new Date().toLocaleDateString('en-RW', { weekday: 'long', day: 'numeric', month: 'long' })}.
        </p>
      </motion.div>

      {/* ── Specialty banner ────────────────────────────── */}
      {doctor?.specialty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={18} className="text-sage-500" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-coal">{doctor.specialty}</p>
            <p className="text-[12px] text-coal-muted">
              You only receive escalations matching your specialization · {doctor.hospitalName || 'Kira Initiative'}
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-sage-600 bg-sage-100 border border-sage-200 rounded-full px-3 py-1">
            <CheckCircle2 size={11} /> Verified
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} /></div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-coal-muted">{error}</p>
        </div>
      ) : (
        <>
          {/* ── Stat cards ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <StatCard icon={Activity}      label="Active cases"     value={mine.length}        hint="Assigned to you"  tone="default" />
            <StatCard icon={Inbox}         label="Pending review"   value={pending.length}     hint="In queue"         tone="amber" />
            <StatCard icon={CalendarDays}  label="Today's appts"    value={todaysAppts.length} hint="Scheduled"        tone="sage" />
            <StatCard icon={AlertTriangle} label="High risk"        value={highRisk.length}    hint="Severity: red"    tone="red" />
          </motion.div>

          {/* ── High-risk alerts ──────────────────────────── */}
          {highRisk.length > 0 && (
            <section>
              <SectionHeader dot="bg-care-red animate-pulse" title="High-risk alerts" />
              <div className="space-y-2">
                {highRisk.slice(0, 4).map((e) => (
                  <CaseRow key={e.id} esc={e} onOpen={() => navigate(`/doctor/case/${e.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* ── Case queue ────────────────────────────────── */}
          <section>
            <SectionHeader title="Case queue" count={escalations.length} />
            {escalations.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No cases yet"
                description="When a patient escalates from the AI chat matching your specialty, the case appears here."
              />
            ) : (
              <div className="space-y-2">
                {escalations.slice(0, 10).map((e) => (
                  <CaseRow key={e.id} esc={e} onOpen={() => navigate(`/doctor/case/${e.id}`)} />
                ))}
              </div>
            )}
          </section>

          {/* ── Today's appointments ──────────────────────── */}
          {todaysAppts.length > 0 && (
            <section>
              <SectionHeader title="Today's appointments" count={todaysAppts.length} />
              <div className="grid sm:grid-cols-2 gap-3">
                {todaysAppts.map((a) => (
                  <div key={a.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={13} className="text-sage-500" />
                      <span className="text-[12px] font-semibold text-coal-muted uppercase tracking-wide">
                        {new Date(a.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{a.type}
                      </span>
                    </div>
                    <p className="text-[15px] font-semibold text-coal">{a.escalation?.patientName || 'Patient'}</p>
                    <p className="text-[13px] text-coal-muted">{a.escalation?.patientPhone}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Follow-ups ────────────────────────────────── */}
          {followUps.length > 0 && (
            <section>
              <SectionHeader title="Follow-ups" count={followUps.length} icon={Users} />
              <div className="space-y-2">
                {followUps.slice(0, 5).map((e) => (
                  <CaseRow key={e.id} esc={e} onOpen={() => navigate(`/doctor/case/${e.id}`)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
  const tones = {
    default: { bg: 'bg-white',       icon: 'bg-sage-100 text-sage-500',  val: 'text-coal' },
    amber:   { bg: 'bg-white',       icon: 'bg-care-amber-bg text-care-amber', val: 'text-coal' },
    sage:    { bg: 'bg-sage-50',     icon: 'bg-sage-100 text-sage-500',  val: 'text-sage-600' },
    red:     { bg: 'bg-white',       icon: 'bg-care-red-bg text-care-red',   val: 'text-care-red' },
  };
  const t = tones[tone] || tones.default;

  return (
    <div className={`card ${t.bg} p-4`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${t.icon}`}>
        <Icon size={16} />
      </div>
      <p className={`font-display font-bold text-[28px] leading-none mb-0.5 ${t.val}`}>{value}</p>
      <p className="text-[13px] font-semibold text-coal">{label}</p>
      {hint && <p className="text-[11px] text-coal-muted mt-0.5">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, count, dot, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {Icon && <Icon size={15} className="text-coal-muted" />}
      <h2 className="font-display font-bold text-[18px] text-coal">{title}</h2>
      {count !== undefined && (
        <span className="text-[12px] font-semibold text-coal-muted bg-surface-muted px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

function CaseRow({ esc, onOpen }) {
  const minutesAgo = Math.floor((Date.now() - new Date(esc.createdAt).getTime()) / 60000);
  const timeLabel  = minutesAgo < 60
    ? `${minutesAgo}m ago`
    : minutesAgo < 1440
      ? `${Math.floor(minutesAgo / 60)}h ago`
      : `${Math.floor(minutesAgo / 1440)}d ago`;

  return (
    <button
      onClick={onOpen}
      className="w-full card p-4 flex items-center gap-4 hover:border-sage-300 hover:shadow-soft transition text-left group"
    >
      <RiskBadge value={esc.severityAtEscalation} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-coal truncate">
          {esc.patientName || 'Anonymous'}{esc.patientAge ? `, ${esc.patientAge}` : ''}
        </p>
        <p className="text-[12px] text-coal-muted truncate">{esc.escalationReason}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
        <p className="text-[11px] text-coal-muted">{timeLabel}</p>
        <p className="text-[11px] text-sage-500 capitalize font-medium">{esc.status}</p>
      </div>
      <ArrowRight size={16} className="text-coal-muted group-hover:text-sage-500 transition flex-shrink-0" />
    </button>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
