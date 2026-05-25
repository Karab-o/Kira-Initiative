import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, KeyRound } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function Login() {
  const navigate = useNavigate();
  const { login, apiError: getErr } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', twoFAToken: '' });
  const [need2FA, setNeed2FA] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(form);
      if (data.requiresVerification) {
        navigate('/doctor/verification', { replace: true });
      } else {
        navigate('/doctor/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error?.includes('2FA')) {
        setNeed2FA(true);
        setError('Enter your 2FA code to continue.');
      } else {
        setError(getErr(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-950 text-white">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col flex-1 p-12 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 border-r border-mint-300/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-300 to-mint-500 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
              <path d="M11 8v16M11 16l8-8M11 16l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-display text-xl leading-tight">Kira Initiative</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-fg">Clinical portal</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="font-display text-4xl leading-tight mb-4">Care for men who quietly carry too much.</h1>
          <p className="text-muted-fg leading-relaxed">
            Pick up cases escalated from anonymous AI chats. Patients arrive already triaged with a structured summary — you focus on the conversation that matters.
          </p>
        </div>

        <p className="text-xs text-muted-fg">Built for clinicians in Rwanda. © Kira Initiative</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl mb-1">Sign in</h2>
          <p className="text-sm text-muted-fg mb-7">Welcome back to the clinical portal.</p>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Work email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />

            {need2FA && (
              <Input
                label="2FA code"
                value={form.twoFAToken}
                onChange={(e) => setForm({ ...form, twoFAToken: e.target.value })}
                placeholder="123 456"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            )}

            {error && <p className="text-sm text-care-red">{error}</p>}

            <Button type="submit" className="w-full" loading={loading}>
              <Lock size={16} /> Sign in
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-fg pt-2">
              <Link to="/doctor/signup" className="hover:text-white">Create an account</Link>
              <a href="mailto:admin@kirainitiative.rw" className="hover:text-white">Forgot password?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
