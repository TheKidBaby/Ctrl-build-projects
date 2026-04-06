import Datastore from 'nedb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize NeDB database
const db = new Datastore({
  filename: join(__dirname, '../db/vaults.db'),
  autoload: true,
  corruptAlertThreshold: 0.9
});

// Promisify database operations
const promisify = (fn) => {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export const VaultEntry = {
  /**
   * Create a new vault entry
   * Note: Data is encrypted client-side, server just stores the encrypted blob
   */
  create: async (userId, encryptedEntry) => {
    const entry = {
      id: uuidv4(),
      userId,
      // Encrypted data from client (contains: title, username, email, password, url, category, notes, etc.)
      encryptedData: encryptedEntry.encryptedData,
      iv: encryptedEntry.iv,
      salt: encryptedEntry.salt,
      // Metadata (not encrypted - for server-side filtering/search)
      category: encryptedEntry.category,
      isFavorite: encryptedEntry.isFavorite || false,
      passwordStrength: encryptedEntry.passwordStrength || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModifiedBy: encryptedEntry.lastModifiedBy || 'web'
    };

    return promisify((callback) => db.insert(entry, callback));
  },

  /**
   * Get all entries for a user
   */
  findByUserId: async (userId) => {
    return promisify((callback) => {
      db.find({ userId }, callback);
    });
  },

  /**
   * Get a specific entry by ID
   */
  findById: async (id, userId) => {
    return promisify((callback) => {
      db.findOne({ id, userId }, callback);
    });
  },

  /**
   * Update an entry
   */
  update: async (id, userId, updates) => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    return promisify((callback) => {
      db.update({ id, userId }, { $set: updateData }, {}, callback);
    });
  },

  /**
   * Delete an entry
   */
  delete: async (id, userId) => {
    return promisify((callback) => {
      db.remove({ id, userId }, {}, callback);
    });
  },

  /**
   * Delete all entries for a user (full vault wipe)
   */
  deleteByUserId: async (userId) => {
    return promisify((callback) => {
      db.remove({ userId }, { multi: true }, callback);
    });
  },

  /**
   * Count entries by category
   */
  countByCategory: async (userId, category) => {
    return promisify((callback) => {
      db.count({ userId, category }, callback);
    });
  },

  /**
   * Get all categories for a user
   */
  getCategories: async (userId) => {
    const entries = await promisify((callback) => {
      db.find({ userId }, callback);
    });

    const categories = [...new Set(entries.map(e => e.category))];
    return categories;
  },

  /**
   * Get favorite entries
   */
  getFavorites: async (userId) => {
    return promisify((callback) => {
      db.find({ userId, isFavorite: true }, callback);
    });
  },

  /**
   * Bulk insert entries (for import/restore)
   */
  bulkInsert: async (userId, entries) => {
    const withUserIdAndTimestamp = entries.map(entry => ({
      id: entry.id || uuidv4(),
      userId,
      encryptedData: entry.encryptedData,
      iv: entry.iv,
      salt: entry.salt,
      category: entry.category,
      isFavorite: entry.isFavorite || false,
      passwordStrength: entry.passwordStrength || 0,
      createdAt: entry.createdAt || new Date(),
      updatedAt: entry.updatedAt || new Date(),
      lastModifiedBy: entry.lastModifiedBy || 'import'
    }));

    return promisify((callback) => {
      db.insert(withUserIdAndTimestamp, callback);
    });
  },

  /**
   * Export all entries for a user (for backup)
   */
  export: async (userId) => {
    return promisify((callback) => {
      db.find({ userId }, (err, entries) => {
        if (err) {
          callback(err, null);
        } else {
          // Return encrypted data only
          const exported = entries.map(({ userId, createdAt, ...rest }) => rest);
          callback(null, exported);
        }
      });
    });
  },

  /**
   * Get database statistics
   */
  getStats: async (userId) => {
    const entries = await promisify((callback) => {
      db.find({ userId }, callback);
    });

    const categories = [...new Set(entries.map(e => e.category))];
    const favorites = entries.filter(e => e.isFavorite).length;
    const avgStrength = entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.passwordStrength, 0) / entries.length)
      : 0;

    return {
      total: entries.length,
      categories: categories.length,
      favorites,
      avgPasswordStrength: avgStrength,
      createdAt: entries.length > 0 ? entries[0].createdAt : null,
      lastModified: entries.length > 0
        ? new Date(Math.max(...entries.map(e => new Date(e.updatedAt))))
        : null
    };
  },

  /**
   * Clear all entries (for testing)
   */
  clear: async () => {
    return promisify((callback) => {
      db.remove({}, { multi: true }, callback);
    });
  }
};

export default VaultEntry;
