import express from 'express';
import crypto from 'crypto';

const router = express.Router();

/**
 * Breach Checker Proxy Routes
 * Proxies Have I Been Pwned API calls to avoid CORS issues
 */

/**
 * POST /api/breach/check
 * Check if a password has been compromised
 * Body: { password: string }
 * Returns: { isBreached: boolean, breachCount: number }
 */
router.post('/check', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Password is required and must be a string',
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 4 characters',
      });
    }

    // Compute SHA-1 hash of password
    const sha1Hash = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();

    // Split into prefix (5 chars) and suffix (rest)
    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5);

    // Query HIBP API with only the prefix
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          'User-Agent': 'VaultMaster-PasswordManager/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const text = await response.text();

    // Parse response to find matching hash suffix
    for (const line of text.split('\n')) {
      const [hash, count] = line.trim().split(':');
      if (hash === suffix) {
        const breachCount = parseInt(count, 10);
        return res.json({
          success: true,
          isBreached: breachCount > 0,
          breachCount,
        });
      }
    }

    // Hash not found in breaches
    return res.json({
      success: true,
      isBreached: false,
      breachCount: 0,
    });
  } catch (error) {
    console.error('Breach check error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Breach check failed',
    });
  }
});

/**
 * POST /api/breach/check-hash
 * Check if a hash prefix has been compromised
 * Body: { hashPrefix: string }
 * Returns: Array of matching hashes with their counts
 */
router.post('/check-hash', async (req, res) => {
  try {
    const { hashPrefix } = req.body;

    if (!hashPrefix || typeof hashPrefix !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Hash prefix is required',
      });
    }

    if (hashPrefix.length !== 5) {
      return res.status(400).json({
        success: false,
        error: 'Hash prefix must be exactly 5 characters',
      });
    }

    // Query HIBP API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${hashPrefix}`,
      {
        headers: {
          'User-Agent': 'VaultMaster-PasswordManager/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const text = await response.text();

    // Parse response
    const hashes = text.split('\n').map((line) => {
      const [hash, count] = line.trim().split(':');
      return {
        hash,
        count: parseInt(count, 10) || 0,
      };
    });

    res.json({
      success: true,
      prefix: hashPrefix,
      results: hashes,
    });
  } catch (error) {
    console.error('Hash check error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Hash check failed',
    });
  }
});

export default router;
