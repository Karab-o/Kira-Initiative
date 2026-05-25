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
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-300 to-mint-500 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
                <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg">Kira</span>
          </div>
          <Badge tone="mint" dot>Anonymous</Badge>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl leading-tight text-white mb-3">
            Private support when you need it most
          </h1>
          <p className="text-muted-fg text-base leading-relaxed">
            No account. No history. No judgment. Just clear answers from someone who's been built to listen.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card-ink p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-mint-300 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-white">Your session ends with this tab</p>
              <p className="text-xs text-muted-fg mt-0.5">We never save who you are. Only you can see what you've shared here.</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3 mb-auto">
          <Button onClick={() => navigate('/patient/session')} size="lg" className="w-full">
            <Sparkles size={18} />
            Start Private Session
          </Button>
          <Button onClick={() => navigate('/patient/others-asked')} variant="ghost" size="lg" className="w-full">
            <Users size={18} />
            See what others asked
          </Button>
        </div>

        <button
          onClick={() => navigate('/patient/helpdesk')}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-fg hover:text-care-red transition"
        >
          <PhoneCall size={14} />
          Need to talk to someone now? Call a hospital helpdesk
        </button>
      </div>
    </MobileFrame>
  );
}
