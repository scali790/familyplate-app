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
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '92%',
          height: '92%',
          flex: 1
        }}>
          {/* Compact Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1, 
            borderBottomColor: isDark ? '#333' : colors.border 
          }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                {meal.tags && meal.tags.length > 0 && (
                  <Text style={{ fontSize: 18 }}>{getIconsForTags(meal.tags).join(" ")}</Text>
                )}
                <Text style={{ fontSize: 18, fontWeight: 'bold', flex: 1, color: textColor, lineHeight: 24 }}>{meal.name}</Text>
              </View>
              <Text style={{ fontSize: 13, marginTop: 2, color: mutedColor, lineHeight: 18 }} numberOfLines={2}>{meal.description}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 8,
                marginTop: -4,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: 20,
                width: 36,
                height: 36,
                justifyContent: 'center',
                alignItems: 'center'
              })}
            >
              <Text style={{ fontSize: 32, fontWeight: '600', color: textColor, lineHeight: 32 }}>×</Text>
            </Pressable>
          </View>

          {/* Scrollable Content - Takes up most of the screen */}
          <ScrollView 
            style={{ flex: 1, backgroundColor: modalBg }}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Meal Info */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <View style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 16, 
                backgroundColor: surfaceBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}>
                <Text style={{ fontSize: 14 }}>⏱️</Text>
                <Text style={{ fontWeight: '600', color: colors.primary, fontSize: 13 }}>Prep: {meal.prepTime}</Text>
              </View>
              <View style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 16, 
                backgroundColor: surfaceBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}>
                <Text style={{ fontSize: 14 }}>🍳</Text>
                <Text style={{ fontWeight: '600', color: colors.success, fontSize: 13 }}>Cook: {meal.cookTime}</Text>
              </View>
              <View style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 16, 
                backgroundColor: surfaceBg 
              }}>
                <Text style={{ fontWeight: '600', color: mutedColor, fontSize: 13 }}>{meal.difficulty}</Text>
              </View>
            </View>

            {/* Ingredients */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Text style={{ fontSize: 18 }}>🛒</Text>
                <Text style={{ fontSize: 17, fontWeight: 'bold', color: textColor }}>Ingredients</Text>
              </View>
              <View style={{ borderRadius: 12, padding: 14, backgroundColor: surfaceBg }}>
                {meal.ingredients && meal.ingredients.length > 0 ? (
                  meal.ingredients.map((ingredient, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Text style={{ marginRight: 8, color: colors.primary, fontSize: 14 }}>•</Text>
                      <Text style={{ flex: 1, color: textColor, fontSize: 14, lineHeight: 20 }}>{ingredient}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontStyle: 'italic', color: mutedColor, fontSize: 14 }}>No ingredients listed</Text>
                )}
              </View>
            </View>

            {/* Instructions */}
            <View style={{ marginBottom: 16, position: 'relative' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Text style={{ fontSize: 18 }}>👨‍🍳</Text>
                <Text style={{ fontSize: 17, fontWeight: 'bold', color: textColor }}>Instructions</Text>
              </View>
              <View style={{ gap: 18, position: 'relative' }}>
                {meal.instructions && meal.instructions.length > 0 ? (
                  meal.instructions.map((instruction, index) => {
                    // Extract first word (action verb) for bolding
                    const words = instruction.split(' ');
                    const firstWord = words[0];
                    const restOfText = words.slice(1).join(' ');
                    
                    return (
                      <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 14, 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          marginRight: 10,
                          backgroundColor: colors.primary 
                        }}>
                          <Text style={{ fontWeight: 'bold', color: '#ffffff', fontSize: 14 }}>{index + 1}</Text>
                        </View>
                        <Text style={{ flex: 1, paddingTop: 4, color: textColor, fontSize: 14, lineHeight: 22 }}>
                          <Text style={{ fontWeight: '700' }}>{firstWord}</Text>
                          {restOfText ? ' ' + restOfText : ''}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ fontStyle: 'italic', color: mutedColor, fontSize: 14 }}>No instructions available</Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Scroll hint shadow - fixed at bottom of content area */}
          {meal.instructions && meal.instructions.length > 3 && (
            <View style={{
              position: 'absolute',
              bottom: 73,
              left: 0,
              right: 0,
              height: 50,
              pointerEvents: 'none'
            }}>
              {/* Gradient effect using multiple layers */}
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(26, 26, 26, 0)' : 'rgba(255, 255, 255, 0)' }} />
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(26, 26, 26, 0.3)' : 'rgba(255, 255, 255, 0.3)' }} />
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(26, 26, 26, 0.6)' : 'rgba(255, 255, 255, 0.6)' }} />
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(26, 26, 26, 0.85)' : 'rgba(255, 255, 255, 0.85)' }} />
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)' }} />
            </View>
          )}

          {/* Close Button - Compact */}
          <View style={{ 
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1, 
            borderTopColor: isDark ? '#333' : colors.border,
            backgroundColor: modalBg
          }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
                borderRadius: 20,
                paddingVertical: 14,
              })}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
