import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, MessageCircle, Camera, Stethoscope,
  Inbox, NotebookPen, CalendarDays, ArrowRight,
} from 'lucide-react';
import Badge from '../components/ui/Badge.jsx';

const PATIENT_FEATURES = [
  { icon: MessageCircle, label: 'Anonymous AI chat' },
  { icon: Camera, label: 'Photo symptom scan' },
  { icon: Stethoscope, label: 'Connect with a real doctor' },
];

const DOCTOR_FEATURES = [
  { icon: Inbox, label: 'Triaged case queue' },
  { icon: NotebookPen, label: 'SOAP notes + private notes' },
  { icon: CalendarDays, label: 'Appointments & prescriptions' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-950 text-white flex flex-col">
      {/* Top brand */}
      <header className="px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-300 to-mint-500 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
              <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-display text-lg leading-tight">Kira Initiative</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-fg">Private men's health · Rwanda</p>
          </div>
        </div>
        <Badge tone="mint" dot>One platform</Badge>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 md:px-10 py-6">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-14"
          >
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-4 max-w-3xl mx-auto">
              Private support when you need it most.
            </h1>
            <p className="text-muted-fg text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              How would you like to continue?
            </p>
          </motion.div>

          {/* Two-up role picker */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <RoleCard
              variant="patient"
              title="I'm here for myself"
              description="Anonymous chat with Kira. No account. No history. No judgment."
              features={PATIENT_FEATURES}
              ctaText="Continue as patient"
              onClick={() => navigate('/patient')}
              delay={0.1}
            />
            <RoleCard
              variant="doctor"
              title="I'm a clinician"
              description="Sign in to the clinical portal to pick up escalated cases."
              features={DOCTOR_FEATURES}
              ctaText="Continue as doctor"
              onClick={() => navigate('/doctor/login')}
              delay={0.2}
            />
          </div>

          {/* Privacy reassurance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-fg"
          >
            <ShieldCheck size={14} className="text-mint-300" />
            <span>Patient chats are never shared with doctors — only a structured summary is.</span>
          </motion.div>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-5 text-center text-[11px] text-muted-fg font-mono uppercase tracking-wider">
        © Kira Initiative · Built for men in Rwanda
      </footer>
    </div>
  );
}

function RoleCard({ variant, title, description, features, ctaText, onClick, delay }) {
  const isPatient = variant === 'patient';

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -3 }}
      className={`group text-left card-ink !p-6 md:!p-8 relative overflow-hidden transition-all
        ${isPatient
          ? 'hover:border-ember-400/40 hover:shadow-ember'
          : 'hover:border-mint-300/40 hover:shadow-glow'
        }`}
    >
      {/* Decorative glow */}
      <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity
        ${isPatient
          ? 'bg-ember-500/15 group-hover:bg-ember-500/25'
          : 'bg-mint-300/15 group-hover:bg-mint-300/25'
        }`} />

      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <Badge tone={isPatient ? 'ember' : 'mint'} dot>
            {isPatient ? 'Patient' : 'Doctor'}
          </Badge>
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-white mb-2 leading-tight">{title}</h2>
        <p className="text-sm text-muted-fg leading-relaxed mb-6">{description}</p>

        <ul className="space-y-2.5 mb-7">
          {features.map((f) => (
            <li key={f.label} className="flex items-center gap-2.5 text-sm text-white/90">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border
                ${isPatient
                  ? 'bg-ember-500/10 border-ember-400/25 text-ember-400'
                  : 'bg-mint-300/10 border-mint-300/25 text-mint-300'
                }`}>
                <f.icon size={14} />
              </div>
              {f.label}
            </li>
          ))}
        </ul>

        <div className={`inline-flex items-center gap-2 font-medium text-sm transition
          ${isPatient ? 'text-ember-400 group-hover:text-ember-500' : 'text-mint-200 group-hover:text-mint-100'}`}>
          {ctaText}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.button>
  );
}
