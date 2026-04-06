import crypto from 'crypto';

/**
 * BLAKE2b Implementation
 * 
 * BLAKE2b is:
 * - Faster than SHA-256, SHA-512, SHA-3, and MD5
 * - As secure as SHA-3
 * - RFC 7693 standardized
 * - Used in Argon2, WireGuard, Linux kernel
 * - No known attacks
 * 
 * We use Node.js built-in crypto which supports BLAKE2b512 and BLAKE2s256
 */
export class Blake2 {
  /**
   * BLAKE2b-512 hash
   * Use for: key strengthening, integrity verification
   * 
   * @param {string|Buffer} data - Data to hash
   * @param {Buffer|null} key - Optional key for keyed hashing (MAC)
   * @returns {Buffer} 64-byte hash
   */
  static hash512(data, key = null) {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    if (key) {
      // Keyed BLAKE2b (acts as MAC - Message Authentication Code)
      const hmac = crypto.createHmac('sha512', key);
      hmac.update(input);
      const hmacResult = hmac.digest();
      
      // Then BLAKE2b on the result
      const hash = crypto.createHash('blake2b512');
      hash.update(hmacResult);
      return hash.digest();
    }
    
    const hash = crypto.createHash('blake2b512');
    hash.update(input);
    return hash.digest();
  }

  /**
   * BLAKE2b-256 hash (truncated for shorter output)
   * Use for: checksums, identifiers, compact hashes
   * 
   * @param {string|Buffer} data 
   * @param {Buffer|null} key
   * @returns {Buffer} 32-byte hash
   */
  static hash256(data, key = null) {
    const full = this.hash512(data, key);
    return full.subarray(0, 32);
  }

  /**
   * BLAKE2b MAC (Message Authentication Code)
   * Proves data hasn't been tampered with AND verifies sender
   * 
   * @param {string|Buffer} data - Data to authenticate
   * @param {Buffer} key - Secret key
   * @returns {Buffer} 64-byte MAC
   */
  static mac(data, key) {
    if (!key || key.length < 16) {
      throw new Error('MAC key must be at least 16 bytes');
    }

    const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // Double MAC: HMAC-SHA512 → BLAKE2b
    // This ensures security even if one algorithm is compromised
    const hmac = crypto.createHmac('sha512', key);
    hmac.update(input);
    const firstPass = hmac.digest();

    const hash = crypto.createHash('blake2b512');
    hash.update(Buffer.concat([firstPass, key]));
    return hash.digest();
  }

  /**
   * Verify a MAC
   * Uses constant-time comparison to prevent timing attacks
   * 
   * @param {string|Buffer} data 
   * @param {Buffer} key 
   * @param {Buffer} expectedMac 
   * @returns {boolean}
   */
  static verifyMac(data, key, expectedMac) {
    const computedMac = this.mac(data, key);
    return crypto.timingSafeEqual(computedMac, expectedMac);
  }

  /**
   * Derive a key using BLAKE2b
   * Additional key strengthening on top of PBKDF2/Argon2
   * 
   * @param {Buffer} inputKey - Key material
   * @param {string} context - Context string (e.g., "encryption", "auth")
   * @param {number} outputLength - Desired key length (16, 32, or 64)
   * @returns {Buffer}
   */
  static deriveKey(inputKey, context, outputLength = 32) {
    if (outputLength !== 16 && outputLength !== 32 && outputLength !== 64) {
      throw new Error('Output length must be 16, 32, or 64');
    }

    const contextBuffer = Buffer.from(context, 'utf8');
    
    // Mix input key with context
    const mixed = Buffer.concat([inputKey, contextBuffer]);
    
    // Hash with BLAKE2b
    const hash = crypto.createHash('blake2b512');
    hash.update(mixed);
    const result = hash.digest();
    
    return result.subarray(0, outputLength);
  }

  /**
   * Create a fingerprint for data identification
   * Short hash for quick lookups
   * 
   * @param {string} data 
   * @returns {string} Hex fingerprint
   */
  static fingerprint(data) {
    return this.hash256(data).toString('hex').substring(0, 16);
  }

  /**
   * Hash password for additional security layer
   * NOT a replacement for Argon2 - an additional layer
   * 
   * @param {string} password 
   * @param {Buffer} salt 
   * @returns {Buffer}
   */
  static hashPassword(password, salt) {
    // Multiple rounds of BLAKE2b with salt
    let result = Buffer.from(password, 'utf8');
    
    for (let i = 0; i < 3; i++) {
      const hash = crypto.createHash('blake2b512');
      hash.update(Buffer.concat([result, salt, Buffer.from([i])]));
      result = hash.digest();
    }
    
    return result;
  }
}
