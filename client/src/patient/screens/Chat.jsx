import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Send, Lock, AlertTriangle, ArrowLeft, Stethoscope } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Badge from '../../components/ui/Badge.jsx';
import MessageBubble from '../components/MessageBubble.jsx';
import TypingDots from '../components/TypingDots.jsx';
import { useSession } from '../../hooks/useSession.js';
import { useSessionStore } from '../../stores/sessionStore.js';

const PROMPTS = [
  "I've been feeling exhausted lately…",
  'I have a rash on my neck',
  "I'm worried about my blood pressure",
  "I'm stressed and can't sleep",
];

export default function Chat() {
  const navigate = useNavigate();
  const session = useSession();
  const [text, setText] = useState('');
  const [showDoctorCta, setShowDoctorCta] = useState(false);
  const scrollRef = useRef(null);
  const scanLocked = useSessionStore((s) => s.scanLocked);

  useEffect(() => {
    if (!session.sessionToken) navigate('/patient/session', { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.sessionToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [session.messages, session.isTyping]);

  const send = async (msg) => {
    const content = (msg ?? text).trim();
    if (!content || session.isTyping) return;
    setText('');
    try {
      const res = await session.sendChat(content);
      if (res?.triggerDoctor) setShowDoctorCta(true);
    } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <MobileFrame>
      {/* Header */}
      <header className="px-5 py-4 border-b border-mint-300/10 flex items-center justify-between gap-3">
        <button onClick={() => navigate('/patient/home')} className="text-muted-fg hover:text-white transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Badge tone="mint" dot>Anonymous</Badge>
        </div>
        <button
          onClick={() => navigate(scanLocked ? '/patient/scan-locked' : '/patient/scan')}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
            scanLocked
              ? 'border-muted-fg/20 text-muted-fg'
              : 'border-mint-300/30 text-mint-200 hover:bg-mint-300/10'
          }`}
        >
          {scanLocked ? <Lock size={12} /> : <Camera size={12} />}
          Scan
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {session.messages.length === 0 && (
          <div className="text-center py-8">
            <h3 className="font-display text-xl text-white mb-2">What's on your mind?</h3>
            <p className="text-sm text-muted-fg mb-6">Everything you say here stays private.</p>
            <div className="flex flex-col gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-left px-4 py-2.5 rounded-xl bg-ink-700 border border-mint-300/10 text-sm text-white hover:border-mint-300/30 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {session.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {session.isTyping && (
          <div className="flex justify-start"><TypingDots /></div>
        )}

        {showDoctorCta && (
          <div className="card-ink p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-care-amber flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">A doctor could help with this</p>
                <p className="text-xs text-muted-fg mt-1">Your chat stays private — only a brief summary is shared.</p>
                <button
                  onClick={() => navigate('/patient/escalation')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ember-500 hover:text-ember-400"
                >
                  <Stethoscope size={14} /> Connect with a doctor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 pt-3 pb-5 border-t border-mint-300/10 bg-ink-900/80 backdrop-blur">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your concern…"
            rows={1}
            className="input-ink resize-none max-h-32 text-sm py-3"
          />
          <button
            onClick={() => send()}
            disabled={!text.trim() || session.isTyping}
            className="btn-primary !p-3 !rounded-xl"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
        <Link
          to="/patient/helpdesk"
          className="block text-center text-[11px] text-muted-fg/70 mt-2.5 hover:text-care-red transition"
        >
          Urgent? Call a hospital helpdesk
        </Link>
      </div>
    </MobileFrame>
  );
}
