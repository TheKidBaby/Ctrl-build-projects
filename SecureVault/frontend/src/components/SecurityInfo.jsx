import { useState } from 'react';
import { Shield, Lock, Key, Hash, ChevronDown, ChevronUp, Fingerprint, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function SecurityInfo() {
  const [expanded, setExpanded] = useState(false);

  const algorithms = [
    { name: 'AES-256-GCM', purpose: 'Data encryption', family: 'NIST Standard', icon: Lock, color: 'text-blue-500' },
    { name: 'Argon2id', purpose: 'Password hashing', family: 'PHC Winner', icon: Key, color: 'text-purple-500' },
    { name: 'BLAKE2b-512', purpose: 'Key strengthening & MAC', family: 'RFC 7693', icon: Hash, color: 'text-cyan-500' },
    { name: 'PBKDF2-SHA512', purpose: 'Key derivation', family: 'NIST SP 800-132', icon: Key, color: 'text-green-500' },
    { name: 'RIPEMD-160', purpose: 'Integrity checksums', family: 'EU Independent', icon: Fingerprint, color: 'text-orange-500' },
    { name: 'HKDF-SHA512', purpose: 'Key expansion', family: 'RFC 5869', icon: Key, color: 'text-emerald-500' },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-1 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-medium text-text-primary">Security Stack</span>
          <span className="text-xxs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium">
            6 algorithms
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="mt-3 space-y-2">
            {algorithms.map((algo, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <algo.icon className={cn("w-4 h-4 mt-0.5 shrink-0", algo.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold font-mono text-text-primary">{algo.name}</span>
                    <span className="text-xxs text-text-tertiary">{algo.family}</span>
                  </div>
                  <p className="text-xxs text-text-secondary mt-0.5">{algo.purpose}</p>
                </div>
                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>

          <div className="mt-3 p-2.5 rounded-lg bg-surface-1 border border-border">
            <p className="text-xxs text-text-secondary leading-relaxed">
              <span className="font-medium text-text-primary">Zero-knowledge architecture.</span>{' '}
              5 independent algorithm families ensure that even if multiple algorithms are compromised, your data remains protected. All encryption happens client-side — the server never sees your passwords.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
