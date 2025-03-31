import express, { Request, Response } from 'express';
import multer from 'multer';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new entry
app.post('/entries', async (_req: Request, res: Response) => {
  const entryId = uuidv4();
  const timestamp = Date.now();
  
  await redis.hmset(`entry:${entryId}`, {
    createdAt: timestamp,
    status: 'new'
  });
  
  res.json({ 
    id: entryId,
    createdAt: timestamp
  });
});

// Upload images to an entry
app.post('/entries/:entryId/images', upload.array('images', 10), async (req: Request, res: Response) => {
  const { entryId } = req.params;
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  // Check if entry exists
  const entryExists = await redis.exists(`entry:${entryId}`);
  if (!entryExists) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  
  const imageIds = [];
  
  // Process each uploaded image
  for (const file of files) {
    const imageId = uuidv4();
    
    // Store image data with 1-hour expiration
    await redis.set(`image:${imageId}`, file.buffer, 'EX', 3600);
    
    // Store image metadata
    await redis.hmset(`image:${imageId}:metadata`, {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      status: 'pending',
      uploadedAt: Date.now()
    });
    
    // Add image to entry's image list
    await redis.rpush(`entry:${entryId}:images`, imageId);
    
    // Add to processing queue
    await redis.rpush('process_queue', imageId);
    
    imageIds.push(imageId);
  }
  
  // Update entry status
  await redis.hset(`entry:${entryId}`, 'status', 'processing');
  
  res.json({ 
    entryId,
    imageIds,
    count: files.length
  });
});

// Get entry details with images
app.get('/entries/:entryId', async (req: Request, res: Response) => {
  const { entryId } = req.params;
  
  // Get entry metadata
  const entryData = await redis.hgetall(`entry:${entryId}`);
  if (!entryData || Object.keys(entryData).length === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  
  // Get image IDs for this entry
  const imageIds = await redis.lrange(`entry:${entryId}:images`, 0, -1);
  
  // Get metadata for each image
  const images = [];
  for (const imageId of imageIds) {
    const imageMetadata = await redis.hgetall(`image:${imageId}:metadata`);
    images.push({
      id: imageId,
      ...imageMetadata
    });
  }
  
  res.json({
    id: entryId,
    ...entryData,
    images
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready' });
});

// Start the server if this is the main module
if (require.main === module) {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

// Export for testing
export { app }; 