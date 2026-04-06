import express from 'express';
import { z } from 'zod';
import { Password } from '../models/Password.js';
import { authenticate } from '../middleware/auth.js';
import { Blake2 } from '../crypto/blake2.js';
import { RIPEMD160 } from '../crypto/ripemd160.js';
import { EnhancedKeyDerivation } from '../crypto/enhancedKeyDerivation.js';

const router = express.Router();
router.use(authenticate);

const createPasswordSchema = z.object({
  encrypted_data: z.string(),
  iv: z.string(),
  tag: z.string().optional(),
  category_id: z.string().optional(),
  icon_url: z.string().optional(),
  domain_hash: z.string().optional(),
  domain: z.string().optional()
});

router.get('/', (req, res, next) => {
  try {
    const passwords = Password.findByUser(req.user.id);
    res.json(passwords);
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const data = createPasswordSchema.parse(req.body);
    
    // Generate enhanced domain hash using BLAKE2b + RIPEMD-160
    let domainHash = data.domain_hash;
    if (data.domain && !domainHash) {
      domainHash = EnhancedKeyDerivation.domainHash(data.domain);
    }

    // Create RIPEMD-160 checksum for encrypted data integrity
    const dataChecksum = RIPEMD160.checksum(data.encrypted_data);
    
    // Create BLAKE2b fingerprint for quick lookups
    const dataFingerprint = Blake2.fingerprint(data.encrypted_data);

    const password = Password.create({
      userId: req.user.id,
      encryptedData: data.encrypted_data,
      iv: data.iv,
      tag: data.tag || dataChecksum, // Use RIPEMD-160 checksum as integrity tag
      categoryId: data.category_id,
      iconUrl: data.icon_url,
      domainHash: domainHash
    });

    res.status(201).json({
      ...password,
      integrity: {
        checksum: dataChecksum,
        fingerprint: dataFingerprint,
        algorithm: 'ripemd160+blake2b'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const data = createPasswordSchema.parse(req.body);
    
    // Verify integrity of existing data before update
    const existing = Password.findById(req.params.id);
    if (existing && existing.tag) {
      const isValid = RIPEMD160.verifyChecksum(existing.encrypted_data, existing.tag);
      if (!isValid) {
        console.warn(`Data integrity check failed for password ${req.params.id}`);
      }
    }

    // Create new checksum for updated data
    const dataChecksum = RIPEMD160.checksum(data.encrypted_data);
    
    const password = Password.update(req.params.id, {
      encryptedData: data.encrypted_data,
      iv: data.iv,
      tag: data.tag || dataChecksum,
      categoryId: data.category_id,
      iconUrl: data.icon_url
    });

    res.json(password);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    Password.softDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/favorite', (req, res, next) => {
  try {
    Password.toggleFavorite(req.params.id);
    const password = Password.findById(req.params.id);
    res.json(password);
  } catch (error) {
    next(error);
  }
});

// New endpoint: Verify data integrity
router.get('/:id/verify', (req, res, next) => {
  try {
    const password = Password.findById(req.params.id);
    if (!password) {
      return res.status(404).json({ error: 'Not found' });
    }

    // RIPEMD-160 integrity check
    const ripemdValid = password.tag 
      ? RIPEMD160.verifyChecksum(password.encrypted_data, password.tag)
      : null;

    // BLAKE2b fingerprint for verification
    const currentFingerprint = Blake2.fingerprint(password.encrypted_data);

    res.json({
      id: password.id,
      integrity: {
        ripemd160Valid: ripemdValid,
        blake2bFingerprint: currentFingerprint,
        lastVerified: Date.now()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
