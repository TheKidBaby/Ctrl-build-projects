import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  res.json({ synced: true });
});

export default router;
