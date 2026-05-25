import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, MessageCircle, UserRound } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';
import { useSessionStore } from '../../stores/sessionStore.js';

const SLIDES = [
  {
    icon: Lock,
    title: 'Your privacy is sacred',
    body: 'Anonymous sessions. No account, no history, no judgment. When you close the tab, the conversation ends — for good.',
  },
  {
    icon: MessageCircle,
    title: 'AI guidance, human care',
    body: 'Chat about anything — sexual health, stress, pain, sleep. Kira can also analyse a photo of your face, eyes, neck or mouth.',
  },
  {
    icon: UserRound,
    title: 'Real doctors when you need them',
    body: 'If something needs a doctor, Kira can connect you to verified clinicians in Rwanda — your AI chat history stays private.',
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

  const next = () => {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else finish();
  };

  const Slide = SLIDES[index];
  const Icon = Slide.icon;

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col px-7 pt-12 pb-8">
        <button
          onClick={finish}
          className="self-end text-sm text-muted-fg hover:text-white transition"
        >
          Skip
        </button>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-mint-400/30 to-mint-600/20 border border-mint-300/20 flex items-center justify-center mb-10">
                <Icon className="text-mint-200" size={34} />
              </div>
              <h2 className="font-display text-3xl text-white mb-4 leading-tight">{Slide.title}</h2>
              <p className="text-muted-fg text-base leading-relaxed max-w-xs mx-auto">{Slide.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-8 bg-ember-500' : 'w-1.5 bg-muted-fg/30'
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
