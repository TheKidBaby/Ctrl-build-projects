import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { BreachService } from '../services/breachService';
import { cn } from '../lib/utils';

export function BreachChecker({ password }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const check = async () => {
    if (!password) return;
    setChecking(true);
    setResult(await BreachService.checkPassword(password));
    setChecking(false);
  };

  return (
    <div className="space-y-2">
      <button onClick={check} disabled={checking || !password}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-surface-1 transition-colors disabled:opacity-50">
        {checking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</> : <><Shield className="w-3.5 h-3.5" /> Check breaches</>}
      </button>
      {result && (
        <div className={cn("flex items-start gap-2.5 p-3 rounded-lg border text-xs",
          result.breached ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20" : "bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20"
        )}>
          {result.breached ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
          <div>
            <p className={cn("font-medium", result.breached ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400")}>{result.message}</p>
            {result.recommendation && <p className="text-text-secondary mt-0.5">{result.recommendation}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
