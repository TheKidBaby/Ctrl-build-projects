import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Loader2, AlertCircle, Info } from 'lucide-react';
import { BreachService } from '../services/breachService';
import { cn } from '../lib/utils';

export function BreachChecker({ password, onResult, autoCheck = false }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkBreach = async () => {
    if (!password) return;

    setChecking(true);
    const breachResult = await BreachService.checkPassword(password);
    setResult(breachResult);
    setChecking(false);

    if (onResult) {
      onResult(breachResult);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      safe: 'text-green-600 dark:text-green-400',
      low: 'text-yellow-600 dark:text-yellow-400',
      medium: 'text-orange-600 dark:text-orange-400',
      high: 'text-red-600 dark:text-red-400',
      critical: 'text-red-700 dark:text-red-500',
      unknown: 'text-gray-600 dark:text-gray-400'
    };
    return colors[severity] || colors.unknown;
  };

  const getSeverityBg = (severity) => {
    const colors = {
      safe: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30',
      low: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30',
      medium: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30',
      high: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30',
      critical: 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/40',
      unknown: 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/30'
    };
    return colors[severity] || colors.unknown;
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'safe') return <CheckCircle className="w-5 h-5" />;
    if (severity === 'unknown') return <AlertCircle className="w-5 h-5" />;
    if (severity === 'critical' || severity === 'high') return <AlertTriangle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  return (
    <div className="space-y-3">
      {!autoCheck && (
        <button
          onClick={checkBreach}
          disabled={checking || !password}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors",
            "bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "border border-dark-200 dark:border-dark-700"
          )}
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Checking breaches...</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Check for Data Breaches</span>
            </>
          )}
        </button>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "p-4 rounded-xl border overflow-hidden",
              getSeverityBg(result.severity)
            )}
          >
            <div className="flex items-start gap-3">
              <div className={getSeverityColor(result.severity)}>
                {getSeverityIcon(result.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm mb-1",
                  getSeverityColor(result.severity)
                )}>
                  {result.message}
                </p>
                
                {result.recommendation && (
                  <p className="text-xs text-dark-600 dark:text-dark-400 mb-2">
                    {result.recommendation}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {result.source && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dark-200 dark:bg-dark-700 text-dark-600 dark:text-dark-400">
                      {result.source === 'hibp' ? '🔍 HIBP Database' : '⚡ Local Check'}
                    </span>
                  )}
                  
                  {result.count > 0 && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      result.severity === 'critical' || result.severity === 'high'
                        ? "bg-red-200 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                        : "bg-orange-200 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400"
                    )}>
                      Found {result.count.toLocaleString()}× in breaches
                    </span>
                  )}

                  {result.isCommon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 dark:bg-red-500/20 text-red-700 dark:text-red-400 font-medium">
                      ⚠️ Common Password
                    </span>
                  )}
                </div>

                {result.error && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ {result.error}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
