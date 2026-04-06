import crypto from 'crypto';

export class SecureRandom {
  static bytes(length) {
    if (length < 1 || length > 1024) {
      throw new Error('Length must be between 1 and 1024 bytes');
    }
    return crypto.randomBytes(length);
  }

  static hex(length) {
    return this.bytes(length).toString('hex');
  }

  static base64(length) {
    return this.bytes(length).toString('base64url');
  }

  static int(min, max) {
    if (min >= max) {
      throw new Error('Min must be less than max');
    }
    
    const range = max - min + 1;
    const bitsNeeded = Math.ceil(Math.log2(range));
    const bytesNeeded = Math.ceil(bitsNeeded / 8);
    const maxValid = Math.pow(2, bitsNeeded) - (Math.pow(2, bitsNeeded) % range);
    
    let value;
    do {
      const bytes = this.bytes(bytesNeeded);
      value = 0;
      for (let i = 0; i < bytesNeeded; i++) {
        value = (value << 8) | bytes[i];
      }
      value = value & (Math.pow(2, bitsNeeded) - 1);
    } while (value >= maxValid);
    
    return min + (value % range);
  }

  static salt(length = 32) {
    if (length < 16) {
      throw new Error('Salt must be at least 16 bytes');
    }
    return this.bytes(length);
  }
}
