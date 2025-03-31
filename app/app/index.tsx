import { Stack, Link, router } from 'expo-router';
import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import { YStack, XStack, Text, Separator } from 'tamagui';
import { useMemo } from 'react';

type FoodItem = {
  id: string;
  name: string;
  calories: number;
};

export default function Home() {
  const foodItems = useMemo<FoodItem[]>(() => [
    { id: '1', name: 'Chicken Breast', calories: 165 },
    { id: '2', name: 'Brown Rice', calories: 215 },
    { id: '3', name: 'Greek Yogurt', calories: 130 },
    { id: '4', name: 'Banana', calories: 105 },
    { id: '5', name: 'Almonds', calories: 635 },
  ], []);

  const totalCalories = useMemo(() => 
    foodItems.reduce((sum, item) => sum + item.calories, 0)
  , [foodItems]);

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <YStack flex={1} justifyContent="space-between" pb="$4">
          <YStack>
            <Text fontSize="$8" fontWeight="bold" pb="$4">Total: {totalCalories} kcal</Text>
            <YStack>
              {foodItems.map((item, index) => (
                <YStack key={item.id}>
                  <XStack justifyContent="space-between" p="$2">
                    <Text>{item.name}</Text>
                    <Text>{item.calories} kcal</Text>
                  </XStack>
                  {index < foodItems.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </YStack>
          <Button
            size="$6"
            circular
            backgroundColor="$blue10"
            title="+"
            alignSelf="center"
            onPress={() => router.push('/camera')}
          />
        </YStack>
      </Container>
    </>
  );
}
