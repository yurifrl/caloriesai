import { Stack, router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { YStack } from 'tamagui';
import { StyleSheet } from 'react-native';
import { api } from '~/utils/api';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Container>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Button 
            title="Grant Camera Permission" 
            onPress={requestPermission} 
          />
        </YStack>
      </Container>
    );
  }

  const handleTakePhoto = async () => {
    if (!cameraRef || isUploading) return;
    
    try {
      setIsUploading(true);
      const photo = await cameraRef.takePictureAsync();
      
      if (!photo) {
        console.error('Failed to take photo');
        return;
      }
      
      // Get current entry ID
      const entryId = await api.getCurrentEntryId();
      if (!entryId) {
        console.error('No current entry ID found');
        return;
      }
      
      // Create form data with the image
      const formData = new FormData();
      formData.append('images', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      
      // Upload image to the entry
      const result = await api.uploadImages(entryId, formData);
      console.log('Upload result:', result);
      
      router.back();
    } catch (error) {
      console.error('Error taking/uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Take Photo' }} />
      <CameraView
        style={styles.camera}
        facing="back"
        ref={setCameraRef}
      >
        <YStack flex={1} justifyContent="flex-end" padding="$4">
          <Button
            title={isUploading ? "Processing..." : "Take Photo"}
            disabled={isUploading}
            onPress={handleTakePhoto}
          />
        </YStack>
      </CameraView>
    </>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
}); 