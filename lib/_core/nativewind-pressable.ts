// NativeWind + Pressable: className can swallow onPress. Disable className mapping globally.
import { Pressable } from "react-native";
import { remapProps } from "nativewind";

// Temporarily commented out to test if this is causing onPress to not work
// remapProps(Pressable, { className: false });
