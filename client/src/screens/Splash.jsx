import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/home', { replace: true }), 2600);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center text-center px-8 select-none">

      {/* Logo mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 -m-10 rounded-full bg-sage-200/40 blur-3xl animate-pulse-soft pointer-events-none" />
        <div className="relative w-24 h-24 rounded-[28px] bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center shadow-green">
          <svg viewBox="0 0 32 32" className="w-12 h-12" fill="none">
            <path
              d="M11 8v16M11 16l8-8M11 16l8 8"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* Name */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.45 }}
        className="font-display font-bold text-5xl text-coal mb-3 tracking-tight"
      >
        Kira Initiative
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.58, duration: 0.4 }}
        className="text-coal-muted text-[16px] font-medium"
      >
        Private support when you need it most
      </motion.p>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="flex items-center gap-2 mt-14"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-sage-300 animate-pulse"
            style={{ animationDelay: `${i * 0.22}s` }}
          />
        ))}
      </motion.div>
    </div>
  );
}
