import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, Platform, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Use a darker background for better contrast
  const modalBg = isDark ? '#1a1a1a' : colors.background;
  const surfaceBg = isDark ? '#2a2a2a' : colors.surface;
  const textColor = isDark ? '#ffffff' : colors.text;
  const mutedColor = isDark ? '#a0a0a0' : colors.muted;
  
  // Debug logging
  React.useEffect(() => {
    if (meal && visible) {
      console.log('[RecipeModal] Meal data:', {
        name: meal.name,
        hasIngredients: !!meal.ingredients,
        ingredientsLength: meal.ingredients?.length || 0,
        hasInstructions: !!meal.instructions,
        instructionsLength: meal.instructions?.length || 0,
        platform: Platform.OS,
        colorScheme: colorScheme
      });
    }
  }, [meal, visible, colorScheme]);
  
  if (!meal) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
        <View style={{ 
          backgroundColor: modalBg, 
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
            padding: 20,
            borderBottomWidth: 1, 
            borderBottomColor: isDark ? '#333' : colors.border 
          }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {meal.tags && meal.tags.length > 0 && (
                  <Text style={{ fontSize: 20 }}>{getIconsForTags(meal.tags).join(" ")}</Text>
                )}
                <Text style={{ fontSize: 22, fontWeight: 'bold', flex: 1, color: textColor }}>{meal.name}</Text>
              </View>
              <Text style={{ fontSize: 14, marginTop: 4, color: mutedColor, lineHeight: 20 }}>{meal.description}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 4
              })}
            >
              <Text style={{ fontSize: 32, color: mutedColor }}>×</Text>
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={{ flex: 1, backgroundColor: modalBg }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Meal Info */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <View style={{ 
                paddingHorizontal: 14, 
                paddingVertical: 8, 
                borderRadius: 20, 
                backgroundColor: surfaceBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}>
                <Text style={{ fontSize: 16 }}>⏱️</Text>
                <Text style={{ fontWeight: '600', color: colors.primary, fontSize: 14 }}>Prep: {meal.prepTime}</Text>
              </View>
              <View style={{ 
                paddingHorizontal: 14, 
                paddingVertical: 8, 
                borderRadius: 20, 
                backgroundColor: surfaceBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}>
                <Text style={{ fontSize: 16 }}>🍳</Text>
                <Text style={{ fontWeight: '600', color: colors.success, fontSize: 14 }}>Cook: {meal.cookTime}</Text>
              </View>
              <View style={{ 
                paddingHorizontal: 14, 
                paddingVertical: 8, 
                borderRadius: 20, 
                backgroundColor: surfaceBg 
              }}>
                <Text style={{ fontWeight: '600', color: mutedColor, fontSize: 14 }}>{meal.difficulty}</Text>
              </View>
            </View>

            {/* Ingredients */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 20 }}>🛒</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor }}>Ingredients</Text>
              </View>
              <View style={{ borderRadius: 16, padding: 16, backgroundColor: surfaceBg }}>
                {meal.ingredients && meal.ingredients.length > 0 ? (
                  meal.ingredients.map((ingredient, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                      <Text style={{ marginRight: 10, color: colors.primary, fontSize: 16 }}>•</Text>
                      <Text style={{ flex: 1, color: textColor, fontSize: 15, lineHeight: 22 }}>{ingredient}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontStyle: 'italic', color: mutedColor }}>No ingredients listed</Text>
                )}
              </View>
            </View>

            {/* Instructions */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 20 }}>👨‍🍳</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor }}>Instructions</Text>
              </View>
              <View style={{ gap: 16 }}>
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
                        <Text style={{ fontWeight: 'bold', color: '#ffffff', fontSize: 15 }}>{index + 1}</Text>
                      </View>
                      <Text style={{ flex: 1, paddingTop: 6, color: textColor, fontSize: 15, lineHeight: 22 }}>{instruction}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontStyle: 'italic', color: mutedColor }}>No instructions available</Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={{ 
            padding: 20, 
            borderTopWidth: 1, 
            borderTopColor: isDark ? '#333' : colors.border,
            backgroundColor: modalBg
          }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
                borderRadius: 24,
                paddingVertical: 16,
              })}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 17 }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
