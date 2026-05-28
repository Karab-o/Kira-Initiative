import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, Stethoscope, KeyRound, User } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';


export default function Login() {
  const navigate = useNavigate();
  const { login, apiError: getErr } = useAuth();

  const [step, setStep]       = useState('credentials'); // 'credentials' | '2fa'
  const [form, setForm]       = useState({
    email: '', medicalId: '',
    accessCode: '', password: '', twoFAToken: '',
  });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitCredentials = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.accessCode)  return setError('Doctor access code is required.');

    setLoading(true);
    try {
      const data = await login({
        email:      form.email || undefined,
        medicalId:  form.medicalId || undefined,
        accessCode: form.accessCode,
        password:   form.password,
      });

      if (data?.requires2FA) {
        setStep('2fa');
      } else if (data?.requiresVerification) {
        navigate('/doctor/verification', { replace: true });
      } else {
        navigate('/doctor/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = getErr(err);
      if (msg?.includes('2FA') || err.response?.status === 403) {
        setStep('2fa');
        setError('Enter the 6-digit code sent to your email or authenticator app.');
      } else {
        setError(msg || 'Sign-in failed. Check your credentials and access code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const submit2FA = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login({ ...form });
      if (data?.requiresVerification) {
        navigate('/doctor/verification', { replace: true });
      } else {
        navigate('/doctor/dashboard', { replace: true });
      }
    } catch (err) {
      setError(getErr(err) || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream">

      {/* ── Brand panel (desktop) ───────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 p-12 bg-white border-r border-[#E5DDD7] max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center shadow-green">
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
              <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-[17px] text-coal leading-tight">Kira Initiative</p>
            <p className="text-[11px] font-mono uppercase tracking-wider text-coal-muted">Clinical Portal</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="font-display font-bold text-[36px] leading-tight text-coal mb-4">
            Care for men who quietly carry too much.
          </h1>
          <p className="text-coal-muted text-[15px] leading-relaxed mb-10">
            Pick up cases escalated from anonymous AI chats. Patients arrive pre-triaged with a structured summary — you focus on the conversation that matters.
          </p>

          <div className="space-y-3">
            <SecurityPill icon={ShieldCheck}  label="Hospital-verified access only" />
            <SecurityPill icon={KeyRound}     label="Unique doctor access codes" />
            <SecurityPill icon={Stethoscope}  label="Specialty-matched case routing" />
            <SecurityPill icon={Lock}         label="Two-factor authentication" />
          </div>
        </div>

        <p className="text-[12px] text-coal-subtle mt-auto">
          Built for clinicians in Rwanda · © 2025 Kira Initiative
        </p>
      </div>

      {/* ── Form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-sm py-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center shadow-green">
              <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
                <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display font-bold text-[17px] text-coal">Kira Clinical</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Credentials ──────────────────────── */}
            {step === 'credentials' && (
              <motion.form
                key="creds"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                onSubmit={submitCredentials}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-display font-bold text-[28px] text-coal mb-1">Doctor sign in</h2>
                  <p className="text-[14px] text-coal-muted">
                    Access is restricted to hospital-verified clinicians only.
                  </p>
                </div>

                {/* Identity */}
                <div className="card p-4 space-y-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-coal-muted flex items-center gap-1.5">
                    <User size={11} /> Identity
                  </p>
                  <Input
                    label="Work email"
                    type="email"
                    placeholder="s.uwase@rmh.gov.rw"
                    value={form.email}
                    onChange={set('email')}
                    required
                    autoComplete="email"
                    hint="Used as your login identifier"
                  />
                  <Input
                    label="Medical / Employee ID"
                    placeholder="RW-GYN-4420"
                    value={form.medicalId}
                    onChange={set('medicalId')}
                    autoComplete="off"
                    hint="Optional — or sign in with email only"
                  />
                </div>

                {/* Credentials */}
                <div className="card p-4 space-y-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-coal-muted flex items-center gap-1.5">
                    <KeyRound size={11} /> Credentials
                  </p>
                  <Input
                    label="Doctor access code"
                    placeholder="KIRA-RMH-XXXX"
                    value={form.accessCode}
                    onChange={set('accessCode')}
                    required
                    autoComplete="off"
                    hint="Issued by your hospital administrator"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <p className="text-[13px] text-care-red bg-care-red-bg border border-care-red/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  <Lock size={16} /> Sign in to portal
                </Button>

                <div className="flex items-center justify-between text-[13px] text-coal-muted pt-1">
                  <Link to="/doctor/signup" className="hover:text-coal transition">
                    Have an access code? Set up account
                  </Link>
                  <a href="mailto:admin@kirainitiative.rw" className="hover:text-coal transition">
                    Need help?
                  </a>
                </div>
              </motion.form>
            )}

            {/* ── Step 2: 2FA OTP ─────────────────────────── */}
            {step === '2fa' && (
              <motion.form
                key="2fa"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                onSubmit={submit2FA}
                className="space-y-5"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center mb-5">
                    <ShieldCheck size={26} className="text-sage-500" />
                  </div>
                  <h2 className="font-display font-bold text-[28px] text-coal mb-1">
                    Two-factor verification
                  </h2>
                  <p className="text-[14px] text-coal-muted">
                    Enter the 6-digit code sent to your registered email or authenticator app.
                  </p>
                </div>

                {/* OTP input */}
                <Input
                  label="Verification code"
                  placeholder="000 000"
                  value={form.twoFAToken}
                  onChange={set('twoFAToken')}
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength={7}
                  autoFocus
                  required
                />

                <div className="card p-4">
                  <p className="text-[13px] text-coal-muted leading-relaxed">
                    Code valid for <span className="font-semibold text-coal">5 minutes</span>. Check your hospital email or authenticator app.
                  </p>
                </div>

                {error && (
                  <p className="text-[13px] text-care-red bg-care-red-bg border border-care-red/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  <ShieldCheck size={16} /> Verify &amp; enter portal
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(null); }}
                  className="w-full text-[13px] text-coal-muted hover:text-coal transition"
                >
                  ← Back to sign in
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SecurityPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-coal-light">
      <div className="w-6 h-6 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-sage-500" />
      </div>
      {label}
    </div>
  );
}
