import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, PhoneCall, Users } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function Home() {
  const navigate = useNavigate();

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col px-7 pt-10 pb-8">

        {/* Top bar */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center shadow-green">
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
            <span className="font-display font-bold text-[18px] text-coal">Kira</span>
          </div>
          <Badge tone="sage" dot>Anonymous</Badge>
        </header>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <h1 className="font-display font-bold text-[28px] leading-tight text-coal mb-3">
            Private sexual health support
          </h1>
          <p className="text-coal-muted text-[15px] leading-relaxed">
            For women and men. No account, no judgment. Ask Kira anything about your sexual health — confidentially.
          </p>
        </motion.div>

        {/* Privacy banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="card p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-sage-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-[14px] font-semibold text-coal">Your session ends with this tab</p>
              <p className="text-[13px] text-coal-muted mt-0.5">
                We never save who you are. Only you can see what you've shared here.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <div className="space-y-3 mb-auto">
          <Button onClick={() => navigate('/patient/session')} size="lg" className="w-full">
            <Sparkles size={18} />
            Start Private Session
          </Button>
          <Button
            onClick={() => navigate('/patient/others-asked')}
            variant="ghost"
            size="lg"
            className="w-full"
          >
            <Users size={18} />
            See what others asked
          </Button>
        </div>

        {/* Helpdesk */}
        <button
          onClick={() => navigate('/patient/helpdesk')}
          className="mt-8 flex items-center justify-center gap-2 text-[13px] text-coal-muted hover:text-care-red transition"
        >
          <PhoneCall size={14} />
          Need to talk to someone now? Call a hospital helpdesk
        </button>
      </div>
    </MobileFrame>
  );
}
