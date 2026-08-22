import { computed, Service, signal } from '@angular/core';
import { SearchResponse } from '../models/search-response';
import { SchoolSearchResult } from '../models/school-search-result';
import { SearchMoreResponse } from '../models/saerch-more-response';

@Service({
  autoProvided: false
})
export class ExplorerStore {
  searchResponse = signal<SearchResponse | null>(null);

  schoolSearchResults = computed(() => {
    const response = this.searchResponse();

    if (response === null) {
      return [];
    }

    return response.schools;
  });

  locationSearchResults = computed(() => {
    const response = this.searchResponse();

    if (response === null) {
      return [];
    }

    return response.locations;
  });

  paginationResults = computed(() => {
    const response = this.searchResponse();

    if (response === null) {
      return null;
    }

    return response.pagination;
  });

  setSearchResponse(response: SearchResponse): void {
    this.searchResponse.set(response);
  }


  clearSearch(): void {
    this.searchResponse.set(null);
  }

  selectedSchool = signal<SchoolSearchResult | null>(null);

  selectSchool(school: SchoolSearchResult): void {
    this.selectedSchool.set(school);
  }

  clearSelectedSchool(): void {
    this.selectedSchool.set(null);
  }

  appendMoreResponse(response: SearchMoreResponse): void {
    const current = this.searchResponse();

    if (current === null) {
      return;
    }

    this.searchResponse.set({
      ...current,

      schools: [
        ...current.schools,
        ...(response.schools ?? [])
      ],

      locations: [
        ...current.locations,
        ...(response.locations ?? [])
      ],

      pagination: {
        ...current.pagination,
        ...response.pagination
      }
    })
  }
}