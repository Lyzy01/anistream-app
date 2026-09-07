import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AnimeCard from "../../components/AnimeCard";
import { getSeasonalAnime, getTrendingAnime, type AnimeSummary } from "../../lib/api";

type Section = { title: string; data: AnimeSummary[] };

export default function HomeScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [trending, seasonal] = await Promise.all([
        getTrendingAnime(1),
        getSeasonalAnime(),
      ]);

      setSections([
        { title: "Trending Now", data: trending.data ?? [] },
        { title: "This Season", data: seasonal.data ?? [] },
      ]);
    } catch (e: any) {
      // Render free tier can cold-start slowly on first request of the day
      setError(e.message ?? "Couldn't load anime right now. Pull to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#7C5CFC" size="large" />
        <Text style={styles.hint}>Waking up the server (this can take a moment)…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C5CFC" />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.brand}>AniStream</Text>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <FlatList
              data={item.data}
              horizontal
              keyExtractor={(a) => String(a.mal_id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item: anime }) => <AnimeCard anime={anime} />}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0B12" },
  centered: { flex: 1, backgroundColor: "#0B0B12", alignItems: "center", justifyContent: "center", gap: 12 },
  hint: { color: "#8A8A99", fontSize: 13 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  brand: { color: "#fff", fontSize: 28, fontWeight: "800" },
  error: { color: "#FF6B6B", marginTop: 8, fontSize: 13 },
  section: { marginTop: 20 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12, paddingHorizontal: 16 },
});
