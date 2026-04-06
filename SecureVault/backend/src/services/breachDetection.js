import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * Free Breach Detection Service
 * Uses HIBP Pwned Passwords API (no API key required)
 * + Local pattern detection for common weak passwords
 */
export class BreachDetectionService {
  static HIBP_PASSWORD_API = 'https://api.pwnedpasswords.com/range';
  
  // Common breached passwords patterns (updated regularly from various sources)
  static COMMON_BREACHED_PATTERNS = [
    // Top breached passwords
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
    '1234567', 'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou',
    'master', 'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow',
    '123123', '654321', 'superman', 'qazwsx', 'michael', 'football',
    'welcome', 'jesus', 'ninja', 'mustang', 'password1', 'password123',
    '!@#$%^&*', 'admin', 'root', 'toor', 'pass', 'test', 'guest',
    // Keyboard patterns
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1qaz2wsx', 'qweasd',
    // Sequential
    'abcdef', '123456789', '1234567890', 'abcdefgh',
    // Common words
    'princess', 'starwars', 'charlie', 'login', 'passw0rd'
  ];

  static WEAK_PATTERNS = [
    /^(.)\1+$/, // Same character repeated
    /^(012|123|234|345|456|567|678|789|890)+/, // Sequential numbers
    /^(abc|bcd|cde|def|efg|fgh)+/i, // Sequential letters
    /^(qwerty|asdfgh|zxcvbn)+/i, // Keyboard patterns
    /^[a-z]+$/, // Only lowercase
    /^[A-Z]+$/, // Only uppercase
    /^[0-9]+$/, // Only numbers
    /^.{1,7}$/ // Too short
  ];

  /**
   * Check if password has been breached using HIBP API
   * 100% FREE - No API key required
   * Uses k-anonymity (only sends first 5 chars of hash)
   * 
   * @param {string} password
   * @returns {Promise<Object>}
   */
  static async checkPassword(password) {
    // First check local patterns for instant feedback
    const localCheck = this.checkLocalPatterns(password);
    if (localCheck.breached) {
      return localCheck;
    }

    // Then check HIBP API
    try {
      const hash = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();

      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      const response = await fetch(
        `${this.HIBP_PASSWORD_API}/${prefix}`,
        {
          headers: {
            'User-Agent': 'SecureVault-PasswordManager',
            'Add-Padding': 'true'
          },
          timeout: 10000
        }
      );

      if (!response.ok) {
        // If API fails, return local check result
        return {
          breached: false,
          count: 0,
          severity: 'unknown',
          message: 'Could not verify with breach database',
          recommendation: 'API temporarily unavailable. Password passed local checks.',
          source: 'local'
        };
      }

      const text = await response.text();
      const lines = text.split('\r\n');

      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          const breachCount = parseInt(count, 10);
          return {
            breached: true,
            count: breachCount,
            severity: this.getSeverity(breachCount),
            message: `⚠️ This password appears in ${breachCount.toLocaleString()} data breaches`,
            recommendation: this.getPasswordRecommendation(breachCount),
            source: 'hibp',
            isCommon: breachCount > 100
          };
        }
      }

      return {
        breached: false,
        count: 0,
        severity: 'safe',
        message: '✓ Password not found in breach databases',
        recommendation: 'This password appears to be unique and safe',
        source: 'hibp'
      };

    } catch (error) {
      console.error('HIBP API error:', error.message);
      
      // Fallback to local check if API fails
      return {
        breached: localCheck.breached,
        count: 0,
        severity: localCheck.breached ? 'medium' : 'unknown',
        message: localCheck.breached 
          ? localCheck.message 
          : 'Could not verify with breach database',
        recommendation: localCheck.recommendation,
        source: 'local',
        error: 'API unavailable - using local detection'
      };
    }
  }

  /**
   * Check password against local patterns and common breached passwords
   * This is instant and works offline
   */
  static checkLocalPatterns(password) {
    if (!password) {
      return {
        breached: true,
        severity: 'critical',
        message: 'Empty password',
        recommendation: 'Password cannot be empty',
        source: 'local'
      };
    }

    const lowerPassword = password.toLowerCase();

    // Check against common breached passwords
    for (const common of this.COMMON_BREACHED_PATTERNS) {
      if (lowerPassword === common.toLowerCase() || 
          lowerPassword.includes(common.toLowerCase())) {
        return {
          breached: true,
          severity: 'critical',
          message: '⚠️ This is a commonly breached password',
          recommendation: 'This password is well-known to attackers. Choose a unique password.',
          source: 'local',
          isCommon: true
        };
      }
    }

    // Check against weak patterns
    for (const pattern of this.WEAK_PATTERNS) {
      if (pattern.test(password)) {
        return {
          breached: true,
          severity: 'high',
          message: '⚠️ Password uses a common weak pattern',
          recommendation: 'Avoid simple patterns, keyboard sequences, and repeated characters.',
          source: 'local',
          isWeak: true
        };
      }
    }

    // Check for common substitutions (l33t speak on weak passwords)
    const decodedPassword = password
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/\$/g, 's')
      .replace(/@/g, 'a')
      .toLowerCase();

    for (const common of this.COMMON_BREACHED_PATTERNS) {
      if (decodedPassword === common || decodedPassword.includes(common)) {
        return {
          breached: true,
          severity: 'high',
          message: '⚠️ Simple character substitution detected',
          recommendation: 'Attackers use dictionaries with common substitutions. Choose a truly unique password.',
          source: 'local',
          isCommon: true
        };
      }
    }

    return {
      breached: false,
      severity: 'safe',
      message: 'Password passed local security checks',
      recommendation: 'Checking against breach database...',
      source: 'local'
    };
  }

  /**
   * Check multiple passwords (batch check)
   * Adds delay to respect HIBP rate limits (1 request per 1500ms recommended)
   */
  static async checkMultiplePasswords(passwords) {
    const results = [];
    
    for (let i = 0; i < passwords.length; i++) {
      // Add delay between requests (except for first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1600)); // 1.6 seconds
      }

      const result = await this.checkPassword(passwords[i]);
      results.push({
        index: i,
        ...result
      });
    }

    return results;
  }

  /**
   * Get breach severity level
   */
  static getSeverity(count) {
    if (count === 0) return 'safe';
    if (count < 10) return 'low';
    if (count < 100) return 'medium';
    if (count < 1000) return 'high';
    return 'critical';
  }

  /**
   * Get color for severity
   */
  static getSeverityColor(severity) {
    const colors = {
      safe: '#10b981',
      low: '#eab308',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
      unknown: '#6b7280'
    };
    return colors[severity] || colors.unknown;
  }

  /**
   * Get recommendation based on breach count
   */
  static getPasswordRecommendation(count) {
    if (count === 0) {
      return 'This password appears safe and unique.';
    }
    if (count < 10) {
      return '⚠️ Consider changing this password. It has appeared in a few breaches.';
    }
    if (count < 100) {
      return '⚠️ Change this password immediately. It has been compromised multiple times.';
    }
    if (count < 1000) {
      return '🚨 URGENT: Change this password now! It is widely known and actively targeted.';
    }
    return '🚨 CRITICAL: This is an extremely common password. Change it immediately!';
  }

  /**
   * Analyze password strength comprehensively
   */
  static analyzePassword(password) {
    const length = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);
    const uniqueChars = new Set(password).size;

    let score = 0;
    const feedback = [];

    // Length scoring
    if (length >= 8) score += 1;
    if (length >= 12) score += 2;
    if (length >= 16) score += 2;
    if (length >= 20) score += 1;
    else if (length < 8) feedback.push('Password should be at least 8 characters');

    // Complexity scoring
    if (hasLower) score += 1;
    else feedback.push('Add lowercase letters');
    
    if (hasUpper) score += 1;
    else feedback.push('Add uppercase letters');
    
    if (hasNumber) score += 1;
    else feedback.push('Add numbers');
    
    if (hasSymbol) score += 2;
    else feedback.push('Add special characters');

    // Uniqueness
    if (uniqueChars >= length * 0.8) score += 2;
    else if (uniqueChars < length * 0.5) feedback.push('Too many repeated characters');

    // Check patterns
    const localCheck = this.checkLocalPatterns(password);
    if (localCheck.breached) {
      score = Math.max(0, score - 5);
      feedback.push(localCheck.message);
    }

    return {
      score: Math.min(10, score),
      feedback,
      strength: score < 4 ? 'weak' : score < 7 ? 'medium' : 'strong'
    };
  }

  /**
   * Get statistics for multiple breach checks
   */
  static getBreachStatistics(results) {
    const total = results.length;
    const breached = results.filter(r => r.breached === true).length;
    const safe = results.filter(r => r.breached === false).length;
    const unknown = results.filter(r => r.breached === null).length;
    
    const criticalCount = results.filter(r => r.severity === 'critical').length;
    const highCount = results.filter(r => r.severity === 'high').length;
    const mediumCount = results.filter(r => r.severity === 'medium').length;
    const lowCount = results.filter(r => r.severity === 'low').length;

    const totalBreaches = results.reduce((sum, r) => sum + (r.count || 0), 0);

    return {
      total,
      breached,
      safe,
      unknown,
      breachRate: total > 0 ? ((breached / total) * 100).toFixed(1) : 0,
      severity: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount
      },
      totalBreachOccurrences: totalBreaches,
      recommendations: this.getRecommendationsFromStats({
        breached,
        critical: criticalCount,
        high: highCount,
        total
      })
    };
  }

  /**
   * Get recommendations based on statistics
   */
  static getRecommendationsFromStats(stats) {
    const recommendations = [];

    if (stats.critical > 0) {
      recommendations.push({
        severity: 'critical',
        message: `${stats.critical} password${stats.critical > 1 ? 's are' : ' is'} critically compromised`,
        action: 'Change immediately'
      });
    }

    if (stats.high > 0) {
      recommendations.push({
        severity: 'high',
        message: `${stats.high} password${stats.high > 1 ? 's are' : ' is'} highly compromised`,
        action: 'Change as soon as possible'
      });
    }

    if (stats.breached > stats.total * 0.5) {
      recommendations.push({
        severity: 'warning',
        message: 'Over 50% of your passwords have been breached',
        action: 'Consider using the password generator for all accounts'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        severity: 'safe',
        message: 'Your passwords appear to be secure',
        action: 'Keep up the good security practices'
      });
    }

    return recommendations;
  }
}
