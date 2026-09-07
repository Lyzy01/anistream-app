import React, { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../lib/AuthContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAuth = async (mode: "signIn" | "signUp") => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter an email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signIn") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      Alert.alert("Authentication error", e.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.uid}>UID: {user.uid}</Text>
          <Pressable style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.header}>Sign in to AniStream</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8A8A99"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8A8A99"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.primaryBtn} disabled={busy} onPress={() => handleAuth("signIn")}>
        <Text style={styles.primaryText}>{busy ? "Please wait…" : "Sign In"}</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => handleAuth("signUp")}>
        <Text style={styles.secondaryText}>Create Account</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0B12", padding: 20, justifyContent: "center" },
  header: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#1E1E2A",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  primaryBtn: { backgroundColor: "#7C5CFC", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { paddingVertical: 14, alignItems: "center" },
  secondaryText: { color: "#8A8A99", fontWeight: "600" },
  card: { alignItems: "center", gap: 6 },
  email: { color: "#fff", fontSize: 17, fontWeight: "700" },
  uid: { color: "#8A8A99", fontSize: 12 },
  signOutBtn: { marginTop: 16, backgroundColor: "#2A1E1E", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  signOutText: { color: "#FF6B6B", fontWeight: "700" },
});
