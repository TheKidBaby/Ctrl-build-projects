import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Copy, Check, Wand2, 
  Keyboard, Sparkles, ShieldCheck 
} from 'lucide-react';
import { 
  generatePassword, 
  generateAlterations, 
  calculateStrength 
} from '../crypto/vault';
import { cn, copyToClipboard } from '../lib/utils';

export function PasswordGenerator({ onSelect }) {
  const [mode, setMode] = useState('generate');
  const [password, setPassword] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [alterations, setAlterations] = useState([]);
  const [copied, setCopied] = useState(false);
  
  const [options, setOptions] = useState({
    length: 20,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: true
  });

  const strength = calculateStrength(password);

  const generate = useCallback(() => {
    const newPassword = generatePassword(options);
    setPassword(newPassword);
  }, [options]);

  useEffect(() => {
    generate();
  }, []);

  const handleCustomPasswordChange = (value) => {
    setCustomPassword(value);
    if (value.length >= 4) {
      const alts = generateAlterations(value);
      setAlterations(alts);
      setPassword(alts[0]);
    } else {
      setAlterations([]);
      setPassword('');
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(password);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelect = (selectedPassword) => {
    setPassword(selectedPassword);
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 bg-dark-100 dark:bg-dark-900 rounded-xl">
        <button
          onClick={() => setMode('generate')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
            mode === 'generate'
              ? "bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow"
              : "text-dark-500 hover:text-dark-900 dark:hover:text-white"
          )}
        >
          <Wand2 className="w-4 h-4" />
          Generate
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
            mode === 'custom'
              ? "bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow"
              : "text-dark-500 hover:text-dark-900 dark:hover:text-white"
          )}
        >
          <Keyboard className="w-4 h-4" />
          Custom
        </button>
      </div>

      {/* Password Display */}
      <div className="relative">
        <div className="p-4 rounded-2xl border-2 bg-gradient-to-r from-dark-50 to-white dark:from-dark-900 dark:to-dark-800 border-dark-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: strength.color }}
            />
            <code className="flex-1 font-mono text-lg tracking-wide text-dark-900 dark:text-white break-all">
              {password || '••••••••••••••••••••'}
            </code>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-200 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <ShieldCheck 
                className="w-4 h-4"
                style={{ color: strength.color }}
              />
              <span 
                className="text-sm font-medium"
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
              <span className="text-xs text-dark-400">
                ({strength.percentage}%)
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!password}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  copied
                    ? "bg-vault-500 text-white"
                    : "hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-500"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              
              {mode === 'generate' && (
                <button
                  onClick={generate}
                  className="p-2 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-500 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-dark-200 dark:bg-dark-700">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${strength.percentage}%`,
              backgroundColor: strength.color 
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'generate' ? (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Length Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300">
                  Password Length
                </label>
                <span className="text-sm font-mono font-bold text-vault-500">
                  {options.length}
                </span>
              </div>
              
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) => {
                  setOptions(o => ({ ...o, length: parseInt(e.target.value) }));
                  setTimeout(generate, 0);
                }}
                className="w-full h-2 bg-dark-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-vault-500"
              />
              
              <div className="flex justify-between text-xs text-dark-400">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            {/* Character Options */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'includeLowercase', label: 'Lowercase', icon: 'abc' },
                { key: 'includeUppercase', label: 'Uppercase', icon: 'ABC' },
                { key: 'includeNumbers', label: 'Numbers', icon: '123' },
                { key: 'includeSymbols', label: 'Symbols', icon: '!@#' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setOptions(o => ({ ...o, [key]: !o[key] }));
                    setTimeout(generate, 0);
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-colors",
                    options[key]
                      ? "bg-vault-500/10 border-vault-500/30 text-vault-600 dark:text-vault-400"
                      : "bg-dark-50 dark:bg-dark-900 border-dark-200 dark:border-dark-700 text-dark-500"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold w-8">{icon}</span>
                    <span className="text-sm">{label}</span>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    options[key]
                      ? "bg-vault-500 border-vault-500"
                      : "border-dark-300 dark:border-dark-600"
                  )}>
                    {options[key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Exclude Ambiguous */}
            <button
              onClick={() => {
                setOptions(o => ({ ...o, excludeAmbiguous: !o.excludeAmbiguous }));
                setTimeout(generate, 0);
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition-colors",
                options.excludeAmbiguous
                  ? "bg-vault-500/10 border-vault-500/30"
                  : "bg-dark-50 dark:bg-dark-900 border-dark-200 dark:border-dark-700"
              )}
            >
              <div>
                <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                  Exclude Ambiguous
                </span>
                <p className="text-xs text-dark-400 mt-0.5">
                  Avoid: l, 1, I, O, 0
                </p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                options.excludeAmbiguous
                  ? "bg-vault-500 border-vault-500"
                  : "border-dark-300 dark:border-dark-600"
              )}>
                {options.excludeAmbiguous && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Enter your base password
              </label>
              <input
                type="text"
                value={customPassword}
                onChange={(e) => handleCustomPasswordChange(e.target.value)}
                placeholder="Type a password to create variations..."
                className="input-base font-mono"
              />
              <p className="text-xs text-dark-400 mt-2">
                We'll generate 3 enhanced variations of your password
              </p>
            </div>

            <AnimatePresence>
              {alterations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-vault-500" />
                    <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                      Enhanced Variations
                    </span>
                  </div>
                  
                  {alterations.map((alt, index) => {
                    const altStrength = calculateStrength(alt);
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelect(alt)}
                        className={cn(
                          "w-full p-3 rounded-xl border text-left transition-all hover:border-vault-500/50",
                          password === alt
                            ? "bg-vault-500/10 border-vault-500"
                            : "bg-dark-50 dark:bg-dark-900 border-dark-200 dark:border-dark-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <code className="font-mono text-sm text-dark-700 dark:text-dark-300">
                            {alt}
                          </code>
                          <span 
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: altStrength.color + '20',
                              color: altStrength.color 
                            }}
                          >
                            {altStrength.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {onSelect && password && (
        <button
          onClick={() => onSelect(password)}
          className="w-full btn btn-primary py-3"
        >
          <Check className="w-5 h-5" />
          Use This Password
        </button>
      )}
    </div>
  );
}
