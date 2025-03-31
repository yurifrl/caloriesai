import express, { Request, Response } from 'express';
import multer from 'multer';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;
const redis = new Redis(process.env.REDIS_URL);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const id = uuidv4();
  await redis.set(`image:${id}`, req.file.buffer, 'EX', 3600);

  res.json({ id });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready' });
});

app.listen(port, () => console.log(`Server running on port ${port}`)); 