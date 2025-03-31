import { Stack, router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { YStack } from 'tamagui';
import { StyleSheet } from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

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
            title="Take Photo"
            onPress={async () => {
              if (cameraRef) {
                const photo = await cameraRef.takePictureAsync();
                router.back();
                // Here you can handle the photo data
                console.log(photo);
              }
            }}
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