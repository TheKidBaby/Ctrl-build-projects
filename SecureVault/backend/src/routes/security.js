import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Blake2 } from '../crypto/blake2.js';
import { RIPEMD160 } from '../crypto/ripemd160.js';

const router = express.Router();
router.use(authenticate);

/**
 * Get security information about the vault
 * Shows which algorithms are protecting user data
 */
router.get('/info', (req, res) => {
  res.json({
    encryption: {
      algorithm: 'AES-256-GCM',
      keySize: 256,
      ivSize: 96,
      tagSize: 128,
      mode: 'Galois/Counter Mode (AEAD)'
    },
    passwordHashing: {
      algorithm: 'Argon2id',
      memoryCost: '19 MiB',
      timeCost: 2,
      parallelism: 1,
      saltSize: 256,
      outputSize: 256
    },
    keyDerivation: {
      primary: 'PBKDF2-HMAC-SHA512 (600,000 iterations)',
      strengthening: 'BLAKE2b-512 (3 rounds)',
      expansion: 'HKDF-SHA512'
    },
    integrityVerification: {
      mac: 'BLAKE2b-512 (keyed)',
      checksum: 'RIPEMD-160',
      combined: 'BLAKE2b → SHA-256 → RIPEMD-160 (triple hash)'
    },
    randomGeneration: 'CSPRNG (OS-level)',
    hashAlgorithmFamilies: [
      'Argon2 (Password Hashing Competition winner)',
      'BLAKE2b (RFC 7693)',
      'SHA-2 (NIST)',
      'RIPEMD-160 (Independent European design)',
      'AES (NIST, hardware accelerated)'
    ],
    zeroKnowledge: true,
    clientSideEncryption: true,
    serverSeesPlaintext: false
  });
});

/**
 * Verify a hash for testing
 * POST /api/security/verify-hash
 */
router.post('/verify-hash', (req, res) => {
  const { data, algorithm } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Data required' });
  }

  const results = {};

  if (!algorithm || algorithm === 'blake2b') {
    results.blake2b512 = Blake2.hash512(data).toString('hex');
    results.blake2b256 = Blake2.hash256(data).toString('hex');
    results.blake2bFingerprint = Blake2.fingerprint(data);
  }

  if (!algorithm || algorithm === 'ripemd160') {
    results.ripemd160 = RIPEMD160.hexHash(data);
    results.hash160 = RIPEMD160.hash160(data).toString('hex');
    results.tripleHash = RIPEMD160.tripleHash(data).toString('hex');
  }

  res.json({
    input: data,
    hashes: results,
    algorithms: ['BLAKE2b-512', 'BLAKE2b-256', 'SHA-256', 'RIPEMD-160']
  });
});

export default router;
