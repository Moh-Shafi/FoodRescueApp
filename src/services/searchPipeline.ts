// [MILESTONE 3 / Sub-CPMK 9] Advanced RxJS Reactive Search & Filter Pipeline
// Graded Deliverable:
// 1. debounceTime: buffers rapid user keystrokes (300ms) to conserve CPU and network
// 2. distinctUntilChanged: suppresses duplicate emissions when search criteria haven't changed
// 3. switchMap: cancels previous in-flight asynchronous filtering tasks whenever a new query arrives

import {
  BehaviorSubject,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

import type { FoodListing, SearchFilterCriteria } from '../types';

export interface PipelineState {
  criteria: SearchFilterCriteria;
  isSearching: boolean;
  results: FoodListing[];
  lastExecutionMs: number;
}

export const DEFAULT_SEARCH_CRITERIA: SearchFilterCriteria = {
  query: '',
  category: 'All',
  status: 'all',
  sortBy: 'distance',
};

/**
 * Custom equality comparator for distinctUntilChanged operator.
 * Prevents re-executing search if the effective criteria are identical.
 */
function areCriteriaEqual(a: SearchFilterCriteria, b: SearchFilterCriteria): boolean {
  return (
    a.query.trim().toLowerCase() === b.query.trim().toLowerCase() &&
    a.category === b.category &&
    a.status === b.status &&
    a.sortBy === b.sortBy
  );
}

/**
 * Asynchronous filtering function that simulates reactive backend/worker query
 * and is wrapped inside RxJS switchMap for automatic cancellation.
 */
function executeFilterAsync(
  listings: FoodListing[],
  criteria: SearchFilterCriteria,
): Promise<FoodListing[]> {
  return new Promise((resolve) => {
    // Small micro-delay simulating asynchronous data source / worker thread
    setTimeout(() => {
      const q = criteria.query.trim().toLowerCase();

      const filtered = listings.filter((l) => {
        // Text search across title, donor name, and category
        const matchesQuery =
          !q ||
          l.title.toLowerCase().includes(q) ||
          l.donorName.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q);

        // Category filter
        const matchesCategory =
          criteria.category === 'All' ||
          l.category.toLowerCase() === criteria.category.toLowerCase();

        // Status filter
        const matchesStatus =
          criteria.status === 'all' || l.status === criteria.status;

        return matchesQuery && matchesCategory && matchesStatus;
      });

      // Sorting
      filtered.sort((a, b) => {
        if (criteria.sortBy === 'distance') {
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        }
        if (criteria.sortBy === 'servings') {
          return b.servings - a.servings;
        }
        if (criteria.sortBy === 'expiry') {
          return (
            new Date(a.availableUntil).getTime() -
            new Date(b.availableUntil).getTime()
          );
        }
        return 0;
      });

      resolve(filtered);
    }, 40);
  });
}

export interface ReactiveSearchPipeline {
  push: (query: string) => void;
  updateCriteria: (partial: Partial<SearchFilterCriteria>) => void;
  results$: Observable<FoodListing[]>;
  isSearching$: Observable<boolean>;
  currentCriteria: SearchFilterCriteria;
}

export function createSearchPipeline(
  source: () => FoodListing[],
): ReactiveSearchPipeline {
  const criteriaSubject = new BehaviorSubject<SearchFilterCriteria>(
    DEFAULT_SEARCH_CRITERIA,
  );
  const isSearchingSubject = new BehaviorSubject<boolean>(false);

  // Core RxJS Pipeline:
  // criteria$ -> debounceTime -> distinctUntilChanged -> switchMap -> catchError
  const results$: Observable<FoodListing[]> = criteriaSubject.pipe(
    // 1. Debounce rapid typing / filter switches by 300ms
    debounceTime(300),

    // 2. Ignore emissions identical to the previous one
    distinctUntilChanged(areCriteriaEqual),

    // Signal start of search execution
    tap(() => isSearchingSubject.next(true)),

    // 3. switchMap: If a new criteria arrives while previous search is computing,
    // switchMap automatically cancels and unsubscribes from the previous promise/observable!
    switchMap((criteria) =>
      from(executeFilterAsync(source(), criteria)).pipe(
        catchError((err) => {
          console.warn('[SearchPipeline] RxJS Stream error handled gracefully:', err);
          return of<FoodListing[]>([]);
        }),
      ),
    ),

    // Signal completion of search execution
    tap(() => isSearchingSubject.next(false)),

    // Map to final listing stream
    map((listings) => listings),
  );

  return {
    push: (query: string) => {
      criteriaSubject.next({
        ...criteriaSubject.value,
        query,
      });
    },

    updateCriteria: (partial: Partial<SearchFilterCriteria>) => {
      criteriaSubject.next({
        ...criteriaSubject.value,
        ...partial,
      });
    },

    results$,
    isSearching$: isSearchingSubject.asObservable(),

    get currentCriteria() {
      return criteriaSubject.value;
    },
  };
}
