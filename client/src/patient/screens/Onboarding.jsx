import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, MessageCircle, Stethoscope } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';
import { useSessionStore } from '../../stores/sessionStore.js';

const SLIDES = [
  {
    icon: Lock,
    bg: 'bg-sage-100',
    fg: 'text-sage-500',
    title: 'Your privacy is sacred',
    body: 'Anonymous sessions. No account, no history, no judgment. When you close the tab, the conversation ends — for good. No one can trace it back to you.',
  },
  {
    icon: MessageCircle,
    bg: 'bg-sage-100',
    fg: 'text-sage-500',
    title: 'Sexual health, openly',
    body: 'Chat about STIs, contraception, discharge, pain, sexual function, HIV exposure, fertility — anything. Kira is knowledgeable, discreet, and judgment-free for both women and men.',
  },
  {
    icon: Stethoscope,
    bg: 'bg-sage-100',
    fg: 'text-sage-500',
    title: 'Real specialists when you need them',
    body: 'If your concern needs a doctor, Kira connects you to verified gynaecologists or urologists in Rwanda. Your AI chat stays private — only a brief clinical summary is shared.',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const setOnboarded = useSessionStore((s) => s.setOnboarded);

  const finish = () => {
    setOnboarded();
    navigate('/patient/home', { replace: true });
  };

  const next = () => (index < SLIDES.length - 1 ? setIndex(index + 1) : finish());

  const slide = SLIDES[index];
  const Icon  = slide.icon;

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col px-7 pt-12 pb-8">

        {/* Skip */}
        <button
          onClick={finish}
          className="self-end text-[14px] text-coal-muted hover:text-coal font-medium transition"
        >
          Skip
        </button>

        {/* Slide */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.32 }}
              className="w-full"
            >
              <div className={`w-[72px] h-[72px] mx-auto rounded-3xl ${slide.bg} flex items-center justify-center mb-10`}>
                <Icon className={slide.fg} size={32} />
              </div>
              <h2 className="font-display font-bold text-[28px] text-coal mb-4 leading-tight">
                {slide.title}
              </h2>
              <p className="text-coal-muted text-[15px] leading-relaxed max-w-xs mx-auto">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-8 bg-sage-500'
                  : 'w-1.5 bg-coal-subtle/40'
              }`}
            />
          ))}
        </div>

        <Button onClick={next} size="lg" className="w-full">
          {index === SLIDES.length - 1 ? 'Get started' : 'Continue'}
        </Button>
      </div>
    </MobileFrame>
  );
}
