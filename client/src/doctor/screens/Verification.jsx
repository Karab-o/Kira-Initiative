import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Check, X, RefreshCcw, LogOut, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const states = {
    pending: {
      icon: Clock,
      iconBg: 'bg-care-amber-bg border-care-amber/30',
      iconColor: 'text-care-amber animate-pulse-soft',
      title: 'Application under review',
      body: "We're verifying your credentials against hospital records. Most applications are reviewed within 24–48 hours.",
    },
    approved: {
      icon: Check,
      iconBg: 'bg-sage-100 border-sage-200',
      iconColor: 'text-sage-500',
      title: `Welcome, ${doctor?.fullName?.split(' ')[0] || 'Doctor'}`,
      body: 'Your account is verified. Taking you to your dashboard…',
    },
    rejected: {
      icon: X,
      iconBg: 'bg-care-red-bg border-care-red/30',
      iconColor: 'text-care-red',
      title: 'Application not approved',
      body: doctor?.verificationNote || 'Please contact admin@kirainitiative.rw for next steps.',
    },
  };

  const s = states[status] || states.pending;
  const StatusIcon = s.icon;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-md p-8 text-center"
      >
        {/* Status icon */}
        <div className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center mb-5 ${s.iconBg}`}>
          <StatusIcon className={s.iconColor} size={28} />
        </div>

        <h2 className="font-display font-bold text-[26px] text-coal mb-2">{s.title}</h2>
        <p className="text-[14px] text-coal-muted mb-8 leading-relaxed">{s.body}</p>

        {/* Hospital badge */}
        {doctor?.hospitalName && (
          <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200 rounded-full px-4 py-1.5 mb-6">
            <ShieldAlert size={13} className="text-sage-500" />
            <span className="text-[12px] font-semibold text-coal">{doctor.hospitalName}</span>
          </div>
        )}

        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={onRefresh} className="flex-1">
            <RefreshCcw size={14} /> Check again
          </Button>
          <Button variant="ghost" onClick={onLogout} className="flex-1">
            <LogOut size={14} /> Sign out
          </Button>
        </div>

        <p className="text-[12px] text-coal-subtle mt-6">
          Questions? Contact{' '}
          <a href="mailto:admin@kirainitiative.rw" className="text-sage-500 hover:underline">
            admin@kirainitiative.rw
          </a>
        </p>
      </motion.div>
    </div>
  );
}
