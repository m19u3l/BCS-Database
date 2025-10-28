import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.send(`${req.baseUrl} endpoint active ✅`);
});

export default router;
