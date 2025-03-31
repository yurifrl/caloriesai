import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';
import { redis } from './setup';

// We need to import the app directly since we're not mocking Redis
let app: Express;

describe('API Endpoints', () => {
  beforeAll(async () => {
    const { app: expressApp } = await import('../index');
    app = expressApp;
  });

  afterEach(async () => {
    // Clear all data between tests
    await redis.flushall();
  });

  describe('Entries', () => {
    it('should create a new entry', async () => {
      const response = await supertest(app).post('/entries');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');

      // Verify data was actually stored in Redis
      const entryExists = await redis.exists(`entry:${response.body.id}`);
      expect(entryExists).toBe(1);
    });

    it('should upload images to an entry', async () => {
      // First create an entry
      const createResponse = await supertest(app).post('/entries');
      const entryId = createResponse.body.id;
      
      // Then upload images to it
      const response = await supertest(app)
        .post(`/entries/${entryId}/images`)
        .attach('images', Buffer.from('fake image data'), 'test1.jpg')
        .attach('images', Buffer.from('another fake image'), 'test2.jpg');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entryId', entryId);
      expect(response.body).toHaveProperty('imageIds');
      expect(response.body.imageIds).toHaveLength(2);
      expect(response.body).toHaveProperty('count', 2);

      // Verify images were stored in Redis
      const imagesList = await redis.lrange(`entry:${entryId}:images`, 0, -1);
      expect(imagesList.length).toBe(2);
      
      // Verify image data exists
      for (const imageId of response.body.imageIds) {
        const imageExists = await redis.exists(`image:${imageId}`);
        expect(imageExists).toBe(1);
        
        const metadataExists = await redis.exists(`image:${imageId}:metadata`);
        expect(metadataExists).toBe(1);
      }

      // Verify entry status was updated
      const entryData = await redis.hgetall(`entry:${entryId}`);
      expect(entryData.status).toBe('processing');
    });

    it('should get entry details with images', async () => {
      // First create an entry
      const createResponse = await supertest(app).post('/entries');
      const entryId = createResponse.body.id;
      
      // Upload images to the entry
      const uploadResponse = await supertest(app)
        .post(`/entries/${entryId}/images`)
        .attach('images', Buffer.from('test image 1'), 'test1.jpg')
        .attach('images', Buffer.from('test image 2'), 'test2.jpg');
      
      // Then get the entry details
      const response = await supertest(app).get(`/entries/${entryId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', entryId);
      expect(response.body).toHaveProperty('status', 'processing');
      expect(response.body).toHaveProperty('images');
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBe(2);
      
      // Verify image metadata
      for (const image of response.body.images) {
        expect(image).toHaveProperty('id');
        expect(image).toHaveProperty('filename');
        expect(image).toHaveProperty('mimetype');
        expect(image).toHaveProperty('size');
        expect(image).toHaveProperty('status', 'pending');
      }
    });
  });
}); 