import { useNavigate } from 'react-router-dom';
import { Lock, MessageCircle, Stethoscope } from 'lucide-react';
import MobileFrame from '../../components/layout/MobileFrame.jsx';
import Button from '../../components/ui/Button.jsx';

export default function ScanLocked() {
  const navigate = useNavigate();
  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
        <div className="w-20 h-20 rounded-3xl bg-care-amber-bg border border-care-amber/30 flex items-center justify-center mb-6">
          <Lock className="text-care-amber" size={32} />
        </div>
        <h2 className="font-display text-2xl text-coal mb-3">Scan unavailable for this</h2>
        <p className="text-sm text-coal-muted leading-relaxed max-w-xs mb-8">
          For topics like this, a conversation with Kira or a doctor consultation gives you much better support than a scan.
        </p>
        <div className="w-full space-y-3">
          <Button onClick={() => navigate('/patient/chat')} className="w-full">
            <MessageCircle size={18} /> Continue chatting
          </Button>
          <Button onClick={() => navigate('/patient/escalation')} variant="ghost" className="w-full">
            <Stethoscope size={18} /> Book a doctor
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
}
