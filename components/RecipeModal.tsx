import React from 'react';
import { Modal, View, Text, ScrollView, Pressable } from 'react-native';
import { Meal } from '../drizzle/schema';

interface RecipeModalProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
}

export function RecipeModal({ visible, meal, onClose }: RecipeModalProps) {
  if (!meal) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <View className="flex-1 pr-4">
              <Text className="text-2xl font-bold text-gray-900">{meal.name}</Text>
              <Text className="text-sm text-gray-600 mt-1">{meal.description}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.6 : 1,
                }
              ]}
            >
              <Text className="text-3xl text-gray-500">×</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView className="flex-1">
            <View className="p-6">
              {/* Meal Info */}
              <View className="flex-row gap-4 mb-6">
                <View className="bg-orange-100 px-4 py-2 rounded-full">
                  <Text className="text-orange-600 font-semibold">⏱️ Prep: {meal.prepTime}</Text>
                </View>
                <View className="bg-green-100 px-4 py-2 rounded-full">
                  <Text className="text-green-600 font-semibold">🍳 Cook: {meal.cookTime}</Text>
                </View>
                <View className="bg-blue-100 px-4 py-2 rounded-full">
                  <Text className="text-blue-600 font-semibold">{meal.difficulty}</Text>
                </View>
              </View>

              {/* Ingredients */}
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-3">🛒 Ingredients</Text>
                <View className="bg-gray-50 rounded-2xl p-4">
                  {meal.ingredients && meal.ingredients.length > 0 ? (
                    meal.ingredients.map((ingredient, index) => (
                      <View key={index} className="flex-row items-start mb-2">
                        <Text className="text-orange-500 mr-2">•</Text>
                        <Text className="text-gray-700 flex-1">{ingredient}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-500 italic">No ingredients listed</Text>
                  )}
                </View>
              </View>

              {/* Instructions */}
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-3">👨‍🍳 Instructions</Text>
                <View className="gap-3">
                  {meal.instructions && meal.instructions.length > 0 ? (
                    meal.instructions.map((instruction, index) => (
                      <View key={index} className="flex-row items-start">
                        <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center mr-3">
                          <Text className="text-white font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-gray-700 flex-1 pt-1">{instruction}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-500 italic">No instructions available</Text>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Close Button */}
          <View className="p-6 border-t border-gray-200">
            <Pressable
              onPress={onClose}
              className="bg-orange-500 rounded-full py-4"
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
            >
              <Text className="text-white text-center font-bold text-lg">Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
