import express from 'express';
import { VaultEntry } from '../models/VaultEntry.js';

const router = express.Router();

/**
 * Middleware to validate userId in request
 * In production, this would verify JWT token and extract userId
 */
const validateUser = (req, res, next) => {
  // For now, userId comes from query or body
  const userId = req.query.userId || req.body.userId || req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: userId required' });
  }
  req.userId = userId;
  next();
};

router.use(validateUser);

/**
 * GET /api/vault/entries
 * Get all vault entries for the authenticated user
 */
router.get('/entries', async (req, res) => {
  try {
    const entries = await VaultEntry.findByUserId(req.userId);
    res.json({
      success: true,
      data: entries,
      count: entries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vault/entries/:id
 * Get a specific vault entry
 */
router.get('/entries/:id', async (req, res) => {
  try {
    const entry = await VaultEntry.findById(req.params.id, req.userId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vault/entries
 * Create a new vault entry
 * Expected body:
 * {
 *   encryptedData: string (encrypted blob),
 *   iv: string,
 *   salt: string,
 *   category: string,
 *   isFavorite: boolean,
 *   passwordStrength: number,
 *   lastModifiedBy: string
 * }
 */
router.post('/entries', async (req, res) => {
  try {
    const {
      encryptedData,
      iv,
      salt,
      category,
      isFavorite,
      passwordStrength,
      lastModifiedBy
    } = req.body;

    if (!encryptedData || !iv || !salt || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: encryptedData, iv, salt, category'
      });
    }

    const entry = await VaultEntry.create(req.userId, {
      encryptedData,
      iv,
      salt,
      category,
      isFavorite,
      passwordStrength,
      lastModifiedBy
    });

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Entry created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/vault/entries/:id
 * Update a vault entry
 */
router.put('/entries/:id', async (req, res) => {
  try {
    const {
      encryptedData,
      iv,
      salt,
      category,
      isFavorite,
      passwordStrength,
      lastModifiedBy
    } = req.body;

    // Only allow updating if at least one field is provided
    if (!encryptedData && !category && isFavorite === undefined && passwordStrength === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      });
    }

    const updateData = {};
    if (encryptedData) updateData.encryptedData = encryptedData;
    if (iv) updateData.iv = iv;
    if (salt) updateData.salt = salt;
    if (category) updateData.category = category;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (passwordStrength !== undefined) updateData.passwordStrength = passwordStrength;
    if (lastModifiedBy) updateData.lastModifiedBy = lastModifiedBy;

    const updated = await VaultEntry.update(req.params.id, req.userId, updateData);

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // Fetch updated entry to return
    const entry = await VaultEntry.findById(req.params.id, req.userId);

    res.json({
      success: true,
      data: entry,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/vault/entries/:id
 * Delete a vault entry
 */
router.delete('/entries/:id', async (req, res) => {
  try {
    const deleted = await VaultEntry.delete(req.params.id, req.userId);

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vault/sync
 * Sync vault entries (bulk create/update)
 * This endpoint handles syncing multiple entries at once
 */
router.post('/sync', async (req, res) => {
  try {
    const { entries, lastSync } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: 'Entries must be an array'
      });
    }

    // For each entry, check if it exists and create/update accordingly
    const results = [];
    for (const entry of entries) {
      try {
        const existing = await VaultEntry.findById(entry.id, req.userId);
        if (existing) {
          // Update if server version is older
          if (new Date(entry.updatedAt) > new Date(existing.updatedAt)) {
            await VaultEntry.update(entry.id, req.userId, entry);
            results.push({ id: entry.id, status: 'updated' });
          } else {
            results.push({ id: entry.id, status: 'skipped' });
          }
        } else {
          // Create new entry
          await VaultEntry.create(req.userId, entry);
          results.push({ id: entry.id, status: 'created' });
        }
      } catch (err) {
        results.push({ id: entry.id, status: 'error', error: err.message });
      }
    }

    // Get updated entries
    const updatedEntries = await VaultEntry.findByUserId(req.userId);

    res.json({
      success: true,
      syncResults: results,
      data: updatedEntries,
      lastSync: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vault/import
 * Bulk import entries (restore from backup)
 */
router.post('/import', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: 'Entries must be an array'
      });
    }

    const imported = await VaultEntry.bulkInsert(req.userId, entries);

    res.status(201).json({
      success: true,
      message: `${entries.length} entries imported successfully`,
      count: entries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vault/export
 * Export all vault entries (for backup)
 * Returns encrypted entries only
 */
router.get('/export', async (req, res) => {
  try {
    const entries = await VaultEntry.export(req.userId);

    res.json({
      success: true,
      data: entries,
      count: entries.length,
      exportedAt: new Date(),
      format: 'encrypted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vault/stats
 * Get vault statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await VaultEntry.getStats(req.userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vault/categories
 * Get all categories used in user's vault
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await VaultEntry.getCategories(req.userId);

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vault/favorites
 * Get favorite entries
 */
router.get('/favorites', async (req, res) => {
  try {
    const favorites = await VaultEntry.getFavorites(req.userId);

    res.json({
      success: true,
      data: favorites,
      count: favorites.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/vault/clear
 * Clear all entries for user (DANGEROUS - use with caution)
 * Requires confirmation header
 */
router.delete('/clear', async (req, res) => {
  try {
    const confirm = req.headers['x-confirm-delete'];

    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Must include x-confirm-delete: true header to clear vault'
      });
    }

    await VaultEntry.deleteByUserId(req.userId);

    res.json({
      success: true,
      message: 'Vault cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vault/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'Vault API is running'
  });
});

export default router;
