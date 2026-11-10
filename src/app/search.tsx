// [MILESTONE 3 prep] Search screen powered by the RxJS pipeline:
// debounceTime(300) -> distinctUntilChanged -> switchMap.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ListingCard } from '../components/ListingCard';
import { createSearchPipeline } from '../services/searchPipeline';
import { useAppStore } from '../store/useAppStore';
import type { FoodListing } from '../types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodListing[]>([]);
  const pipelineRef = useRef<ReturnType<typeof createSearchPipeline> | null>(null);

  // Build the pipeline once; subscribe once; unsubscribe on unmount.
  useEffect(() => {
    const pipeline = createSearchPipeline(() => useAppStore.getState().listings);
    pipelineRef.current = pipeline;
    const sub = pipeline.results$.subscribe(setResults);
    pipeline.push(''); // initial full list
    return () => sub.unsubscribe();
  }, []);

  const onChange = (text: string) => {
    setQuery(text);
    pipelineRef.current?.push(text);
  };

  const header = useMemo(
    () => (
      <TextInput
        style={styles.input}
        placeholder="Search by food, donor, or category…"
        value={query}
        onChangeText={onChange}
        autoCorrect={false}
      />
    ),
    [query],
  );

  return (
    <View style={styles.container}>
      {header}
      <FlatList
        data={results}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No listings match “{query}”.</Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  input: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  list: { paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9E9E9E', marginTop: 32 },
});
