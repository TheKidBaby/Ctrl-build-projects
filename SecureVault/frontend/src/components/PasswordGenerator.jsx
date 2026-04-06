import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Copy, Check, Wand2, Keyboard, Sparkles, ShieldCheck } from 'lucide-react';
import { generatePassword, generateAlterations, calculateStrength } from '../crypto/vault';
import { cn, copyToClipboard } from '../lib/utils';

export function PasswordGenerator({ onSelect }) {
  const [mode, setMode] = useState('generate');
  const [password, setPassword] = useState('');
  const [customBase, setCustomBase] = useState('');
  const [alterations, setAlterations] = useState([]);
  const [copied, setCopied] = useState(false);
  const [opts, setOpts] = useState({ length: 20, includeLowercase: true, includeUppercase: true, includeNumbers: true, includeSymbols: true, excludeAmbiguous: true });

  const strength = calculateStrength(password);

  const gen = useCallback(() => {
    setPassword(generatePassword(opts));
  }, [opts]);

  useEffect(() => { gen(); }, []);

  const handleCustom = (v) => {
    setCustomBase(v);
    if (v.length >= 4) {
      const alts = generateAlterations(v);
      setAlterations(alts);
      setPassword(alts[0]);
    } else {
      setAlterations([]);
      setPassword('');
    }
  };

  const handleCopy = async () => {
    if (await copyToClipboard(password)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-0.5 rounded-lg">
        {[['generate', Wand2, 'Generate'], ['custom', Keyboard, 'Custom']].map(([key, Icon, label]) => (
          <button key={key} onClick={() => setMode(key)} className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all",
            mode === key ? "bg-surface-0 text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"
          )}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Display */}
      <div className="p-3 rounded-lg border border-border bg-surface-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: strength.color }} />
          <code className="flex-1 text-sm font-mono text-text-primary break-all">{password || '—'}</code>
          <button onClick={handleCopy} className={cn("p-1.5 rounded-md transition-colors", copied ? "text-brand-500" : "text-text-tertiary hover:text-text-primary")}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {mode === 'generate' && (
            <button onClick={gen} className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: strength.color }} />
            <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
          </div>
          <span className="text-xxs text-text-tertiary">{strength.percentage}%</span>
        </div>
      </div>

      {mode === 'generate' ? (
        <div className="space-y-4">
          {/* Length */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-secondary">Length</span>
              <span className="text-xs font-mono font-medium text-brand-500">{opts.length}</span>
            </div>
            <input type="range" min="8" max="64" value={opts.length}
              onChange={(e) => { setOpts(o => ({ ...o, length: +e.target.value })); setTimeout(gen, 0); }}
              className="w-full h-1 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2">
            {[['includeLowercase', 'a-z'], ['includeUppercase', 'A-Z'], ['includeNumbers', '0-9'], ['includeSymbols', '!@#']].map(([key, label]) => (
              <button key={key}
                onClick={() => { setOpts(o => ({ ...o, [key]: !o[key] })); setTimeout(gen, 0); }}
                className={cn("flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors",
                  opts[key] ? "border-brand-500/30 bg-brand-500/5 text-brand-600 dark:text-brand-400" : "border-border text-text-tertiary"
                )}
              >
                <span className="font-mono">{label}</span>
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  opts[key] ? "border-brand-500 bg-brand-500" : "border-surface-3"
                )}>
                  {opts[key] && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input type="text" value={customBase} onChange={(e) => handleCustom(e.target.value)}
            placeholder="Enter base password..." className="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm font-mono focus:outline-none focus:border-brand-500"
          />
          {alterations.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xxs text-text-tertiary flex items-center gap-1"><Sparkles className="w-3 h-3" /> Variations</p>
              {alterations.map((alt, i) => {
                const s = calculateStrength(alt);
                return (
                  <button key={i} onClick={() => setPassword(alt)}
                    className={cn("w-full text-left p-2.5 rounded-lg border text-xs transition-all",
                      password === alt ? "border-brand-500 bg-brand-500/5" : "border-border hover:border-border-hover"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-text-primary">{alt}</code>
                      <span className="text-xxs font-medium px-1.5 py-0.5 rounded" style={{ color: s.color, background: s.color + '15' }}>{s.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {onSelect && password && (
        <button onClick={() => onSelect(password)} className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          Use this password
        </button>
      )}
    </div>
  );
}
