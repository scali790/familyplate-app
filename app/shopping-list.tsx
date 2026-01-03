import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

interface ShoppingItem {
  name: string;
  quantity: string;
  localNote?: string;
  estimatedPrice?: string;
}

interface ShoppingCategory {
  name: string;
  items: ShoppingItem[];
}

interface StoreLink {
  storeName: string;
  url: string;
}

interface ShoppingList {
  categories: ShoppingCategory[];
  storeLinks: StoreLink[];
}

export default function ShoppingListScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const mealPlanId = parseInt(params.mealPlanId as string);
  
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [country, setCountry] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  const generateMutation = trpc.mealPlanning.generateShoppingList.useMutation();

  useEffect(() => {
    generateList();
  }, []);

  const generateList = async () => {
    setIsLoading(true);
    try {
      const result = await generateMutation.mutateAsync({ mealPlanId });
      setShoppingList(result.shoppingList);
      setCountry(result.country);
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openStoreLink = (url: string) => {
    Linking.openURL(url);
  };

  const searchOnNoon = (itemName: string) => {
    // Use full Noon search URL with referral parameters
    const searchQuery = encodeURIComponent(itemName);
    const noonUrl = `https://www.noon.com/uae-en/search/?q=${searchQuery}&utm_source=C1000264L&utm_medium=AFF0cbe07af24de&utm_campaign=CMP2ce0b63a6a1anoon`;
    Linking.openURL(noonUrl);
  };

  const copyListToClipboard = async () => {
    let listText = `Shopping List for ${country}\n\n`;
    shoppingList?.categories.forEach(category => {
      listText += `${category.name}:\n`;
      category.items.forEach(item => {
        listText += `• ${item.name} - ${item.quantity}\n`;
      });
      listText += '\n';
    });
    
    // For web, use navigator.clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(listText);
        alert('Shopping list copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-lg text-muted">Generating your shopping list...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!shoppingList) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Text className="text-xl font-bold text-foreground">Failed to generate shopping list</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: colors.surface,
              alignSelf: 'flex-start',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">Shopping List</Text>
              <Text className="text-muted mt-1">Localized for {country}</Text>
            </View>
            <TouchableOpacity
              onPress={copyListToClipboard}
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text className="text-primary font-semibold">📋 Copy</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Categories */}
        <View className="p-6 pt-2">
          {shoppingList.categories.map((category, catIndex) => (
            <View key={catIndex} className="mb-6">
              <Text className="text-xl font-bold text-foreground mb-3">{category.name}</Text>
              <View className="gap-3">
                {category.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <View className="gap-3">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
                          <Text className="text-primary font-medium mt-1">{item.quantity}</Text>
                          {item.localNote && (
                            <Text className="text-sm text-muted mt-1">{item.localNote}</Text>
                          )}
                        </View>
                        {item.estimatedPrice && (
                          <View className="ml-4">
                            <Text className="text-success font-semibold">{item.estimatedPrice}</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => searchOnNoon(item.name)}
                        style={{
                          backgroundColor: '#FFD700',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>🛒</Text>
                        <Text style={{ color: '#000', fontWeight: '600', fontSize: 14 }}>Find on Noon</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
