import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { BreachService } from '../services/breachService';
import { useVaultStore } from '../stores/vaultStore';
import { cn } from '../lib/utils';

export function VaultScanner() {
  const { passwords } = useVaultStore();
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const scanVault = async () => {
    setScanning(true);
    
    const passwordsToCheck = passwords.map(p => p.password);
    const scanResults = await BreachService.checkBatch(passwordsToCheck);
    
    setResults(scanResults);
    setScanning(false);
  };

  const getBreachedPasswords = () => {
    if (!results) return [];
    
    return results.results
      .map((r, index) => ({
        ...r,
        password: passwords[index]
      }))
      .filter(r => r.breached === true)
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-1">
            Security Scan
          </h3>
          <p className="text-sm text-dark-500">
            Check all passwords against breach databases (100% FREE)
          </p>
        </div>
        
        <button
          onClick={scanVault}
          disabled={scanning || passwords.length === 0}
          className="btn btn-primary disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Scan Vault
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Safe</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.statistics.safe}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">Breached</span>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {results.statistics.breached}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-dark-600 dark:text-dark-400" />
                  <span className="text-xs font-medium text-dark-700 dark:text-dark-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">
                  {results.statistics.total}
                </p>
              </div>
            </div>

            {results.statistics.breachRate > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Security Score
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                      {results.statistics.breachRate}% of passwords have been breached
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {(100 - parseFloat(results.statistics.breachRate)).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {results.statistics.recommendations && results.statistics.recommendations.length > 0 && (
              <div className="space-y-2">
                {results.statistics.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border text-sm",
                      rec.severity === 'critical' && "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
                      rec.severity === 'high' && "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30",
                      rec.severity === 'warning' && "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
                      rec.severity === 'safe' && "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                    )}
                  >
                    <p className="font-medium mb-1">{rec.message}</p>
                    <p className="text-xs opacity-75">{rec.action}</p>
                  </div>
                ))}
              </div>
            )}

            {getBreachedPasswords().length > 0 && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <span className="text-sm font-medium">
                    View Breached Passwords ({getBreachedPasswords().length})
                  </span>
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-2"
                    >
                      {getBreachedPasswords().map((item, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-dark-900 dark:text-white">
                                {item.password.website}
                              </p>
                              <p className="text-xs text-dark-500 mt-0.5">
                                {item.password.username}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                item.severity === 'critical' && "bg-red-600 text-white",
                                item.severity === 'high' && "bg-red-500 text-white",
                                item.severity === 'medium' && "bg-orange-500 text-white",
                                item.severity === 'low' && "bg-yellow-500 text-white"
                              )}>
                                {item.severity}
                              </span>
                              {item.count > 0 && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  {item.count.toLocaleString()} breaches
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Using free HIBP Pwned Passwords API • No API key required • Privacy-preserving k-anonymity
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {passwords.length === 0 && (
        <p className="text-center text-dark-500 text-sm py-8">
          Add some passwords to scan your vault
        </p>
      )}
    </div>
  );
}
