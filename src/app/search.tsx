// [MILESTONE 3 / Sub-CPMK 9] Search & Filter screen powered by RxJS Pipeline:
// Stream: criteriaSubject
//   -> debounceTime(300)
//   -> distinctUntilChanged(areCriteriaEqual)
//   -> switchMap(asyncSearchAndFilter)

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ListingCard } from '../components/ListingCard';
import { NetworkStatusBar } from '../components/NetworkStatusBar';
import {
  createSearchPipeline,
  DEFAULT_SEARCH_CRITERIA,
  type ReactiveSearchPipeline,
} from '../services/searchPipeline';
import { useAppStore } from '../store/useAppStore';
import type { FoodListing, SearchFilterCriteria } from '../types';

const CATEGORIES = ['All', 'Cooked meals', 'Bakery', 'Buffet', 'Produce'];
const STATUS_OPTIONS: { label: string; value: SearchFilterCriteria['status'] }[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Claimed', value: 'claimed' },
];
const SORT_OPTIONS: { label: string; value: SearchFilterCriteria['sortBy'] }[] = [
  { label: 'Nearest', value: 'distance' },
  { label: 'Most Servings', value: 'servings' },
  { label: 'Expiring Soonest', value: 'expiry' },
];

export default function SearchScreen() {
  const [criteria, setCriteria] = useState<SearchFilterCriteria>(DEFAULT_SEARCH_CRITERIA);
  const [results, setResults] = useState<FoodListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pipelineRef = useRef<ReactiveSearchPipeline | null>(null);

  // Initialize RxJS pipeline once; subscribe once; cleanup subscriptions on unmount
  useEffect(() => {
    const pipeline = createSearchPipeline(() => useAppStore.getState().listings);
    pipelineRef.current = pipeline;

    const subResults = pipeline.results$.subscribe((items) => {
      setResults(items);
    });

    const subSearching = pipeline.isSearching$.subscribe((searching) => {
      setIsSearching(searching);
    });

    // Initial push with default criteria
    pipeline.updateCriteria(DEFAULT_SEARCH_CRITERIA);

    return () => {
      subResults.unsubscribe();
      subSearching.unsubscribe();
    };
  }, []);

  const handleQueryChange = (text: string) => {
    setCriteria((prev) => ({ ...prev, query: text }));
    pipelineRef.current?.push(text);
  };

  const handleCategorySelect = (category: string) => {
    setCriteria((prev) => {
      const updated = { ...prev, category };
      pipelineRef.current?.updateCriteria({ category });
      return updated;
    });
  };

  const handleStatusSelect = (status: SearchFilterCriteria['status']) => {
    setCriteria((prev) => {
      const updated = { ...prev, status };
      pipelineRef.current?.updateCriteria({ status });
      return updated;
    });
  };

  const handleSortSelect = (sortBy: SearchFilterCriteria['sortBy']) => {
    setCriteria((prev) => {
      const updated = { ...prev, sortBy };
      pipelineRef.current?.updateCriteria({ sortBy });
      return updated;
    });
  };

  const handleClear = () => {
    const cleared = { ...DEFAULT_SEARCH_CRITERIA, query: '' };
    setCriteria(cleared);
    pipelineRef.current?.updateCriteria(cleared);
  };

  return (
    <View style={styles.container}>
      <NetworkStatusBar />

      {/* RxJS Pipeline Education & Telemetry Banner */}
      <View style={styles.pipelineBanner}>
        <View style={styles.pipelineHeader}>
          <Text style={styles.pipelineTitle}>RxJS Reactive Pipeline</Text>
          {isSearching ? (
            <View style={styles.searchingBadge}>
              <ActivityIndicator size="small" color="#1B5E20" />
              <Text style={styles.searchingText}>switchMap processing…</Text>
            </View>
          ) : (
            <Text style={styles.pipelineStatus}>Idle · Ready</Text>
          )}
        </View>
        <Text style={styles.pipelineFormula}>
          debounceTime(300ms) ➔ distinctUntilChanged() ➔ switchMap()
        </Text>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search food title, donor, address…"
          value={criteria.query}
          onChangeText={handleQueryChange}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {criteria.query.length > 0 && (
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterSection}>
        {/* Category Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = criteria.category === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleCategorySelect(cat)}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Status & Sort Options */}
        <View style={styles.secondaryFilters}>
          {/* Status buttons */}
          <View style={styles.buttonGroup}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.smallChip,
                  criteria.status === opt.value && styles.smallChipActive,
                ]}
                onPress={() => handleStatusSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.smallChipText,
                    criteria.status === opt.value && styles.smallChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sort selector */}
          <View style={styles.buttonGroup}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.sortChip,
                  criteria.sortBy === opt.value && styles.sortChipActive,
                ]}
                onPress={() => handleSortSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    criteria.sortBy === opt.value && styles.sortChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Listing results */}
      <FlatList
        data={results}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No matching surplus food</Text>
            <Text style={styles.emptyDesc}>
              Try tweaking your search keywords or resetting filters.
            </Text>
            <Pressable style={styles.resetButton} onPress={handleClear}>
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  pipelineBanner: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pipelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B5E20',
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchingText: {
    fontSize: 11,
    color: '#1B5E20',
    fontWeight: '700',
  },
  pipelineStatus: {
    fontSize: 11,
    color: '#388E3C',
    fontWeight: '600',
  },
  pipelineFormula: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#2E7D32',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '700',
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  chipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  chipText: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  secondaryFilters: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0F4C3',
  },
  smallChipActive: {
    backgroundColor: '#827717',
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#33691E',
  },
  smallChipTextActive: {
    color: '#fff',
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E1F5FE',
  },
  sortChipActive: {
    backgroundColor: '#0277BD',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#01579B',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#616161',
  },
  list: { paddingBottom: 24 },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1B5E20',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
