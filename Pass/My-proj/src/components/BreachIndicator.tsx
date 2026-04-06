import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import {
  checkPasswordBreachCached,
  getBreachStatusText,
  getBreachStatusBadge,
  BreachCheckResult,
} from '@utils/breachChecker'

export interface BreachIndicatorProps {
  password: string
  showLabel?: boolean
  compact?: boolean
  onCheckComplete?: (result: BreachCheckResult) => void
}

export const BreachIndicator: React.FC<BreachIndicatorProps> = ({
  password,
  showLabel = true,
  compact = false,
  onCheckComplete,
}) => {
  const [result, setResult] = useState<BreachCheckResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (!password || password.length < 4) {
      setResult(null)
      setHasChecked(false)
      return
    }

    const checkBreach = async () => {
      setIsLoading(true)
      try {
        const breachResult = await checkPasswordBreachCached(password)
        setResult(breachResult)
        setHasChecked(true)
        onCheckComplete?.(breachResult)
      } catch (error) {
        console.error('Breach check error:', error)
        setResult({
          isBreached: false,
          breachCount: 0,
          error: 'Check failed',
        })
        setHasChecked(true)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(checkBreach, 800)
    return () => clearTimeout(timer)
  }, [password, onCheckComplete])

  if (!password || password.length < 4) {
    return null
  }

  if (isLoading) {
    return (
      <div className={compact ? 'flex items-center gap-2' : 'mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg'}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-500 dark:text-slate-400" />
        <span className="text-xs text-slate-600 dark:text-slate-300">Checking breach status...</span>
      </div>
    )
  }

  if (!hasChecked || !result) {
    return null
  }

  if (result.error) {
    return (
      <div className={compact ? 'flex items-center gap-2' : 'mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg'}>
        <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="text-xs text-slate-600 dark:text-slate-300">Unable to check breach status</span>
      </div>
    )
  }

  const badge = getBreachStatusBadge(result.breachCount)
  const statusText = getBreachStatusText(result.breachCount)

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md"
        style={{
          backgroundColor: badge.severity === 'safe' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        }}
      >
        {badge.severity === 'safe' ? (
          <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400" />
        )}
        <span
          className="text-xs font-semibold"
          style={{
            color: badge.color,
          }}
        >
          {badge.text}
        </span>
        {result.breachCount > 0 && (
          <span className="text-xs ml-1 opacity-75" style={{ color: badge.color }}>
            ({result.breachCount.toLocaleString()})
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className="mt-3 p-4 rounded-lg border-2 transition-all"
      style={{
        backgroundColor: badge.severity === 'safe' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        borderColor: badge.color,
      }}
    >
      <div className="flex items-start gap-3">
        {badge.severity === 'safe' ? (
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-success-600 dark:text-success-400" />
        ) : (
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-danger-600 dark:text-danger-400" />
        )}

        <div className="flex-1 min-w-0">
          {showLabel && (
            <h4 className="text-sm font-semibold mb-1" style={{ color: badge.color }}>
              {badge.text}
            </h4>
          )}

          <div className="space-y-1">
            <p className="text-sm text-slate-700 dark:text-slate-300">{statusText}</p>

            {result.breachCount > 0 && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                This password appears in {result.breachCount.toLocaleString()} known data breach
                {result.breachCount !== 1 ? 'es' : ''}. Consider changing it immediately.
              </p>
            )}

            {badge.severity === 'safe' && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Checked against 14B+ compromised passwords via Have I Been Pwned.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Privacy: Only first 5 chars of SHA-1 hash sent to check service
      </div>
    </div>
  )
}

export default BreachIndicator
