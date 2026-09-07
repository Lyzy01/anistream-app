import React, { useEffect, useState } from "react";
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/AuthContext";
import { subscribeToWatchlist, type WatchlistItem } from "../../firebase";

export default function WatchlistScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const unsubscribe = subscribeToWatchlist(user.uid, setItems);
    return unsubscribe;
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>Sign in to build your watchlist</Text>
        <Pressable style={styles.cta} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.ctaText}>Go to Profile</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
        <Text style={styles.emptySub}>Tap the bookmark icon on any anime to add it here.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.header}>My List</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.animeId}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/anime/${item.animeId}`)}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: "#1E1E2A" }]} />
            )}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0B12" },
  centered: { flex: 1, backgroundColor: "#0B0B12", alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  header: { color: "#fff", fontSize: 24, fontWeight: "800", padding: 16, paddingBottom: 0 },
  emptyTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emptySub: { color: "#8A8A99", fontSize: 13, textAlign: "center" },
  cta: { marginTop: 12, backgroundColor: "#7C5CFC", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  ctaText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  thumb: { width: 56, height: 76, borderRadius: 8 },
  title: { color: "#fff", fontSize: 15, flex: 1 },
});
