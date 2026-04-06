import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Category } from '../models/Category.js';

const router = express.Router();
router.use(authenticate);

router.get('/categories', (req, res, next) => {
  try {
    const categories = Category.findByUser(req.user.id);
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

export default router;
