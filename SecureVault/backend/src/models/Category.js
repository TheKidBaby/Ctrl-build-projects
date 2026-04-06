import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Category {
  static TABLE = 'categories';

  static DEFAULT_CATEGORIES = [
    { name: 'Social', icon: 'users', color: '#3b82f6' },
    { name: 'Finance', icon: 'credit-card', color: '#10b981' },
    { name: 'Shopping', icon: 'shopping-cart', color: '#f59e0b' },
    { name: 'Work', icon: 'briefcase', color: '#6366f1' },
    { name: 'Email', icon: 'mail', color: '#ec4899' },
    { name: 'Entertainment', icon: 'play-circle', color: '#8b5cf6' },
    { name: 'Other', icon: 'globe', color: '#64748b' }
  ];

  static createDefaults(userId) {
    const stmt = db.prepare(`
      INSERT INTO ${this.TABLE} (id, user_id, name, icon, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();

    for (const cat of this.DEFAULT_CATEGORIES) {
      stmt.run(uuidv4(), userId, cat.name, cat.icon, cat.color, now);
    }
  }

  static findByUser(userId) {
    const stmt = db.prepare(`
      SELECT c.*, COUNT(p.id) as password_count
      FROM ${this.TABLE} c
      LEFT JOIN passwords p ON c.id = p.category_id AND p.is_deleted = 0
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.name
    `);
    return stmt.all(userId);
  }
}
