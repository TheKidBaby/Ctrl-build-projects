import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    const existing = User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ email, password });
    Category.createDefaults(user.id);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        salt: user.salt,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await User.verifyPassword(user, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    User.updateLastLogin(user.id);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        salt: user.salt,
        lastLogin: user.last_login
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

export default router;
