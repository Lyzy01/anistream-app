import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/AuthContext";
import { saveWatchProgress, getWatchProgress } from "../../firebase";

/**
 * IMPORTANT: This screen expects a direct, already-resolved HLS (.m3u8) or
 * MP4 URL to be passed in as the `source` query param — e.g. navigating with
 * `/player/${animeId}?episode=3&source=${encodeURIComponent(streamUrl)}`.
 *
 * This template intentionally does NOT include a scraper/proxy that pulls
 * unlicensed stream URLs from third-party anime sites — wire `source` up to
 * your own licensed content, a partner API you have rights to use, or your
 * own uploaded video files (e.g. via Firebase Storage / a CDN you control).
 *
 * The fallback below is Apple's public HLS test stream, purely so this
 * screen renders and plays something out of the box during development.
 */
const DEV_FALLBACK_STREAM =
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8";

export default function PlayerScreen() {
  const { id, episode, source } = useLocalSearchParams<{
    id: string;
    episode?: string;
    source?: string;
  }>();
  const { user } = useAuth();

  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumePositionMs, setResumePositionMs] = useState(0);

  const streamUrl = source ? decodeURIComponent(source) : DEV_FALLBACK_STREAM;

  // Load any saved progress for this episode so playback can resume.
  useEffect(() => {
    if (!user || !id) return;
    getWatchProgress(user.uid, String(id)).then((progress) => {
      if (progress && String(progress.episodeNumber) === String(episode ?? "1")) {
        setResumePositionMs((progress.positionSeconds ?? 0) * 1000);
      }
    });
  }, [user, id, episode]);

  // Periodically persist progress to Firestore (every ~15s of playback).
  useEffect(() => {
    if (!user || !id || !status?.isLoaded || !status.isPlaying) return;

    const interval = setInterval(() => {
      if (!status.isLoaded) return;
      saveWatchProgress(user.uid, String(id), {
        episodeNumber: Number(episode ?? 1),
        positionSeconds: Math.floor((status.positionMillis ?? 0) / 1000),
        durationSeconds: status.durationMillis
          ? Math.floor(status.durationMillis / 1000)
          : undefined,
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [user, id, episode, status]);

  return (
    <View style={styles.screen}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay
        positionMillis={resumePositionMs}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onPlaybackStatusUpdate={setStatus}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#7C5CFC" size="large" />
        </View>
      )}

      <Pressable style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={26} color="#fff" />
      </Pressable>

      <View style={styles.episodeBadge}>
        <Text style={styles.episodeBadgeText}>Episode {episode ?? "1"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  video: { width: "100%", height: "100%" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
  },
  episodeBadge: {
    position: "absolute",
    top: 54,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  episodeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
