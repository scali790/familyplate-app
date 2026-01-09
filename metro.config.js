const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/**
 * NativeWind Configuration
 * 
 * IMPORTANT: We use NativeWind v4.1.x instead of v4.2.x due to a compatibility issue
 * with Expo SDK 54 that causes Metro bundler to crash with:
 * "TypeError: Cannot read properties of undefined (reading 'cacheStores')"
 * 
 * This is a known issue in NativeWind v4.2.1 + Expo SDK 54.
 * Once Expo SDK 55 is stable, we can upgrade to NativeWind v4.2.x
 * 
 * Date: January 9, 2026
 */
module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
