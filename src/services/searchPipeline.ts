// [MILESTONE 3 prep / Sub-CPMK 9] RxJS search pipeline.
// debounceTime + distinctUntilChanged + switchMap — one of the graded
// deliverables for the reactive data pipeline milestone.

import { Subject, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import type { FoodListing } from '../types';

export interface SearchPipeline {
  push: (query: string) => void;
  results$: ReturnType<typeof buildResults$>;
}

function buildResults$(source: () => FoodListing[], subject: Subject<string>) {
  return subject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((query) =>
      of(
        source().filter((l) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            l.title.toLowerCase().includes(q) ||
            l.donorName.toLowerCase().includes(q) ||
            l.category.toLowerCase().includes(q)
          );
        }),
      ),
    ),
    map((listings) => listings),
  );
}

export function createSearchPipeline(source: () => FoodListing[]): SearchPipeline {
  const subject = new Subject<string>();
  return {
    push: (query) => subject.next(query),
    results$: buildResults$(source, subject),
  };
}
