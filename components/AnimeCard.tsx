import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { AnimeSummary } from "../lib/api";

type Props = {
  anime: AnimeSummary;
  width?: number;
};

export default function AnimeCard({ anime, width = 130 }: Props) {
  return (
    <Pressable
      style={[styles.container, { width }]}
      onPress={() => router.push(`/anime/${anime.mal_id}`)}
    >
      <Image
        source={{ uri: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url }}
        style={[styles.poster, { width, height: width * 1.45 }]}
        resizeMode="cover"
      />
      <Text numberOfLines={2} style={styles.title}>
        {anime.title}
      </Text>
      {typeof anime.score === "number" && (
        <Text style={styles.score}>★ {anime.score.toFixed(1)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { marginRight: 12 },
  poster: { borderRadius: 12, backgroundColor: "#1E1E2A" },
  title: { color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 6 },
  score: { color: "#8A8A99", fontSize: 12, marginTop: 2 },
});
