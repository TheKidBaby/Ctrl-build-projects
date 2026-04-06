import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { useVaultStore } from '../stores/vaultStore';
import { calculateStrength } from '../crypto/vault';
import { cn } from '../lib/utils';

export function Register({ onSwitchToLogin }) {
  const { register, isLoading, error } = useVaultStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);

  const strength = calculateStrength(password);

  const requirements = [
    { met: password.length >= 12, text: 'At least 12 characters' },
    { met: /[a-z]/.test(password), text: 'Lowercase letter' },
    { met: /[A-Z]/.test(password), text: 'Uppercase letter' },
    { met: /\d/.test(password), text: 'Number' },
    { met: /[^a-zA-Z0-9]/.test(password), text: 'Special character' }
  ];

  const allRequirementsMet = requirements.every(r => r.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!allRequirementsMet) {
      setLocalError('Password does not meet requirements');
      return;
    }

    const result = await register(email, password);
    if (!result.success) {
      setLocalError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-vault-400 to-emerald-500 mb-4 shadow-lg shadow-vault-500/30"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">
            Create Account
          </h1>
          <p className="text-dark-400">
            Start securing your passwords today
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {(localError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm"
              >
                {localError || error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="input-base pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-base pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-700 rounded transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-dark-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-dark-500" />
                  )}
                </button>
              </div>

              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-dark-400">Strength</span>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-dark-700">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{ width: `${strength.percentage}%` }}
                      style={{ backgroundColor: strength.color }}
                    />
                  </div>
                </div>
              )}

              {password && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {requirements.map((req, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        req.met ? "text-green-500" : "text-dark-500"
                      )}
                    >
                      <Check className={cn("w-3 h-3", !req.met && "opacity-30")} />
                      {req.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Confirm Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={cn(
                    "input-base pl-11",
                    confirmPassword && password !== confirmPassword && "border-red-500 focus:border-red-500"
                  )}
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !allRequirementsMet}
              className="w-full btn btn-primary py-3 text-lg disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-vault-500 hover:text-vault-400 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-dark-500 text-sm mt-6">
          🔐 Your master password never leaves your device
        </p>
      </motion.div>
    </div>
  );
}
