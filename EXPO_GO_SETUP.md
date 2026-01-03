# Testing EasyPlate with Expo Go

This guide will help you test the EasyPlate app on your mobile device using Expo Go. This method allows you to test the app with all Firebase and OpenAI credentials properly configured.

## Prerequisites

1. **Expo Go App** installed on your mobile device:
   - **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
   - **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Same Network**: Your mobile device and the development server must be on the same Wi-Fi network

## Step-by-Step Instructions

### Step 1: Install Expo Go

1. Open the App Store (iOS) or Google Play Store (Android) on your device
2. Search for "Expo Go"
3. Install the app
4. Open Expo Go after installation

### Step 2: Access the App

You have two options to connect:

#### Option A: Scan QR Code (Easiest)

1. Look at the QR code image (`expo-qr-code.png`) in the project folder
2. Open Expo Go on your device
3. **On iOS**: Tap "Scan QR Code" in the Expo Go app
4. **On Android**: Tap "Scan QR Code" in the Expo Go app
5. Point your camera at the QR code
6. The app will load automatically

#### Option B: Enter URL Manually

1. Open Expo Go on your device
2. Tap "Enter URL manually"
3. Enter this URL:
   ```
   exps://8081-i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer
   ```
4. Tap "Connect"

### Step 3: Wait for App to Load

- The first time may take 1-2 minutes as it downloads the JavaScript bundle
- You'll see a loading screen with the Expo logo
- Once loaded, you'll see the EasyPlate welcome screen

### Step 4: Test the App

Now you can test all features:

1. **Sign Up**: Create a new account with email/password
2. **Onboarding**: Set your family preferences
3. **Generate Meal Plan**: Create your first AI-powered meal plan
4. **Vote**: Try the voting feature on meals
5. **Settings**: Edit your preferences

## Troubleshooting

### "Unable to connect to server"

**Solution**: Make sure both your phone and computer are on the same Wi-Fi network

### "Network request failed"

**Solution**: 
1. Check that the development server is running
2. Try restarting the Expo Go app
3. Try entering the URL manually instead of scanning

### "Something went wrong" or blank screen

**Solution**:
1. Shake your device to open the developer menu
2. Tap "Reload"
3. If still not working, close and reopen Expo Go

### Firebase errors

**Solution**: The Firebase credentials are properly configured in the development environment. If you see Firebase errors:
1. Check the configuration status screen in the app
2. Verify that all Firebase services are enabled in your Firebase Console
3. Make sure Firestore is in test mode for development

### OpenAI errors

**Solution**: 
1. Verify your OpenAI API key is valid
2. Check that you have billing enabled in your OpenAI account
3. Make sure you haven't exceeded your quota

## Development Workflow

While testing with Expo Go:

1. **Live Reload**: Any code changes will automatically reload the app
2. **Developer Menu**: Shake your device to open the menu
3. **Debug**: Use the developer menu to enable debugging
4. **Logs**: Check the terminal where the dev server is running for logs

## Advantages of Expo Go

✅ **No Build Required**: Test immediately without building an APK/IPA
✅ **Live Reload**: See changes instantly
✅ **Environment Variables**: All secrets work properly
✅ **Fast Iteration**: Quick development cycle
✅ **Easy Sharing**: Share the QR code with testers

## Limitations

⚠️ **Network Required**: Must be on same network as dev server
⚠️ **Not for Production**: This is for development/testing only
⚠️ **Performance**: May be slightly slower than native build

## Next Steps

Once you're satisfied with testing:

1. **Build Production APK**: Use EAS Build for a standalone app
2. **Deploy to Stores**: Submit to App Store and Google Play
3. **Set up CI/CD**: Automate builds and deployments

## Need Help?

- **Expo Documentation**: https://docs.expo.dev/get-started/expo-go/
- **Expo Go Troubleshooting**: https://docs.expo.dev/troubleshooting/
- **Firebase Console**: https://console.firebase.google.com
- **OpenAI Platform**: https://platform.openai.com

---

**Happy Testing! 🎉**

The app should now work perfectly with all features enabled, including Firebase authentication, Firestore database, and AI-powered meal plan generation.
