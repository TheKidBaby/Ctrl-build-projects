import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { BreachDetectionService } from '../services/breachDetection.js';

const router = express.Router();
router.use(authenticate);

/**
 * Check if a password has been breached (FREE)
 * POST /api/breach/check-password
 */
router.post('/check-password', async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const result = await BreachDetectionService.checkPassword(password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Batch check passwords (FREE but rate-limited)
 * POST /api/breach/check-batch
 */
router.post('/check-batch', async (req, res, next) => {
  try {
    const { passwords } = req.body;

    if (!passwords || !Array.isArray(passwords)) {
      return res.status(400).json({ error: 'Passwords array is required' });
    }

    if (passwords.length > 50) {
      return res.status(400).json({ 
        error: 'Maximum 50 passwords per batch to respect API limits' 
      });
    }

    const results = await BreachDetectionService.checkMultiplePasswords(passwords);
    const statistics = BreachDetectionService.getBreachStatistics(results);

    res.json({
      results,
      statistics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Analyze password strength and patterns (FREE - offline)
 * POST /api/breach/analyze
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const analysis = BreachDetectionService.analyzePassword(password);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

export default router;
