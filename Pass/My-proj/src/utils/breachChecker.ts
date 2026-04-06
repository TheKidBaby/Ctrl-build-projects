/**
 * Breach Checker Utility
 * Uses Have I Been Pwned API with k-anonymity
 * Routed through backend to avoid CORS issues
 * Only first 5 chars of SHA-1 hash are sent to HIBP
 * Full password never leaves the browser
 */

export interface BreachCheckResult {
  isBreached: boolean;
  breachCount: number;
  error?: string;
}

/**
 * Get the API base URL (backend server)
 */
function getApiUrl(): string {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    return "http://localhost:3001";
  }
  return window.location.origin;
}

/**
 * Check if a password has been compromised using Have I Been Pwned API
 * Routes through backend to avoid CORS issues
 * Uses k-anonymity: only first 5 chars of SHA-1 hash are sent to HIBP
 * Full password never leaves the browser
 *
 * @param password - The password to check
 * @returns BreachCheckResult with breach status and count
 */
export async function checkPasswordBreach(
  password: string,
): Promise<BreachCheckResult> {
  try {
    const apiUrl = getApiUrl();

    // Call backend breach endpoint which proxies to HIBP
    const response = await fetch(`${apiUrl}/api/breach/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        isBreached: data.isBreached,
        breachCount: data.breachCount || 0,
      };
    } else {
      throw new Error(data.error || "Unknown error from breach checker");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Breach check failed:", errorMessage);
    return {
      isBreached: false,
      breachCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Get breach status color for UI display
 */
export function getBreachStatusColor(breachCount: number): string {
  if (breachCount === 0) return "#22c55e"; // green - safe
  if (breachCount < 10) return "#ef4444"; // red - compromised
  if (breachCount < 100) return "#dc2626"; // dark red - heavily compromised
  return "#991b1b"; // very dark red - extremely compromised
}

/**
 * Get breach status text for UI display
 */
export function getBreachStatusText(breachCount: number): string {
  if (breachCount === 0) return "Not found in any breach";
  if (breachCount === 1) return "Seen in 1 breach";
  return `Seen in ${breachCount.toLocaleString()} breaches`;
}

/**
 * Get breach status badge for UI
 */
export function getBreachStatusBadge(breachCount: number): {
  text: string;
  color: string;
  severity: "safe" | "warning" | "critical";
} {
  if (breachCount === 0) {
    return {
      text: "✓ Safe",
      color: "#22c55e",
      severity: "safe",
    };
  }
  if (breachCount < 10) {
    return {
      text: "⚠ Compromised",
      color: "#ef4444",
      severity: "critical",
    };
  }
  return {
    text: "🚨 Highly Compromised",
    color: "#991b1b",
    severity: "critical",
  };
}

/**
 * Debounced breach checker for real-time checking
 * Useful for checking as user enters/modifies a password
 */
export function createDebouncedBreachChecker(
  delayMs: number = 800,
): (password: string) => Promise<BreachCheckResult> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (password: string): Promise<BreachCheckResult> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        const result = await checkPasswordBreach(password);
        resolve(result);
      }, delayMs);
    });
  };
}

/**
 * Cache for breach check results to reduce API calls
 */
class BreachCheckCache {
  private cache: Map<string, BreachCheckResult> = new Map();
  private maxSize: number = 100;

  set(password: string, result: BreachCheckResult): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (first one)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(password, result);
  }

  get(password: string): BreachCheckResult | undefined {
    return this.cache.get(password);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const breachCheckCache = new BreachCheckCache();

/**
 * Cached breach check - returns cached result if available
 */
export async function checkPasswordBreachCached(
  password: string,
): Promise<BreachCheckResult> {
  const cached = breachCheckCache.get(password);
  if (cached) {
    return cached;
  }

  const result = await checkPasswordBreach(password);
  breachCheckCache.set(password, result);
  return result;
}
