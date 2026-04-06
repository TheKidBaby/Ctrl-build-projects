const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class BreachService {
  /**
   * Check if a password has been breached (FREE)
   */
  static async checkPassword(password) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/breach/check-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        throw new Error('Breach check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Password breach check failed:', error);
      return {
        breached: null,
        severity: 'unknown',
        message: 'Unable to check breach database',
        error: error.message
      };
    }
  }

  /**
   * Check multiple passwords (FREE but rate-limited)
   */
  static async checkBatch(passwords) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/breach/check-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passwords })
      });

      if (!response.ok) {
        throw new Error('Batch check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Batch breach check failed:', error);
      return {
        results: [],
        statistics: {
          total: 0,
          breached: 0,
          safe: 0
        },
        error: error.message
      };
    }
  }

  /**
   * Analyze password locally (FREE - instant)
   */
  static async analyzePassword(password) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/breach/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Password analysis failed:', error);
      return {
        score: 0,
        feedback: ['Unable to analyze password'],
        strength: 'unknown'
      };
    }
  }
}
