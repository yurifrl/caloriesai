import { Stack, Link, router } from 'expo-router';
import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { YStack, XStack, Text, Separator, Sheet } from 'tamagui';
import { useEffect, useMemo, useState } from 'react';
import { api, Entry, Image } from '~/utils/api';
import { RefreshControl, ScrollView } from 'react-native';

const ROUTES = {
  CAMERA: '/camera' as const,
  GALLERY: '/gallery' as const,
};

type RouteType = typeof ROUTES[keyof typeof ROUTES];

export default function Home() {
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadEntries();
  }, []);
  
  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const currentEntryId = await api.getCurrentEntryId();
      
      if (currentEntryId) {
        const entry = await api.getEntry(currentEntryId);
        setEntries([entry]);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const foodItems = useMemo(() => {
    if (!entries.length) return [];
    
    return entries.flatMap(entry => 
      entry.images?.filter(img => img.status === 'completed' && img.analysis)
        .map(img => ({
          id: img.id,
          name: img.analysis?.foodItems?.join(', ') || 'Unknown food',
          calories: img.analysis?.calories || 0,
          entryId: entry.id
        })) || []
    );
  }, [entries]);

  const totalCalories = useMemo(() => 
    foodItems.reduce((sum, item) => sum + item.calories, 0)
  , [foodItems]);

  const handleAddFood = async (route: RouteType) => {
    setIsLoading(true);
    try {
      // Check if there's an existing entry ID
      let entryId = await api.getCurrentEntryId();
      
      // If no entry ID exists, create a new entry
      if (!entryId) {
        const entry = await api.createEntry();
        entryId = entry.id;
        console.log('Created new entry:', entry);
      } else {
        console.log('Using existing entry:', entryId);
      }
      
      setShowOptions(false);
      router.push(route);
    } catch (error) {
      console.error('Failed to create/use entry:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshOnFocus = () => {
    loadEntries();
  };
  
  useEffect(() => {
    refreshOnFocus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <YStack flex={1} justifyContent="space-between" pb="$4">
            <YStack>
              <Text fontSize="$8" fontWeight="bold" pb="$4">Total: {totalCalories} kcal</Text>
              <YStack>
                {foodItems.length > 0 ? (
                  foodItems.map((item, index) => (
                    <YStack key={item.id}>
                      <XStack justifyContent="space-between" p="$2">
                        <Text>{item.name}</Text>
                        <Text>{item.calories} kcal</Text>
                      </XStack>
                      {index < foodItems.length - 1 && <Separator />}
                    </YStack>
                  ))
                ) : (
                  <Text p="$2" textAlign="center">No food entries yet</Text>
                )}
              </YStack>
            </YStack>
          </YStack>
        </ScrollView>
        <Button
          size="$6"
          circular
          backgroundColor="$blue10"
          title="+"
          alignSelf="center"
          position="absolute"
          bottom="$4"
          onPress={() => setShowOptions(true)}
        />
      </Container>
      
      <Sheet
        modal
        open={showOptions}
        onOpenChange={setShowOptions}
        snapPoints={[25]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame>
          <YStack p="$4" space="$4">
            <Button 
              title="Take Photo" 
              disabled={isLoading}
              onPress={() => handleAddFood(ROUTES.CAMERA)}
            />
            <Button 
              title="Choose from Gallery" 
              disabled={isLoading}
              onPress={() => handleAddFood(ROUTES.GALLERY)}
            />
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}
