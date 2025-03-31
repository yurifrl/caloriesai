import Redis from 'ioredis';
import { OpenAI } from 'openai';
import { setTimeout } from 'timers/promises';
import z from 'zod';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define schema for structured response
const CalorieAnalysisSchema = z.object({
  calories: z.number().nullable(),
  explanation: z.string(),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']),
  foodItems: z.array(z.string()).optional(),
});

type CalorieAnalysis = z.infer<typeof CalorieAnalysisSchema>;

// Process images from the queue
async function processQueue() {
  while (true) {
    try {
      // Get the next image ID from the queue (blocking with timeout)
      const result = await redis.blpop('process_queue', 5);
      
      if (!result) {
        continue;
      }
      
      const imageId = result[1];
      console.log(`Processing image: ${imageId}`);
      
      // Update status to processing
      await redis.hset(`image:${imageId}:metadata`, 'status', 'processing');
      
      // Get the image data
      const imageBuffer = await redis.getBuffer(`image:${imageId}`);
      if (!imageBuffer) {
        console.error(`Image ${imageId} not found in Redis`);
        await redis.hset(`image:${imageId}:metadata`, 'status', 'error', 'error', 'Image data not found');
        continue;
      }
      
      try {
        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');
        
        // Send to OpenAI for analysis
        const response = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this food image and provide the following structured information:\n- calories: number of calories (null if unknown)\n- explanation: brief explanation of the estimate\n- confidence: your confidence level (high, medium, low, unknown)\n- foodItems: array of food items in the image\n\nProvide response as a valid JSON object." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 600,
          response_format: { type: "json_object" }
        });
        
        const rawAnalysis = response.choices[0]?.message?.content || "{}";
        let parsedAnalysis: CalorieAnalysis;
        
        try {
          const jsonAnalysis = JSON.parse(rawAnalysis);
          parsedAnalysis = CalorieAnalysisSchema.parse(jsonAnalysis);
        } catch (parseError) {
          console.error(`Failed to parse structured response: ${parseError}`);
          parsedAnalysis = {
            calories: null,
            explanation: "Failed to parse structured response from AI",
            confidence: "unknown",
            foodItems: []
          };
        }
        
        // Update the image metadata with the analysis results
        await redis.hset(
          `image:${imageId}:metadata`,
          'status', 'completed',
          'analysis', JSON.stringify(parsedAnalysis),
          'processedAt', Date.now()
        );
        
        console.log(`Completed analysis for image ${imageId}`);
        
      } catch (error) {
        console.error(`Error analyzing image ${imageId}:`, error);
        await redis.hset(
          `image:${imageId}:metadata`, 
          'status', 'error',
          'error', (error as Error).message || 'Unknown error during analysis'
        );
      }
      
    } catch (error) {
      console.error('Error in worker process:', error);
      // Wait a bit before retrying on error
      await setTimeout(5000);
    }
  }
}

// Start the worker
console.log('Starting image processing worker...');
processQueue().catch(err => {
  console.error('Fatal error in worker:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await redis.quit();
  await redisSub.quit();
  process.exit(0);
}); 