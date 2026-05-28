import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, FileText, Plus, NotebookPen } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { TextArea } from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import { api, apiError } from '../../lib/api.js';
import { useConsultationSocket } from '../../hooks/useSocket.js';
import { useDoctorStore } from '../../stores/doctorStore.js';
import { cn } from '../../lib/cn.js';

export default function Consultation() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { token } = useDoctorStore();
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, mRes, nRes] = await Promise.all([
          api.get(`/consultations/${consultationId}`),
          api.get(`/consultations/${consultationId}/messages`),
          api.get(`/consultations/${consultationId}/internal-notes`),
        ]);
        setConsultation(cRes.data.consultation);
        setMessages(mRes.data.messages);
        setNotes(nRes.data.notes);
      } catch (err) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [consultationId]);

  const { sendMessage, joined } = useConsultationSocket({
    consultationId,
    doctorToken: token,
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

  const addNote = async () => {
    const content = noteDraft.trim();
    if (!content) return;
    try {
      const { data } = await api.post(`/consultations/${consultationId}/internal-notes`, { content });
      setNotes((arr) => [data.note, ...arr]);
      setNoteDraft('');
    } catch (err) { setError(apiError(err)); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (error) return <p className="text-sm text-care-red">{error}</p>;
  if (!consultation) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/doctor/case/${consultation.escalation.id}`)} className="text-coal-muted hover:text-coal transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl text-coal leading-tight">{consultation.escalation.patientName}</h1>
          <p className="text-xs text-coal-muted">{consultation.escalation.hospital?.name} · age {consultation.escalation.patientAge}</p>
        </div>
        <RiskBadge value={consultation.riskLevel || consultation.escalation.severityAtEscalation} />
        <Link to={`/doctor/consultation/${consultationId}/soap`} className="btn-primary">
          <NotebookPen size={14} /> SOAP
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: case summary */}
        <aside className="xl:col-span-3 card p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-coal-muted mb-3">Concern</p>
          <p className="text-sm text-coal leading-relaxed mb-4">{consultation.escalation.escalationReason}</p>
          <div className="border-t border-border pt-4 space-y-2 text-xs text-coal-muted">
            <p><span className="text-coal font-medium">Severity:</span> {consultation.escalation.severityAtEscalation}</p>
            <p><span className="text-coal font-medium">Status:</span> {consultation.status}</p>
            <p><span className="text-coal font-medium">Phone:</span> {consultation.escalation.patientPhone}</p>
          </div>
        </aside>

        {/* Middle: chat */}
        <section className="xl:col-span-6 card !p-0 flex flex-col h-[70vh]">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium text-coal">Live consultation</p>
            <Badge tone={joined ? 'green' : 'neutral'} dot>{joined ? 'Connected' : 'Connecting'}</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-coal-muted py-6">No messages yet.</p>
            )}
            {messages.map((m) => {
              const mine = m.senderRole === 'doctor';
              return (
                <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[75%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl',
                    mine
                      ? 'bg-sage-500 text-white rounded-br-sm'
                      : 'bg-surface-muted border border-border text-coal rounded-bl-sm',
                  )}>
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-3 py-3 border-t border-border flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Reply to patient…"
              rows={1}
              className="input-field resize-none text-sm py-3"
            />
            <button onClick={send} disabled={!text.trim()} className="btn-primary !p-3" aria-label="Send"><Send size={18} /></button>
          </div>
        </section>

        {/* Right: internal notes */}
        <aside className="xl:col-span-3 card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-coal">Internal notes</p>
            <Badge tone="amber" dot>Doctor only</Badge>
          </div>
          <p className="text-[11px] text-coal-muted mb-3">These are never visible to the patient.</p>

          <TextArea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add an observation…"
            rows={3}
          />
          <Button size="sm" onClick={addNote} className="mt-2 self-start"><Plus size={14} /> Save note</Button>

          <div className="mt-4 space-y-2 overflow-y-auto max-h-[40vh]">
            {notes.length === 0 && <p className="text-xs text-coal-muted">No notes yet.</p>}
            {notes.map((n) => (
              <div key={n.id} className="bg-surface-soft border border-border rounded-xl p-3 text-xs">
                <p className="text-coal leading-relaxed whitespace-pre-wrap">{n.content}</p>
                <p className="text-[10px] text-coal-muted mt-2 font-mono">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
