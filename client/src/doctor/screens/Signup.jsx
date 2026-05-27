import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ShieldCheck, KeyRound, Building2, Lock } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const STEPS = [
  { id: 'code',     label: 'Access code' },
  { id: 'personal', label: 'Your details' },
  { id: 'done',     label: 'Done' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup, validateCode: apiValidateCode, apiError: getErr } = useAuth();

  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState({
    accessCode: '', fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [codeInfo, setCodeInfo] = useState(null); // resolved hospital + specialty from code
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Step 0 — validate access code against backend
  const handleValidateCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiValidateCode(form.accessCode);
      setCodeInfo({ hospital: result.hospital.name, specialty: result.specialty, code: result.code });
      setStep(1);
    } catch (err) {
      setError(getErr(err) || 'Invalid access code. Contact your hospital administrator.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 — submit full signup
  const submitSignup = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    setLoading(true);
    try {
      await signup({
        accessCode:  codeInfo.code,
        fullName:    form.fullName,
        email:       form.email,
        password:    form.password,
      });
      setStep(2);
    } catch (err) {
      setError(getErr(err) || 'Setup failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        {/* Back link */}
        {step < 2 && (
          <Link
            to="/doctor/login"
            className="inline-flex items-center gap-1.5 text-[13px] text-coal-muted hover:text-coal mb-6 transition"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        )}

        {/* Step indicators */}
        {step < 2 && (
          <div className="flex items-center gap-2 mb-7">
            {STEPS.slice(0, 2).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition ${
                  i < step  ? 'bg-sage-500 text-white' :
                  i === step ? 'bg-sage-500 text-white ring-4 ring-sage-100' :
                               'bg-surface-muted text-coal-muted'
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-[13px] font-medium ${i === step ? 'text-coal' : 'text-coal-muted'}`}>
                  {s.label}
                </span>
                {i < 1 && <div className="flex-1 h-px bg-[#E5DDD7] mx-1" />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 0: Access code ─────────────────────── */}
          {step === 0 && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card p-7">
                <div className="w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center mb-5">
                  <KeyRound size={26} className="text-sage-500" />
                </div>
                <h2 className="font-display font-bold text-[26px] text-coal mb-2">
                  Enter your access code
                </h2>
                <p className="text-[14px] text-coal-muted mb-6 leading-relaxed">
                  Doctor accounts are invitation-only. Your hospital administrator provides a unique access code when onboarding you to Kira Initiative.
                </p>

                <form onSubmit={handleValidateCode} className="space-y-4">
                  <Input
                    label="Doctor access code"
                    placeholder="KIRA-RMH-82JH"
                    value={form.accessCode}
                    onChange={set('accessCode')}
                    required
                    autoComplete="off"
                    hint="Format: KIRA-XXX-XXXX (case-insensitive)"
                  />
                  {error && (
                    <p className="text-[13px] text-care-red bg-care-red-bg border border-care-red/20 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    <ShieldCheck size={16} /> Verify access code
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#E5DDD7]">
                  <p className="text-[12px] text-coal-muted text-center">
                    Don't have a code?{' '}
                    <a
                      href="mailto:admin@kirainitiative.rw"
                      className="text-sage-500 hover:text-sage-600 font-medium"
                    >
                      Contact admin@kirainitiative.rw
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Personal details ────────────────── */}
          {step === 1 && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card p-7">
                {/* Code confirmed banner */}
                {codeInfo && (
                  <div className="flex items-center gap-2.5 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 mb-6">
                    <Building2 size={15} className="text-sage-500 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-coal">{codeInfo.hospital}</p>
                      <p className="text-[11px] text-coal-muted font-mono">{codeInfo.code}</p>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                )}

                <h2 className="font-display font-bold text-[24px] text-coal mb-1">Set up your account</h2>
                <p className="text-[14px] text-coal-muted mb-6">
                  This creates your personal login credentials.
                </p>

                <form onSubmit={submitSignup} className="space-y-4">
                  <Input
                    label="Full name"
                    placeholder="Dr. Sarah Uwase"
                    value={form.fullName}
                    onChange={set('fullName')}
                    required
                    autoComplete="name"
                  />
                  <Input
                    label="Work email"
                    type="email"
                    placeholder="s.uwase@rmh.gov.rw"
                    value={form.email}
                    onChange={set('email')}
                    required
                    autoComplete="email"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                    hint="At least 8 characters"
                  />
                  <Input
                    label="Confirm password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    required
                  />

                  {error && (
                    <p className="text-[13px] text-care-red bg-care-red-bg border border-care-red/20 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <Button type="button" variant="ghost" onClick={() => setStep(0)} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" loading={loading} className="flex-1">
                      <Lock size={15} /> Create account
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Done ────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="card p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center mb-5">
                  <Check className="text-sage-500" size={28} />
                </div>
                <h2 className="font-display font-bold text-[26px] text-coal mb-2">Account created</h2>
                <p className="text-[14px] text-coal-muted mb-6 leading-relaxed">
                  Your account is being reviewed against hospital records. You'll receive an email once your medical ID is confirmed — usually within 24–48 hours.
                </p>
                <Button onClick={() => navigate('/doctor/login')} size="lg" className="w-full">
                  Back to sign in
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
