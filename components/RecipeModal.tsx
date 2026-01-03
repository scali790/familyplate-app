import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { Meal } from '../drizzle/schema';
import { useColors } from '@/hooks/use-colors';
import { getIconsForTags } from '@/src/utils/iconMapping';

interface RecipeModalProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
}

export function RecipeModal({ visible, meal, onClose }: RecipeModalProps) {
  const colors = useColors();
  
  // Debug logging
  React.useEffect(() => {
    if (meal && visible) {
      console.log('[RecipeModal] Meal data:', {
        name: meal.name,
        hasIngredients: !!meal.ingredients,
        ingredientsLength: meal.ingredients?.length || 0,
        hasInstructions: !!meal.instructions,
        instructionsLength: meal.instructions?.length || 0,
        platform: Platform.OS
      });
    }
  }, [meal, visible]);
  
  if (!meal) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
        <View style={{ 
          backgroundColor: colors.background, 
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
          height: '90%'
        }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: 24,
            borderBottomWidth: 1, 
            borderBottomColor: colors.border 
          }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {meal.tags && meal.tags.length > 0 && (
                  <Text style={{ fontSize: 24 }}>{getIconsForTags(meal.tags).join(" ")}</Text>
                )}
                <Text style={{ fontSize: 24, fontWeight: 'bold', flex: 1, color: colors.text }}>{meal.name}</Text>
              </View>
              <Text style={{ fontSize: 14, marginTop: 4, color: colors.muted }}>{meal.description}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 32, color: colors.muted }}>×</Text>
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Meal Info */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface }}>
                <Text style={{ fontWeight: '600', color: colors.primary }}>⏱️ Prep: {meal.prepTime}</Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface }}>
                <Text style={{ fontWeight: '600', color: colors.success }}>🍳 Cook: {meal.cookTime}</Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface }}>
                <Text style={{ fontWeight: '600', color: colors.muted }}>{meal.difficulty}</Text>
              </View>
            </View>

            {/* Ingredients */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: colors.text }}>🛒 Ingredients</Text>
              <View style={{ borderRadius: 16, padding: 16, backgroundColor: colors.surface }}>
                {meal.ingredients && meal.ingredients.length > 0 ? (
                  meal.ingredients.map((ingredient, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Text style={{ marginRight: 8, color: colors.primary }}>•</Text>
                      <Text style={{ flex: 1, color: colors.text }}>{ingredient}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontStyle: 'italic', color: colors.muted }}>No ingredients listed</Text>
                )}
              </View>
            </View>

            {/* Instructions */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: colors.text }}>👨‍🍳 Instructions</Text>
              <View style={{ gap: 12 }}>
                {meal.instructions && meal.instructions.length > 0 ? (
                  meal.instructions.map((instruction, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 16, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginRight: 12,
                        backgroundColor: colors.primary 
                      }}>
                        <Text style={{ fontWeight: 'bold', color: colors.background }}>{index + 1}</Text>
                      </View>
                      <Text style={{ flex: 1, paddingTop: 4, color: colors.text }}>{instruction}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontStyle: 'italic', color: colors.muted }}>No instructions available</Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
                borderRadius: 24,
                paddingVertical: 16,
              })}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
