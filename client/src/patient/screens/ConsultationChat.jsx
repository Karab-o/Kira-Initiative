import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, FileText, Phone } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { api, apiError } from '../../lib/api.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import { useConsultationSocket } from '../../hooks/useSocket.js';
import { cn } from '../../lib/cn.js';

export default function ConsultationChat() {
  const navigate = useNavigate();
  const { sessionToken, escalation, consultationId, setConsultation } = useSessionStore();
  const [consultation, setConsultationDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!escalation) { navigate('/patient/home', { replace: true }); return; }
    (async () => {
      try {
        let cId = consultationId;
        if (!cId) {
          const escDetail = await api.get(`/escalations/${escalation.id}`, {
            headers: { 'X-Session-Token': sessionToken },
          }).catch(() => null);
          cId = escDetail?.data?.escalation?.consultation?.id;
        }
        if (!cId) {
          // Consultation may not exist yet — wait for a doctor to open one
          setLoading(false);
          return;
        }
        setConsultation(cId);
        const [cRes, mRes] = await Promise.all([
          api.get(`/consultations/${cId}`, { headers: { 'X-Session-Token': sessionToken } }),
          api.get(`/consultations/${cId}/messages`, { headers: { 'X-Session-Token': sessionToken } }),
        ]);
        setConsultationDetail(cRes.data.consultation);
        setMessages(mRes.data.messages);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { sendMessage, joined } = useConsultationSocket({
    consultationId,
    sessionToken,
    onMessage: (m) => setMessages((arr) => [...arr, m]),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(t);
    setText('');
  };

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex-1 flex items-center justify-center">
          <Spinner size={28} />
        </div>
      </MobileFrame>
    );
  }

  if (!consultation) {
    return (
      <MobileFrame>
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <button onClick={() => navigate('/patient/home')} className="text-coal-muted hover:text-coal transition">
            <ArrowLeft size={18} />
          </button>
          <span className="font-display text-base text-coal">Consultation</span>
          <span className="w-5" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
          <Spinner size={28} />
          <h3 className="font-display text-xl text-coal mt-5">Waiting for a doctor</h3>
          <p className="text-sm text-coal-muted mt-2 max-w-xs">
            Your case has been submitted. A doctor at {escalation?.hospital?.name || 'your hospital'} will open the consultation shortly.
          </p>
        </div>
      </MobileFrame>
    );
  }

  const doctor = consultation.doctor;

  return (
    <MobileFrame>
      {/* Header */}
      <header className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/patient/home')} className="text-coal-muted hover:text-coal transition">
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-coal leading-tight">{doctor?.fullName}</p>
            <p className="text-[11px] text-coal-muted">{doctor?.specialty}</p>
          </div>
          <a href="#" className="text-coal-muted hover:text-coal transition">
            <Phone size={18} />
          </a>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge tone="mint" dot>Secure consultation</Badge>
          <Badge tone={joined ? 'green' : 'neutral'} dot>{joined ? 'Connected' : 'Connecting'}</Badge>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Privacy notice */}
        <div className="card !bg-sage-50 !border-sage-100 p-3 flex items-start gap-3">
          <ShieldCheck className="text-sage-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-coal-muted leading-relaxed">
            You're now in a verified consultation with a real doctor. Messages here are not shared with the AI.
          </p>
        </div>

        {messages.length === 0 && (
          <p className="text-center text-sm text-coal-muted py-8">Say hello to start the conversation.</p>
        )}

        {messages.map((m) => {
          const isMe = m.senderRole === 'patient';
          return (
            <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[82%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl',
                isMe
                  ? 'bg-sage-500 text-white rounded-br-sm'
                  : 'bg-surface-muted border border-border text-coal rounded-bl-sm',
              )}>
                {m.content}
              </div>
            </div>
          );
        })}

        {/* Prescription card */}
        {consultation.prescription && (
          <div className="card mt-4 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-care-amber-bg border border-care-amber/30 flex items-center justify-center">
              <FileText className="text-care-amber" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-coal font-medium">Your prescription</p>
              <p className="text-xs text-coal-muted">{consultation.prescription.notes || 'Download below'}</p>
            </div>
            <a
              href={consultation.prescription.filePath}
              target="_blank"
              rel="noreferrer"
              className="text-sage-500 hover:text-sage-600 text-sm font-medium transition"
            >
              Open
            </a>
          </div>
        )}

        {error && <p className="text-sm text-care-red">{error}</p>}
      </div>

      {/* Input bar */}
      <div className="px-4 pt-3 pb-5 border-t border-border bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message your doctor…"
            rows={1}
            className="input-field resize-none text-sm py-3"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="btn-primary !p-3 !rounded-xl disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}
