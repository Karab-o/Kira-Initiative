import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Send, AlertTriangle, ArrowLeft, Stethoscope } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Badge from '../../components/ui/Badge.jsx';
import MessageBubble from '../components/MessageBubble.jsx';
import TypingDots from '../components/TypingDots.jsx';
import { useSession } from '../../hooks/useSession.js';

const PROMPTS = [
  'I noticed unusual discharge…',
  'I have pain or burning when I urinate',
  'I may have been exposed to an STI',
  'I have questions about contraception',
];

export default function Chat() {
  const navigate = useNavigate();
  const session  = useSession();
  const [text, setText]               = useState('');
  const [showDoctorCta, setShowDoctorCta] = useState(false);
  const scrollRef  = useRef(null);

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
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="px-5 py-4 border-b border-[#E5DDD7] flex items-center justify-between gap-3 bg-white">
        <button
          onClick={() => navigate('/patient/home')}
          className="text-coal-muted hover:text-coal transition p-1 -ml-1 rounded-lg hover:bg-sage-50"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <Badge tone="sage" dot>Anonymous</Badge>

        {/* empty spacer to keep badge centred */}
        <span className="w-8" />
      </header>

      {/* ── Messages ───────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-cream/40">
        {session.messages.length === 0 && (
          <div className="text-center py-8">
            <h3 className="font-display font-bold text-[20px] text-coal mb-2">
              What's on your mind?
            </h3>
            <p className="text-[14px] text-coal-muted mb-6">
              Everything you share here stays completely private.
            </p>
            <div className="flex flex-col gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-left px-4 py-2.5 rounded-xl bg-white border border-[#E5DDD7] text-[14px] text-coal hover:border-sage-300 hover:bg-sage-50 transition"
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
          <div className="flex justify-start">
            <TypingDots />
          </div>
        )}

        {/* Doctor escalation CTA */}
        {showDoctorCta && (
          <div className="card p-4 mt-4 border-care-amber/30 bg-care-amber-bg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-care-amber flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-coal">
                  A specialist could help with this
                </p>
                <p className="text-[13px] text-coal-muted mt-1">
                  Your chat stays private — only a brief AI summary is shared with the doctor.
                </p>
                <button
                  onClick={() => navigate('/patient/escalation')}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-sage-500 hover:text-sage-600 transition"
                >
                  <Stethoscope size={14} />
                  Connect with a specialist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Composer ───────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-5 border-t border-[#E5DDD7] bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your concern…"
            rows={1}
            className="input-field resize-none max-h-32 text-[14px] !py-3"
          />
          <button
            onClick={() => send()}
            disabled={!text.trim() || session.isTyping}
            className="btn-primary !p-3 !rounded-xl flex-shrink-0"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
        <Link
          to="/patient/helpdesk"
          className="block text-center text-[11px] text-coal-subtle mt-2.5 hover:text-care-red transition"
        >
          Urgent? Call a hospital helpdesk
        </Link>
      </div>
    </MobileFrame>
  );
}
