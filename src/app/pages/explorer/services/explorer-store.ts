import { computed, Service, signal } from '@angular/core';
import { SearchResponse } from '../models/search-response';
import { SearchMoreResponse } from '../models/saerch-more-response';
import { DisplaySchool } from '../models/display-school';

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

  selectedSchool = signal<DisplaySchool | null>(null);

  selectSchool(school: DisplaySchool): void {
    this.selectedSchool.set(school);
    this.openPreview();
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

  displayedSchools = signal<DisplaySchool[]>([]);

  addDisplayedSchool(school: DisplaySchool): void {
    this.displayedSchools.set([school]);
  }

  setDisplayedSchools(schools: DisplaySchool[]): void {
    this.displayedSchools.set(schools);
  }

  clearDisplayedSchools(): void {
    this.displayedSchools.set([]);
  }

  previewOpen = signal(false);

  openPreview(): void {
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }
}