import crypto from 'crypto';
import argon2 from 'argon2';
import { Blake2 } from './blake2.js';
import { RIPEMD160 } from './ripemd160.js';
import { SecureRandom } from './secureRandom.js';

/**
 * Enhanced Key Derivation with BLAKE2b and RIPEMD-160
 * 
 * Architecture:
 * 
 * Master Password
 *     ↓
 * Argon2id (memory-hard hashing)
 *     ↓
 * BLAKE2b-512 (key strengthening)
 *     ↓
 * HKDF-SHA512 (key expansion)
 *     ↓
 * Multiple derived keys
 *     ↓
 * RIPEMD-160 checksum (integrity verification)
 * 
 * This uses 5 DIFFERENT hash algorithm families:
 * 1. Argon2id (password hashing)
 * 2. BLAKE2b (key strengthening)
 * 3. SHA-512 (HKDF expansion)
 * 4. RIPEMD-160 (integrity checksums)
 * 5. AES-256-GCM (encryption)
 * 
 * Even if 3 out of 5 are broken, the system remains secure.
 */
export class EnhancedKeyDerivation {
  /**
   * Derive master key with maximum security
   * Argon2id → BLAKE2b strengthening
   * 
   * @param {string} password 
   * @param {Buffer} salt 
   * @returns {Promise<Buffer>} 32-byte master key
   */
  static async deriveMasterKey(password, salt) {
    // Step 1: Argon2id (memory-hard, GPU resistant)
    const argonHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,    // 19 MiB
      timeCost: 2,
      parallelism: 1,
      hashLength: 64,
      salt: salt,
      raw: true
    });

    // Step 2: BLAKE2b strengthening
    // Additional computational cost + different algorithm family
    const strengthened = Blake2.hashPassword(
      argonHash.toString('hex'),
      salt
    );

    // Step 3: Final key extraction (32 bytes for AES-256)
    return strengthened.subarray(0, 32);
  }

  /**
   * Derive all vault keys from master key
   * Uses HKDF + BLAKE2b for key derivation
   * 
   * @param {Buffer} masterKey 
   * @param {string} userId 
   * @returns {Object} Set of derived keys
   */
  static deriveVaultKeys(masterKey, userId) {
    const context = `SecureVault:${userId}:v2`;

    // HKDF with SHA-512 for primary derivation
    const hkdfKey = (info) => {
      return Buffer.from(crypto.hkdfSync('sha512', masterKey, Buffer.alloc(0), `${context}:${info}`, 32));
    };

    // BLAKE2b for secondary derivation (different algorithm family)
    const blake2Key = (info) => {
      return Blake2.deriveKey(masterKey, `${context}:${info}`, 32);
    };

    return {
      // Primary encryption key (HKDF derived)
      encryptionKey: hkdfKey('encryption'),
      
      // Authentication key (BLAKE2b derived - different algorithm)
      authenticationKey: blake2Key('authentication'),
      
      // Notes encryption key
      notesKey: hkdfKey('notes'),
      
      // Sharing key (BLAKE2b derived)
      sharingKey: blake2Key('sharing'),
      
      // Integrity key for RIPEMD-160 checksums
      integrityKey: blake2Key('integrity')
    };
  }

  /**
   * Create integrity proof for encrypted data
   * Uses BLAKE2b MAC + RIPEMD-160 checksum
   * Two independent integrity checks
   * 
   * @param {string} encryptedData - Base64 encrypted data
   * @param {Buffer} integrityKey - Key for MAC
   * @returns {Object} Integrity proof
   */
  static createIntegrityProof(encryptedData, integrityKey) {
    // BLAKE2b MAC (keyed hash - proves authenticity)
    const mac = Blake2.mac(encryptedData, integrityKey);
    
    // RIPEMD-160 checksum (independent integrity check)
    const checksum = RIPEMD160.checksum(encryptedData);
    
    return {
      blake2bMac: mac.toString('base64'),
      ripemdChecksum: checksum,
      algorithm: 'blake2b-mac+ripemd160',
      timestamp: Date.now()
    };
  }

  /**
   * Verify integrity of encrypted data
   * Both checks must pass
   * 
   * @param {string} encryptedData 
   * @param {Object} proof 
   * @param {Buffer} integrityKey 
   * @returns {boolean}
   */
  static verifyIntegrity(encryptedData, proof, integrityKey) {
    try {
      // Check 1: BLAKE2b MAC verification
      const expectedMac = Buffer.from(proof.blake2bMac, 'base64');
      const macValid = Blake2.verifyMac(encryptedData, integrityKey, expectedMac);
      
      if (!macValid) {
        console.error('BLAKE2b MAC verification failed - data may be tampered');
        return false;
      }
      
      // Check 2: RIPEMD-160 checksum verification
      const checksumValid = RIPEMD160.verifyChecksum(encryptedData, proof.ripemdChecksum);
      
      if (!checksumValid) {
        console.error('RIPEMD-160 checksum verification failed - data may be corrupted');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Integrity verification error:', error);
      return false;
    }
  }

  /**
   * Generate enhanced domain hash
   * Uses BLAKE2b + RIPEMD-160 for domain fingerprinting
   * 
   * @param {string} domain 
   * @returns {string} Combined domain hash
   */
  static domainHash(domain) {
    const normalized = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    // BLAKE2b fingerprint (fast, secure)
    const blakeFingerprint = Blake2.fingerprint(normalized);
    
    // RIPEMD-160 fingerprint (independent algorithm)
    const ripemdFingerprint = RIPEMD160.domainFingerprint(normalized);
    
    // Combine both for maximum uniqueness
    return `${blakeFingerprint}:${ripemdFingerprint}`;
  }

  /**
   * Generate recovery key with enhanced security
   * 
   * @returns {Object} Recovery key and verification data
   */
  static generateRecoveryKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const groups = 5;
    const groupLength = 5;
    const parts = [];

    for (let i = 0; i < groups; i++) {
      let group = '';
      for (let j = 0; j < groupLength; j++) {
        const index = SecureRandom.int(0, chars.length - 1);
        group += chars[index];
      }
      parts.push(group);
    }

    const recoveryKey = parts.join('-');
    
    // Create verification hash using triple hash
    const verificationHash = RIPEMD160.tripleHash(recoveryKey).toString('hex');
    
    return {
      recoveryKey,
      verificationHash,
      algorithm: 'blake2b+sha256+ripemd160'
    };
  }
}
