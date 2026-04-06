import express from 'express';
import { z } from 'zod';
import { Password } from '../models/Password.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

const createPasswordSchema = z.object({
  encrypted_data: z.string(),
  iv: z.string(),
  tag: z.string().optional(),
  category_id: z.string().optional(),
  icon_url: z.string().optional(),
  domain_hash: z.string().optional()
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
    
    const password = Password.create({
      userId: req.user.id,
      encryptedData: data.encrypted_data,
      iv: data.iv,
      tag: data.tag,
      categoryId: data.category_id,
      iconUrl: data.icon_url,
      domainHash: data.domain_hash
    });

    res.status(201).json(password);
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
    
    const password = Password.update(req.params.id, {
      encryptedData: data.encrypted_data,
      iv: data.iv,
      tag: data.tag,
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

export default router;
