import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "AniStream",
  slug: "anistream",
  scheme: "anistream",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: { supportsTablet: true, bundleIdentifier: "com.yourcompany.anistream" },
  android: {
    package: "com.yourcompany.anistream",
    adaptiveIcon: { backgroundColor: "#0B0B12" },
  },
  plugins: ["expo-router"],
  extra: {
    // Populate via `.env` + a tool like `dotenv-expo`, EAS secrets, or just
    // export these in your shell before running `expo start`.
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://anistream-backend.onrender.com",
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
    eas: { projectId: "your-eas-project-id" },
  },
});
