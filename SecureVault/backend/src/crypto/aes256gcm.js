import crypto from 'crypto';
import { SecureRandom } from './secureRandom.js';

export class AES256GCM {
  static ALGORITHM = 'aes-256-gcm';
  static KEY_LENGTH = 32;
  static IV_LENGTH = 12;
  static TAG_LENGTH = 16;

  static encrypt(plaintext, key, aad = '') {
    if (key.length !== this.KEY_LENGTH) {
      throw new Error(`Key must be ${this.KEY_LENGTH} bytes`);
    }

    const iv = SecureRandom.bytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.TAG_LENGTH
    });

    if (aad) {
      cipher.setAAD(Buffer.from(aad, 'utf8'));
    }

    const data = Buffer.isBuffer(plaintext) 
      ? plaintext 
      : Buffer.from(plaintext, 'utf8');

    const ciphertext = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      algorithm: this.ALGORITHM
    };
  }

  static decrypt(ciphertext, key, iv, tag, aad = '') {
    if (key.length !== this.KEY_LENGTH) {
      throw new Error(`Key must be ${this.KEY_LENGTH} bytes`);
    }

    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(iv, 'base64'),
      { authTagLength: this.TAG_LENGTH }
    );

    decipher.setAuthTag(Buffer.from(tag, 'base64'));

    if (aad) {
      decipher.setAAD(Buffer.from(aad, 'utf8'));
    }

    try {
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final()
      ]);

      return plaintext.toString('utf8');
    } catch (error) {
      throw new Error('Decryption failed: Invalid key or tampered data');
    }
  }
}

