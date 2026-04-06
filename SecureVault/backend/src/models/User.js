import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { Argon2Hasher } from '../crypto/argon2.js';

export class User {
  static TABLE = 'users';

  static async create({ email, password }) {
    const id = uuidv4();
    const now = Date.now();

    const { hash, salt } = await Argon2Hasher.hash(password);

    const stmt = db.prepare(`
      INSERT INTO ${this.TABLE} 
      (id, email, password_hash, salt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email.toLowerCase(), hash, salt, now, now);

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT id, email, password_hash, salt, created_at, updated_at, last_login, is_active
      FROM ${this.TABLE} 
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  static findByEmail(email) {
    const stmt = db.prepare(`
      SELECT id, email, password_hash, salt, created_at, updated_at, last_login, is_active
      FROM ${this.TABLE} 
      WHERE email = ? AND is_active = 1
    `);
    return stmt.get(email.toLowerCase());
  }

  static async verifyPassword(user, password) {
    return await Argon2Hasher.verify(password, user.password_hash);
  }

  static updateLastLogin(id) {
    const stmt = db.prepare(`
      UPDATE ${this.TABLE}
      SET last_login = ?
      WHERE id = ?
    `);
    return stmt.run(Date.now(), id);
  }
}
