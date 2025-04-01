import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export type Entry = {
  id: string;
  createdAt: number;
  status: 'new' | 'processing' | 'completed';
  images?: Image[];
};

export type Image = {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  uploadedAt: number;
  analysis?: {
    calories: number | null;
    explanation: string;
    confidence: 'high' | 'medium' | 'low' | 'unknown';
    foodItems?: string[];
  };
};

export const api = {
  async createEntry(): Promise<Entry> {
    const response = await fetch(`${API_URL}/entries`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create entry: ${response.status}`);
    }
    
    const entry = await response.json();
    
    // Save the current entry ID to storage
    await AsyncStorage.setItem('currentEntryId', entry.id);
    
    return entry;
  },
  
  async uploadImages(entryId: string, images: FormData): Promise<{ entryId: string; imageIds: string[]; count: number }> {
    const response = await fetch(`${API_URL}/entries/${entryId}/images`, {
      method: 'POST',
      body: images,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.status}`);
    }
    
    return response.json();
  },
  
  async getEntry(entryId: string): Promise<Entry> {
    const response = await fetch(`${API_URL}/entries/${entryId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get entry: ${response.status}`);
    }
    
    return response.json();
  },
  
  async getCurrentEntryId(): Promise<string | null> {
    return AsyncStorage.getItem('currentEntryId');
  },
}; 