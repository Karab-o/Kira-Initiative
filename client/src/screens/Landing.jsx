import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, MessageCircle, Stethoscope,
  Lock, ArrowRight, UserRound, Briefcase,
  Inbox, NotebookPen, CalendarDays,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-[#EDE7E3]">
        <div className="flex items-center gap-3">
          <KiraLogo />
          <div>
            <p className="font-display font-bold text-[17px] text-coal leading-tight">
              Kira Initiative
            </p>
            <p className="text-[11px] text-coal-muted tracking-wide">
              Sexual health · Rwanda
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[12px] text-coal-muted px-3 py-1.5 rounded-full bg-sage-50 border border-sage-100">
          <ShieldCheck size={12} className="text-sage-500" />
          Anonymous-first
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-5 md:px-10 py-10 md:py-14">
        <div className="w-full max-w-4xl">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-12"
          >
            <h1 className="font-display font-bold text-4xl md:text-5xl text-coal leading-[1.1] mb-3">
              Private sexual health support<br className="hidden md:block" /> when you need it.
            </h1>
            <p className="text-coal-muted text-base md:text-lg max-w-sm mx-auto leading-relaxed">
              How would you like to continue?
            </p>
          </motion.div>

          {/* Split cards */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">

            {/* Patient card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6 md:p-8 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <UserRound size={18} className="text-sage-500" />
                </div>
                <div>
                  <p className="font-semibold text-coal text-[15px]">I'm here for myself</p>
                  <p className="text-[12px] text-coal-muted">Patient · Women & Men welcome</p>
                </div>
              </div>

              <p className="text-[14px] text-coal-muted mb-6 leading-relaxed">
                Get confidential AI guidance on sexual health. No account needed — your privacy is fully protected.
              </p>

              <ul className="space-y-2.5 mb-7">
                <FeatureRow icon={Lock} label="No account · No history · No judgment" />
                <FeatureRow icon={MessageCircle} label="Anonymous AI chat with Kira" />
                <FeatureRow icon={Stethoscope} label="Connect to a gynaecologist or urologist when needed" />
              </ul>

              <div className="mt-auto">
                <button
                  onClick={() => navigate('/patient')}
                  className="w-full btn-primary"
                >
                  Continue anonymously
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>

            {/* Doctor card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-6 md:p-8 flex flex-col border-sage-200/60 bg-sage-50/40"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-sage-500/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={18} className="text-sage-500" />
                </div>
                <div>
                  <p className="font-semibold text-coal text-[15px]">I'm a clinician</p>
                  <p className="text-[12px] text-coal-muted">Gynaecologist · Urologist · Specialist</p>
                </div>
              </div>

              <p className="text-[14px] text-coal-muted mb-6 leading-relaxed">
                Access the clinical portal to review sexual health cases, manage consultations, and prescribe care.
              </p>

              <ul className="space-y-2.5 mb-7">
                <FeatureRow icon={Inbox} label="Triaged sexual health case queue" variant="sage" />
                <FeatureRow icon={NotebookPen} label="AI clinical summaries — never raw chat logs" variant="sage" />
                <FeatureRow icon={CalendarDays} label="Secure messaging, prescriptions & appointments" variant="sage" />
              </ul>

              <div className="mt-auto space-y-2.5">
                <button
                  onClick={() => navigate('/doctor/login')}
                  className="w-full btn-primary"
                >
                  Clinician login
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/doctor/signup')}
                  className="w-full btn-ghost text-[14px]"
                >
                  Medical verification &amp; signup
                </button>
              </div>
            </motion.div>
          </div>

          {/* Privacy note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-[12px] text-coal-muted"
          >
            <ShieldCheck size={13} className="text-sage-500 flex-shrink-0" />
            Patient chats are never shared with doctors — only a structured AI summary is.
          </motion.p>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="px-6 py-4 border-t border-[#EDE7E3] text-center text-[11px] text-coal-subtle">
        © 2025 Kira Initiative · Private sexual health support for Rwanda · All sessions are anonymous
      </footer>
    </div>
  );
}

function KiraLogo() {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center shadow-green flex-shrink-0">
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <path
          d="M11 8v16M11 16l8-8M11 16l8 8"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FeatureRow({ icon: Icon, label, variant = 'default' }) {
  const iconBg  = variant === 'sage' ? 'bg-sage-100' : 'bg-sage-50';
  const iconCol = 'text-sage-500';
  return (
    <li className="flex items-center gap-2.5 text-[14px] text-coal-light">
      <div className={`w-6 h-6 rounded-md ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={12} className={iconCol} />
      </div>
      {label}
    </li>
  );
}
