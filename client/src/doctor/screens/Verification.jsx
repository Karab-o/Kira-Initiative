import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Check, X, RefreshCcw, LogOut } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useDoctorStore } from '../../stores/doctorStore.js';

export default function Verification() {
  const navigate = useNavigate();
  const { doctor } = useDoctorStore();
  const { refresh, logout } = useAuth();

  useEffect(() => {
    if (doctor?.verificationStatus === 'approved') navigate('/doctor/dashboard', { replace: true });
  }, [doctor, navigate]);

  const onRefresh = async () => {
    try {
      const d = await refresh();
      if (d?.verificationStatus === 'approved') navigate('/doctor/dashboard', { replace: true });
    } catch {}
  };

  const onLogout = async () => {
    await logout();
    navigate('/doctor/login', { replace: true });
  };

  const status = doctor?.verificationStatus || 'pending';

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="card-ink max-w-md w-full text-center">
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-care-amber-bg border border-care-amber/40 flex items-center justify-center mb-5">
              <Clock className="text-care-amber animate-pulse-soft" size={28} />
            </div>
            <h2 className="font-display text-2xl mb-2">Application under review</h2>
            <p className="text-sm text-muted-fg mb-6">
              We're verifying your medical license. Most applications are reviewed within 24–48 hours.
            </p>
          </>
        )}
        {status === 'approved' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-care-green-bg border border-care-green/40 flex items-center justify-center mb-5">
              <Check className="text-care-green" size={32} />
            </div>
            <h2 className="font-display text-2xl mb-2">Welcome, {doctor?.fullName}</h2>
            <p className="text-sm text-muted-fg mb-6">Taking you to your dashboard…</p>
          </>
        )}
        {status === 'rejected' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-care-red-bg border border-care-red/40 flex items-center justify-center mb-5">
              <X className="text-care-red" size={32} />
            </div>
            <h2 className="font-display text-2xl mb-2">Application not approved</h2>
            <p className="text-sm text-muted-fg mb-6">
              {doctor?.verificationNote || 'Please contact admin@kirainitiative.rw for next steps.'}
            </p>
          </>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onRefresh} className="flex-1">
            <RefreshCcw size={14} /> Check again
          </Button>
          <Button variant="ghost" onClick={onLogout} className="flex-1">
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
