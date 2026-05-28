import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';
import { useSession } from '../../hooks/useSession.js';
import { apiError } from '../../lib/api.js';

export default function SessionStart() {
  const navigate = useNavigate();
  const { create, sessionToken } = useSession();
  const [state, setState] = useState('loading'); // loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionToken) {
      navigate('/patient/chat', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await create('en');
        if (cancelled) return;
        setState('success');
        setTimeout(() => navigate('/patient/chat', { replace: true }), 700);
      } catch (err) {
        if (cancelled) return;
        setError(apiError(err));
        setState('error');
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {state === 'loading' && (
          <>
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-sage-200/50 blur-xl animate-pulse-soft" />
              <div className="relative w-20 h-20 rounded-full border-[3px] border-sage-100 border-t-sage-500 animate-spin" />
            </div>
            <h2 className="font-display text-2xl text-coal mb-2">Creating your private session…</h2>
            <p className="text-sm text-coal-muted max-w-xs">Just a moment. We're setting up a space only you can see.</p>
          </>
        )}

        {state === 'success' && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-care-green-bg border border-care-green/30 flex items-center justify-center mb-6 mx-auto">
              <Check className="text-care-green" size={32} />
            </div>
            <h2 className="font-display text-2xl text-coal mb-2">You're in</h2>
            <p className="text-sm text-coal-muted">Taking you to the chat…</p>
          </motion.div>
        )}

        {state === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-care-red-bg border border-care-red/20 flex items-center justify-center mb-6">
              <AlertCircle className="text-care-red" size={32} />
            </div>
            <h2 className="font-display text-2xl text-coal mb-2">Couldn't start your session</h2>
            <p className="text-sm text-coal-muted mb-6">{error}</p>
            <Button onClick={() => location.reload()}>Try again</Button>
          </>
        )}
      </div>
    </MobileFrame>
  );
}
