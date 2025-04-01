import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { YStack } from 'tamagui';
import * as ImagePicker from 'expo-image-picker';
import { api } from '~/utils/api';

export default function GalleryScreen() {
  const [permission, requestPermission] = ImagePicker.useMediaLibraryPermissions();
  const [isUploading, setIsUploading] = useState(false);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Container>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Button 
            title="Grant Gallery Permission" 
            onPress={requestPermission} 
          />
        </YStack>
      </Container>
    );
  }

  const pickImage = async () => {
    if (isUploading) return;
    
    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Get current entry ID
        const entryId = await api.getCurrentEntryId();
        if (!entryId) {
          console.error('No current entry ID found');
          return;
        }
        
        const selectedImage = result.assets[0];
        
        // Create form data with the image
        const formData = new FormData();
        formData.append('images', {
          uri: selectedImage.uri,
          type: selectedImage.mimeType || 'image/jpeg',
          name: selectedImage.fileName || 'gallery-image.jpg',
        } as any);
        
        // Upload image to the entry
        const uploadResult = await api.uploadImages(entryId, formData);
        console.log('Upload result:', uploadResult);
        
        router.back();
      }
    } catch (error) {
      console.error('Error picking/uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Choose Photo' }} />
      <Container>
        <YStack flex={1} justifyContent="center" alignItems="center" space="$4">
          <Button 
            title={isUploading ? "Processing..." : "Select from Gallery"}
            disabled={isUploading}
            onPress={pickImage}
          />
        </YStack>
      </Container>
    </>
  );
} 