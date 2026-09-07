import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  getAnimeDetails,
  getAnimeEpisodes,
  type AnimeDetails,
  type Episode,
} from "../../lib/api";
import { addToWatchlist, removeFromWatchlist } from "../../firebase";
import { useAuth } from "../../lib/AuthContext";

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [anime, setAnime] = useState<AnimeDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getAnimeDetails(id), getAnimeEpisodes(id)])
      .then(([detailsRes, episodesRes]) => {
        if (cancelled) return;
        setAnime(detailsRes.data);
        setEpisodes(episodesRes.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Failed to load anime details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleWatchlist = async () => {
    if (!user || !anime) {
      router.push("/(tabs)/profile");
      return;
    }
    if (inWatchlist) {
      await removeFromWatchlist(user.uid, String(anime.mal_id));
      setInWatchlist(false);
    } else {
      await addToWatchlist(user.uid, {
        animeId: String(anime.mal_id),
        title: anime.title,
        imageUrl: anime.images?.jpg?.image_url,
      });
      setInWatchlist(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7C5CFC" size="large" />
      </View>
    );
  }

  if (error || !anime) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? "Anime not found."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View>
        <Image
          source={{ uri: anime.images?.jpg?.large_image_url }}
          style={styles.banner}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "#0B0B12"]}
          style={styles.gradient}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{anime.title}</Text>

        <View style={styles.metaRow}>
          {typeof anime.score === "number" && <Text style={styles.meta}>★ {anime.score.toFixed(1)}</Text>}
          {anime.episodes && <Text style={styles.meta}>{anime.episodes} eps</Text>}
          {anime.status && <Text style={styles.meta}>{anime.status}</Text>}
        </View>

        <View style={styles.genreRow}>
          {anime.genres?.map((g) => (
            <View key={g.name} style={styles.genrePill}>
              <Text style={styles.genreText}>{g.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.playBtn}
            onPress={() => router.push(`/player/${anime.mal_id}?episode=1`)}
          >
            <Text style={styles.playText}>▶ Play Episode 1</Text>
          </Pressable>
          <Pressable style={styles.watchlistBtn} onPress={toggleWatchlist}>
            <Text style={styles.watchlistText}>{inWatchlist ? "✓ In List" : "+ My List"}</Text>
          </Pressable>
        </View>

        {anime.synopsis && <Text style={styles.synopsis}>{anime.synopsis}</Text>}

        <Text style={styles.sectionTitle}>Episodes</Text>
        {episodes.length === 0 ? (
          <Text style={styles.emptyEpisodes}>Episode list not available yet.</Text>
        ) : (
          episodes.map((ep) => (
            <Pressable
              key={ep.mal_id}
              style={styles.episodeRow}
              onPress={() => router.push(`/player/${anime.mal_id}?episode=${ep.episode}`)}
            >
              <Text style={styles.episodeNumber}>{ep.episode}</Text>
              <Text style={styles.episodeTitle} numberOfLines={1}>
                {ep.title || `Episode ${ep.episode}`}
              </Text>
              <Text style={styles.episodePlay}>▶</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0B12" },
  centered: { flex: 1, backgroundColor: "#0B0B12", alignItems: "center", justifyContent: "center" },
  error: { color: "#FF6B6B", padding: 20, textAlign: "center" },
  banner: { width: "100%", height: 340 },
  gradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  content: { paddingHorizontal: 16, marginTop: -40 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: 14, marginTop: 8 },
  meta: { color: "#B8B8C4", fontSize: 13 },
  genreRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  genrePill: { backgroundColor: "#1E1E2A", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  genreText: { color: "#B8B8C4", fontSize: 12 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  playBtn: { flex: 1, backgroundColor: "#7C5CFC", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  playText: { color: "#fff", fontWeight: "700" },
  watchlistBtn: { flex: 1, backgroundColor: "#1E1E2A", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  watchlistText: { color: "#fff", fontWeight: "700" },
  synopsis: { color: "#B8B8C4", fontSize: 14, lineHeight: 21, marginTop: 20 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 10 },
  emptyEpisodes: { color: "#8A8A99", fontSize: 13 },
  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1E1E2A",
  },
  episodeNumber: { color: "#7C5CFC", fontWeight: "700", width: 30 },
  episodeTitle: { color: "#fff", flex: 1, fontSize: 14 },
  episodePlay: { color: "#8A8A99" },
});
