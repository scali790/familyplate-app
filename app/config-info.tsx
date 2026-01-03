import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function ConfigInfoScreen() {
  const router = useRouter();
  const colors = useColors();

  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const ConfigItem = ({ label, value, isValid }: { label: string; value?: string; isValid: boolean }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isValid ? colors.success : colors.error,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-foreground">{label}</Text>
        <Text className="text-lg">{isValid ? "✅" : "❌"}</Text>
      </View>
      <Text className="text-sm text-muted">
        {isValid ? `Configured (${value?.substring(0, 20)}...)` : "Not configured"}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={handleBack} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Configuration Status</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="gap-6">
          {/* Info */}
          <View
            style={{
              backgroundColor: colors.background,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="text-base text-foreground">
              This screen shows the status of your app configuration. All items must be configured for the app to work properly.
            </Text>
          </View>

          {/* Firebase Configuration */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Firebase Configuration</Text>
            
            <ConfigItem
              label="API Key"
              value={firebaseConfig.apiKey}
              isValid={!!firebaseConfig.apiKey}
            />
            
            <ConfigItem
              label="Auth Domain"
              value={firebaseConfig.authDomain}
              isValid={!!firebaseConfig.authDomain}
            />
            
            <ConfigItem
              label="Project ID"
              value={firebaseConfig.projectId}
              isValid={!!firebaseConfig.projectId}
            />
            
            <ConfigItem
              label="Storage Bucket"
              value={firebaseConfig.storageBucket}
              isValid={!!firebaseConfig.storageBucket}
            />
            
            <ConfigItem
              label="Messaging Sender ID"
              value={firebaseConfig.messagingSenderId}
              isValid={!!firebaseConfig.messagingSenderId}
            />
            
            <ConfigItem
              label="App ID"
              value={firebaseConfig.appId}
              isValid={!!firebaseConfig.appId}
            />
          </View>

          {/* OpenAI Configuration */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">OpenAI Configuration</Text>
            
            <ConfigItem
              label="API Key"
              value={openaiKey}
              isValid={!!openaiKey}
            />
          </View>

          {/* Instructions */}
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="text-base font-semibold text-foreground mb-2">
              How to Fix Missing Configuration
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              1. Go to Settings → Secrets in the Management UI{"\n"}
              2. Add the missing environment variables{"\n"}
              3. Restart the app{"\n"}
              4. Check this screen again to verify
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
