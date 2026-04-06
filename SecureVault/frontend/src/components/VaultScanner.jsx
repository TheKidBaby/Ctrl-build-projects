import { useState } from 'react';
import { Shield, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BreachService } from '../services/breachService';
import { useVaultStore } from '../stores/vaultStore';
import { cn } from '../lib/utils';

export function VaultScanner() {
  const { passwords } = useVaultStore();
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const scan = async () => {
    setScanning(true);
    setResults(await BreachService.checkBatch(passwords.map(p => p.password)));
    setScanning(false);
  };

  const breached = results?.results?.filter(r => r.breached).map((r, i) => ({ ...r, pw: passwords[r.index] })) || [];

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-text-primary">Security scan</h3>
        <button onClick={scan} disabled={scanning || !passwords.length}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50">
          {scanning ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Scanning...</> : <><Shield className="w-3 h-3 inline mr-1" />Scan</>}
        </button>
      </div>
      <p className="text-xxs text-text-tertiary mb-3">Check all passwords against breach databases</p>

      {results && (
        <div className="space-y-3 animate-in">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Safe" value={results.statistics.safe} color="text-green-500" icon={CheckCircle} />
            <Stat label="Breached" value={results.statistics.breached} color="text-red-500" icon={AlertTriangle} />
            <Stat label="Score" value={`${(100 - parseFloat(results.statistics.breachRate)).toFixed(0)}%`} color="text-brand-500" icon={Shield} />
          </div>

          {breached.length > 0 && (
            <div>
              <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-1 text-xs font-medium text-text-secondary hover:bg-surface-2 transition-colors">
                <span>Breached ({breached.length})</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {expanded && (
                <div className="mt-2 space-y-1.5">
                  {breached.map((b, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                      <div>
                        <p className="text-xs font-medium text-text-primary">{b.pw.website}</p>
                        <p className="text-xxs text-text-tertiary">{b.pw.username}</p>
                      </div>
                      <span className={cn("text-xxs px-1.5 py-0.5 rounded font-medium text-white",
                        b.severity === 'critical' ? 'bg-red-600' : b.severity === 'high' ? 'bg-red-500' : 'bg-orange-500'
                      )}>{b.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!passwords.length && <p className="text-center text-xs text-text-tertiary py-4">Add passwords to scan</p>}
    </div>
  );
}

function Stat({ label, value, color, icon: Icon }) {
  return (
    <div className="p-2.5 rounded-lg bg-surface-1 border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("w-3 h-3", color)} />
        <span className="text-xxs text-text-tertiary">{label}</span>
      </div>
      <p className={cn("text-lg font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}
