import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Password {
  static TABLE = 'passwords';

  static create({ userId, encryptedData, iv, tag, categoryId, iconUrl, domainHash }) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO ${this.TABLE} 
      (id, user_id, encrypted_data, iv, tag, category_id, icon_url, domain_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, userId, encryptedData, iv, tag || '', categoryId, iconUrl, domainHash, now, now);

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT * FROM ${this.TABLE} 
      WHERE id = ? AND is_deleted = 0
    `);
    return stmt.get(id);
  }

  static findByUser(userId) {
    const stmt = db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM ${this.TABLE} p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ? AND p.is_deleted = 0
      ORDER BY p.updated_at DESC
    `);
    return stmt.all(userId);
  }

  static update(id, { encryptedData, iv, tag, categoryId, iconUrl }) {
    const now = Date.now();

    const stmt = db.prepare(`
      UPDATE ${this.TABLE}
      SET encrypted_data = ?,
          iv = ?,
          tag = ?,
          category_id = ?,
          icon_url = COALESCE(?, icon_url),
          updated_at = ?,
          version = version + 1
      WHERE id = ?
    `);

    stmt.run(encryptedData, iv, tag || '', categoryId, iconUrl, now, id);
    return this.findById(id);
  }

  static softDelete(id) {
    const now = Date.now();
    const stmt = db.prepare(`
      UPDATE ${this.TABLE}
      SET is_deleted = 1, deleted_at = ?, updated_at = ?
      WHERE id = ?
    `);
    return stmt.run(now, now, id);
  }

  static toggleFavorite(id) {
    const stmt = db.prepare(`
      UPDATE ${this.TABLE}
      SET favorite = CASE WHEN favorite = 0 THEN 1 ELSE 0 END,
          updated_at = ?
      WHERE id = ?
    `);
    return stmt.run(Date.now(), id);
  }
}
