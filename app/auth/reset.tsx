import { View, Text, TextInput, Pressable, ActivityIndicator, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  
  const magicLinkMutation = trpc.auth.requestMagicLink.useMutation();

  const handleSendLink = async () => {
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    try {
      await magicLinkMutation.mutateAsync({
        email: email.trim(),
        name: undefined,
      });
      setLinkSent(true);
    } catch (error) {
      console.error("[ResetPassword] Failed to send magic link:", error);
      alert("Failed to send magic link. Please try again.");
    }
  };

  const isLoading = magicLinkMutation.isPending;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center gap-8 max-w-md self-center w-full">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground text-center">
              {linkSent ? "Check Your Email" : "Account Recovery"}
            </Text>
            <Text className="text-lg text-muted text-center">
              {linkSent 
                ? "We've sent you a secure login link"
                : "Get instant access to your account"}
            </Text>
          </View>

          {!linkSent ? (
            <>
              {/* Explanation */}
              <View className="bg-surface border border-border rounded-xl p-6 gap-4">
                <View className="gap-2">
                  <Text className="text-lg font-semibold text-foreground">🔐 Passwordless Authentication</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    EasyPlate uses magic links instead of passwords. This means you never have to remember or reset a password!
                  </Text>
                </View>

                <View className="gap-2">
                  <Text className="text-base font-semibold text-foreground">How it works:</Text>
                  <View className="gap-2">
                    <View className="flex-row gap-2">
                      <Text className="text-muted">1.</Text>
                      <Text className="text-sm text-muted flex-1">Enter your email address below</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Text className="text-muted">2.</Text>
                      <Text className="text-sm text-muted flex-1">We'll send you a secure login link</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Text className="text-muted">3.</Text>
                      <Text className="text-sm text-muted flex-1">Click the link to instantly access your account</Text>
                    </View>
                  </View>
                </View>

                <View className="bg-background rounded-lg p-3 border-l-4 border-primary">
                  <Text className="text-xs text-muted">
                    💡 <Text className="font-semibold">Tip:</Text> This works for both new logins and account recovery. No password needed!
                  </Text>
                </View>
              </View>

              {/* Email Input */}
              <View className="w-full gap-4">
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Enter your email"
                  placeholderTextColor="#9BA1A6"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />

                {Platform.OS === 'web' ? (
                  <button
                    onClick={handleSendLink}
                    disabled={isLoading}
                    style={{
                      backgroundColor: '#0a7ea4',
                      width: '100%',
                      padding: '16px',
                      borderRadius: '9999px',
                      opacity: isLoading ? 0.6 : 1,
                      border: 'none',
                      cursor: 'pointer',
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '18px',
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Login Link'}
                  </button>
                ) : (
                  <Pressable
                    onPress={handleSendLink}
                    disabled={isLoading}
                    style={({ pressed }) => ({
                      backgroundColor: '#0a7ea4',
                      width: '100%',
                      paddingVertical: 16,
                      borderRadius: 9999,
                      opacity: isLoading ? 0.6 : pressed ? 0.8 : 1,
                    })}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
                        Send Login Link
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            </>
          ) : (
            <>
              {/* Success Message */}
              <View className="bg-surface border border-border rounded-xl p-6 gap-4 w-full">
                <Text className="text-6xl text-center">✉️</Text>
                <Text className="text-foreground text-center font-semibold text-lg">
                  Magic Link Sent!
                </Text>
                <Text className="text-muted text-center text-sm leading-relaxed">
                  We've sent a secure login link to <Text className="font-semibold text-foreground">{email}</Text>. 
                  Click the link in your email to access your account.
                </Text>
                <View className="bg-background rounded-lg p-3">
                  <Text className="text-xs text-muted text-center">
                    ⏱️ Link expires in 15 minutes
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View className="gap-3 w-full">
                <Pressable onPress={() => setLinkSent(false)}>
                  <Text className="text-primary text-center font-semibold">
                    Didn't receive it? Send again
                  </Text>
                </Pressable>
                
                <Pressable onPress={() => router.back()}>
                  <Text className="text-muted text-center text-sm">
                    ← Back to login
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Back Link */}
          {!linkSent && (
            <Pressable onPress={() => router.back()}>
              <Text className="text-muted text-center text-sm">
                ← Back to login
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
