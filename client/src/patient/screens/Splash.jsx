import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import { useSessionStore } from '../../stores/sessionStore.js';

export default function Splash() {
  const navigate = useNavigate();
  const hasOnboarded = useSessionStore((s) => s.hasOnboarded);

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(hasOnboarded ? '/patient/home' : '/patient/onboarding', { replace: true });
    }, 2200);
    return () => clearTimeout(t);
  }, [navigate, hasOnboarded]);

  return (
    <MobileFrame className="bg-gradient-to-b from-ink-800 via-ink-900 to-ink-950">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 -m-6 rounded-full bg-mint-300/15 blur-2xl animate-pulse-soft" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-mint-300 to-mint-500 flex items-center justify-center shadow-glow">
            <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
              <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-4xl text-white mb-2"
        >
          Kira Initiative
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-mint-200/80 text-sm"
        >
          Private support when you need it most
        </motion.p>
      </div>
    </MobileFrame>
  );
}
