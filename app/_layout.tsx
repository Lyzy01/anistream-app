import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0B0B12" },
            headerTintColor: "#fff",
            contentStyle: { backgroundColor: "#0B0B12" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="anime/[id]"
            options={{ title: "", headerTransparent: true }}
          />
          <Stack.Screen
            name="player/[id]"
            options={{ title: "", headerShown: false, presentation: "fullScreenModal" }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
