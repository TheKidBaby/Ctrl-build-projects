import argon2 from 'argon2';
import { SecureRandom } from './secureRandom.js';

/**
 * Argon2id Password Hashing
 * OWASP Recommended Parameters (2024)
 */
export class Argon2Hasher {
  static OWASP_CONFIG = {
    type: argon2.argon2id,
    memoryCost: 19456,      // 19 MiB in KiB (reduced from 47 MiB for compatibility)
    timeCost: 2,            // MINIMUM is 2
    parallelism: 1,
    hashLength: 32,
    saltLength: 32
  };

  static HIGH_SECURITY_CONFIG = {
    type: argon2.argon2id,
    memoryCost: 65536,      // 64 MiB
    timeCost: 3,
    parallelism: 4,
    hashLength: 64,
    saltLength: 32
  };

  static async hash(password, config = this.OWASP_CONFIG) {
    if (!password || password.length < 1) {
      throw new Error('Password cannot be empty');
    }

    const salt = SecureRandom.salt(config.saltLength);

    const hash = await argon2.hash(password, {
      type: config.type,
      memoryCost: config.memoryCost,
      timeCost: config.timeCost,
      parallelism: config.parallelism,
      hashLength: config.hashLength,
      salt: salt,
      raw: false
    });

    return {
      hash,
      salt: salt.toString('base64'),
      algorithm: 'argon2id',
      version: argon2.version,
      params: {
        memoryCost: config.memoryCost,
        timeCost: config.timeCost,
        parallelism: config.parallelism
      }
    };
  }

  static async verify(password, hash) {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      console.error('Argon2 verification error:', error.message);
      return false;
    }
  }
}
