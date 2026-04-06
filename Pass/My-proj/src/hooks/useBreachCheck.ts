import { useState, useCallback, useRef, useEffect } from 'react'
import {
  checkPasswordBreachCached,
  BreachCheckResult,
} from '@utils/breachChecker'

interface UseBreachCheckOptions {
  debounceDelay?: number
  autoCheck?: boolean
}

export function useBreachCheck(options: UseBreachCheckOptions = {}) {
  const { debounceDelay = 800, autoCheck = true } = options

  const [result, setResult] = useState<BreachCheckResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performCheck = useCallback(async (password: string) => {
    if (!password || password.length < 4) {
      setResult(null)
      setHasChecked(false)
      return
    }

    setIsLoading(true)
    try {
      const breachResult = await checkPasswordBreachCached(password)
      setResult(breachResult)
      setHasChecked(true)
    } catch (error) {
      console.error('Breach check error:', error)
      setResult({
        isBreached: false,
        breachCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      setHasChecked(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkPassword = useCallback(
    (password: string) => {
      if (!autoCheck) {
        return
      }

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        performCheck(password)
      }, debounceDelay)
    },
    [debounceDelay, performCheck, autoCheck],
  )

  const checkPasswordImmediate = useCallback((password: string) => {
    // Clear debounce timer if exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    performCheck(password)
  }, [performCheck])

  const reset = useCallback(() => {
    setResult(null)
    setIsLoading(false)
    setHasChecked(false)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    result,
    isLoading,
    hasChecked,
    checkPassword,
    checkPasswordImmediate,
    reset,
  }
}

export default useBreachCheck
