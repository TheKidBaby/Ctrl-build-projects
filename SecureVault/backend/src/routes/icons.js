import express from 'express';
const router = express.Router();

router.get('/:domain', (req, res) => {
  res.json({ icon: null });
});

export default router;
