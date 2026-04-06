import crypto from 'crypto';

/**
 * RIPEMD-160 Implementation
 * 
 * RIPEMD-160 is:
 * - Developed independently from SHA family (different attack surface)
 * - Used in Bitcoin address generation
 * - 160-bit output
 * - Still considered secure for non-password applications
 * 
 * We use it for:
 * - Domain fingerprinting (independent from SHA)
 * - Data integrity checksums (defense in depth)
 * - Short unique identifiers
 * 
 * NOT used for password hashing (Argon2 handles that)
 */
export class RIPEMD160 {
  /**
   * RIPEMD-160 hash
   * 
   * @param {string|Buffer} data 
   * @returns {Buffer} 20-byte hash
   */
  static hash(data) {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const hash = crypto.createHash('ripemd160');
    hash.update(input);
    return hash.digest();
  }

  /**
   * RIPEMD-160 hex string
   * 
   * @param {string|Buffer} data 
   * @returns {string} 40-char hex hash
   */
  static hexHash(data) {
    return this.hash(data).toString('hex');
  }

  /**
   * Double hash: SHA-256 → RIPEMD-160
   * Same approach used in Bitcoin (Hash160)
   * Provides security of both algorithms
   * 
   * @param {string|Buffer} data 
   * @returns {Buffer} 20-byte hash
   */
  static hash160(data) {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // First pass: SHA-256
    const sha256 = crypto.createHash('sha256');
    sha256.update(input);
    const firstHash = sha256.digest();
    
    // Second pass: RIPEMD-160
    const ripemd = crypto.createHash('ripemd160');
    ripemd.update(firstHash);
    return ripemd.digest();
  }

  /**
   * Triple hash: BLAKE2b → SHA-256 → RIPEMD-160
   * Maximum diversity of hash algorithms
   * Even if 2 out of 3 algorithms are broken, data is still protected
   * 
   * @param {string|Buffer} data 
   * @returns {Buffer} 20-byte hash
   */
  static tripleHash(data) {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // Pass 1: BLAKE2b-512
    const blake = crypto.createHash('blake2b512');
    blake.update(input);
    const pass1 = blake.digest();
    
    // Pass 2: SHA-256
    const sha = crypto.createHash('sha256');
    sha.update(pass1);
    const pass2 = sha.digest();
    
    // Pass 3: RIPEMD-160
    const ripemd = crypto.createHash('ripemd160');
    ripemd.update(pass2);
    return ripemd.digest();
  }

  /**
   * Create domain fingerprint using RIPEMD-160
   * Independent from SHA-based fingerprints
   * 
   * @param {string} domain 
   * @returns {string} 40-char hex fingerprint
   */
  static domainFingerprint(domain) {
    const normalized = domain.toLowerCase().replace(/^www\./, '');
    return this.hash160(normalized).toString('hex');
  }

  /**
   * Create a checksum for encrypted data integrity
   * Uses triple hash for maximum security
   * 
   * @param {string|Buffer} encryptedData 
   * @returns {string} Hex checksum
   */
  static checksum(encryptedData) {
    return this.tripleHash(encryptedData).toString('hex');
  }

  /**
   * Verify data integrity using checksum
   * Constant-time comparison prevents timing attacks
   * 
   * @param {string|Buffer} data 
   * @param {string} expectedChecksum 
   * @returns {boolean}
   */
  static verifyChecksum(data, expectedChecksum) {
    const computed = this.checksum(data);
    
    if (computed.length !== expectedChecksum.length) {
      return false;
    }
    
    // Constant-time comparison
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(expectedChecksum, 'hex');
    return crypto.timingSafeEqual(a, b);
  }
}
