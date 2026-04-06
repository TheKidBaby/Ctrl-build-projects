import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { useVaultStore } from '../stores/vaultStore';
import { calculateStrength } from '../crypto/vault';
import { ThemeToggle } from '../components/ThemeToggle';
import { cn } from '../lib/utils';

export function Register({ onSwitchToLogin }) {
  const { register, isLoading, error } = useVaultStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState(null);
  const strength = calculateStrength(pw);

  const reqs = [
    { met: pw.length >= 12, text: '12+ characters' },
    { met: /[a-z]/.test(pw), text: 'Lowercase' },
    { met: /[A-Z]/.test(pw), text: 'Uppercase' },
    { met: /\d/.test(pw), text: 'Number' },
    { met: /[^a-zA-Z0-9]/.test(pw), text: 'Symbol' },
  ];
  const allMet = reqs.every(r => r.met);

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (pw !== confirmPw) return setLocalError('Passwords do not match');
    if (!allMet) return setLocalError('Password requirements not met');
    const result = await register(email, pw);
    if (!result.success) setLocalError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Create account</h1>
          <p className="text-sm text-text-secondary mt-1">Start securing your passwords</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {(localError || error) && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{localError || error}</p>}

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-surface-0 focus:outline-none focus:border-brand-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Master password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" required
                className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-border bg-surface-0 focus:outline-none focus:border-brand-500 transition-colors" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pw && (
              <>
                <div className="mt-1.5 h-1 rounded-full bg-surface-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${strength.percentage}%`, backgroundColor: strength.color }} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {reqs.map((r, i) => (
                    <span key={i} className={cn("text-xxs flex items-center gap-1", r.met ? "text-green-500" : "text-text-tertiary")}>
                      <Check className={cn("w-3 h-3", !r.met && "opacity-30")} />{r.text}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" required
                className={cn("w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border bg-surface-0 focus:outline-none transition-colors",
                  confirmPw && pw !== confirmPw ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-500"
                )} />
            </div>
            {confirmPw && pw !== confirmPw && <p className="text-xxs text-red-500 mt-1">Passwords don't match</p>}
          </div>

          <button type="submit" disabled={isLoading || !allMet}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-xs text-text-tertiary mt-6">
          Have an account? <button onClick={onSwitchToLogin} className="text-brand-500 hover:text-brand-600 font-medium">Sign in</button>
        </p>
      </div>
    </div>
  );
}
