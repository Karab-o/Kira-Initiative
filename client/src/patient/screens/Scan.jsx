import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ShieldCheck, RotateCcw } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import CareBadge from '../../components/ui/CareBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import BodyAreaGuide from '../components/BodyAreaGuide.jsx';
import { api, apiError } from '../../lib/api.js';
import { useSessionStore } from '../../stores/sessionStore.js';

export default function Scan() {
  const navigate = useNavigate();
  const { sessionToken, scanLocked } = useSessionStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | uploading | analysing | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  if (!sessionToken) { navigate('/patient/home', { replace: true }); return null; }
  if (scanLocked) { navigate('/patient/scan-locked', { replace: true }); return null; }

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase('idle');
    setError(null);
    setResult(null);
  };

  const submit = async () => {
    if (!file) return;
    try {
      setPhase('uploading');
      const form = new FormData();
      form.append('image', file);
      form.append('sessionToken', sessionToken);
      setPhase('analysing');
      const { data } = await api.post('/scans', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data?.approved === false) {
        setError(data.reason || 'Image not accepted');
        setPhase('error');
        if (data.scanLocked) {
          setTimeout(() => navigate('/patient/scan-locked'), 800);
        }
        return;
      }
      setResult(data);
      setPhase('result');
    } catch (err) {
      setError(apiError(err));
      setPhase('error');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setPhase('idle');
  };

  return (
    <MobileFrame>
      <header className="px-5 py-4 border-b border-mint-300/10 flex items-center justify-between">
        <button onClick={() => navigate('/patient/chat')} className="text-muted-fg hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-base">Scan</span>
        <span className="w-5" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <h2 className="font-display text-2xl text-white mb-2">Check a visible symptom</h2>
        <p className="text-sm text-muted-fg mb-5">Face, neck, eyes and mouth only — nothing else is accepted.</p>

        <BodyAreaGuide className="mb-6" />

        {!preview && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-mint-300/30 bg-mint-300/5 hover:border-mint-300/60 transition flex flex-col items-center justify-center gap-3 text-mint-200"
          >
            <Camera size={28} />
            <span className="text-sm font-medium">Tap to photograph</span>
            <span className="text-xs text-muted-fg">JPG / PNG · 5MB max</span>
          </button>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-mint-300/15">
              <img src={preview} alt="preview" className="w-full aspect-[4/3] object-cover" />
              {(phase === 'uploading' || phase === 'analysing') && (
                <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <Spinner size={28} />
                  <p className="text-sm text-mint-200">
                    {phase === 'uploading' ? 'Uploading securely…' : 'Analysing image privately…'}
                  </p>
                </div>
              )}
            </div>

            {phase === 'result' && result && (
              <div className="card-ink space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone="mint">{result.bodyArea}</Badge>
                  <CareBadge severity={result.severity} text={result.careBadgeText} />
                </div>
                <Field label="What we noticed" value={result.observations} />
                <Field label="Possible causes" value={result.possibleCauses} />
                <Field label="Next step" value={result.recommendation} />
              </div>
            )}

            {phase === 'error' && (
              <div className="card-ink !bg-care-red-bg border-care-red/30">
                <p className="text-sm text-care-red font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              {phase !== 'result' && (
                <Button onClick={submit} disabled={phase === 'uploading' || phase === 'analysing'} loading={phase === 'uploading' || phase === 'analysing'} className="flex-1">
                  Analyse
                </Button>
              )}
              <Button onClick={reset} variant="ghost" className="flex-1">
                <RotateCcw size={16} /> {phase === 'result' ? 'Try another' : 'Pick different'}
              </Button>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />

        <div className="card-ink mt-6 flex items-start gap-3">
          <ShieldCheck className="text-mint-300 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-muted-fg leading-relaxed">
            Your image is analysed privately and deleted from our servers right after — only the text result is kept in this session.
          </p>
        </div>
      </div>
    </MobileFrame>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider font-mono text-muted-fg mb-1">{label}</p>
      <p className="text-sm text-white leading-relaxed">{value}</p>
    </div>
  );
}
