import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AnimeCard from "../../components/AnimeCard";
import { searchAnime, type AnimeSummary } from "../../lib/api";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  let debounceTimer: ReturnType<typeof setTimeout>;

  const onChangeText = (text: string) => {
    setQuery(text);
    clearTimeout(debounceTimer);

    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceTimer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchAnime(text.trim());
        setResults(res.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={onChangeText}
          placeholder="Search anime titles…"
          placeholderTextColor="#8A8A99"
          style={styles.input}
          autoCorrect={false}
        />
      </View>

      {loading && <ActivityIndicator color="#7C5CFC" style={{ marginTop: 20 }} />}

      {!loading && searched && results.length === 0 && (
        <Text style={styles.empty}>No results for "{query}"</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(a) => String(a.mal_id)}
        numColumns={3}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => <AnimeCard anime={item} width={100} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0B12" },
  searchBar: { padding: 16 },
  input: {
    backgroundColor: "#1E1E2A",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  empty: { color: "#8A8A99", textAlign: "center", marginTop: 24 },
});
