import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { forkJoin } from 'rxjs';

import { SearchApi } from '../../services/search-api';
import { LocationsApi } from '../../services/locations-api';
import { SchoolsApi } from '../../services/schools-api';
import { ExplorerStore } from '../../services/explorer-store';
import { SchoolSearchResult } from '../../models/school-search-result';
import { LocationSearchResult } from '../../models/location-search-result';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-search-bar',
  styleUrl: './search-bar.css',
  templateUrl: './search-bar.html',
})
export class SearchBar {
  private readonly searchApi = inject(SearchApi);
  private readonly locationsApi = inject(LocationsApi);
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly explorerStore = inject(ExplorerStore);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private currentQuery = "";
  private searchRequestId = 0;

  readonly schoolSearchResults =
    this.explorerStore.schoolSearchResults;

  readonly locationSearchResults =
    this.explorerStore.locationSearchResults;

  readonly paginationResults = this.explorerStore.paginationResults;

  readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true })
  });

  readonly resultsOpen = signal(false);
  readonly loadingMoreLocations = signal(false);
  readonly loadingMoreSchools = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.resultsOpen.set(false);
    }
  }

  openExistingResults(): void {
    if (this.explorerStore.searchResponse() !== null) {
      this.resultsOpen.set(true);
    }
  }

  onSearch(): void {
    const query = this.searchForm.controls.query.value.trim();

    if (!query) {
      return;
    }

    if (this.currentQuery !== query) {
      // Results from a different query must not retain the prior selection;
      // pagination for the same query can safely append to existing state.
      this.explorerStore.clearSearch();
      this.explorerStore.clearSelectedSchool();
    }

    const requestId = ++this.searchRequestId;

    this.searchApi.search(query).subscribe({
      next: response => {
        if (requestId !== this.searchRequestId) {
          return;
        }

        this.explorerStore.setSearchResponse(response);
        this.resultsOpen.set(true);
        this.currentQuery = query;
      },
      error: error => {
        if (requestId === this.searchRequestId) {
          console.error('Failed to search schools and locations:', error);
        }
      }
    });
  }

  onLoadMoreLocations(): void {
    const pagination = this.paginationResults();

    if (
      pagination === null ||
      !pagination.locationHasMore ||
      !pagination.locationAfter ||
      this.loadingMoreLocations()
    ) {
      return;
    }

    this.loadingMoreLocations.set(true);

    this.searchApi
      .searchMore(
        this.currentQuery,
        'location',
        pagination.locationAfter
      )
      .subscribe({
        next: response => {
          this.explorerStore.appendMoreResponse(response);
        },

        error: error => {
          console.error('Failed to load more locations:', error);
          this.loadingMoreLocations.set(false);
        },

        complete: () => {
          this.loadingMoreLocations.set(false);
        }
      });
  }

  onLoadMoreSchools(): void {
    const pagination = this.paginationResults();

    if (pagination === null || this.loadingMoreSchools()) {
      return;
    }

    const requests = [];

    if (
      pagination.publicHasMore &&
      pagination.publicAfter
    ) {
      requests.push(
        this.searchApi.searchMore(
          this.currentQuery,
          'public',
          pagination.publicAfter
        )
      );
    }

    if (
      pagination.privateHasMore &&
      pagination.privateAfter
    ) {
      requests.push(
        this.searchApi.searchMore(
          this.currentQuery,
          'private',
          pagination.privateAfter
        )
      );
    }

    if (requests.length === 0) {
      return;
    }

    this.loadingMoreSchools.set(true);

    forkJoin(requests).subscribe({
      next: responses => {
        for (const response of responses) {
          this.explorerStore.appendMoreResponse(response);
        }
      },

      error: error => {
        console.error('Failed to load more schools:', error);
        this.loadingMoreSchools.set(false);
      },

      complete: () => {
        this.loadingMoreSchools.set(false);
      }
    });
  }

  onSelectLocation(location: LocationSearchResult): void {
    this.resultsOpen.set(false);

    this.locationsApi
      .getSchoolsByLocation(location._id)
      .subscribe({
        next: response => {
          // Location search results contain a location identity, not map-ready
          // school documents, so resolve both sectors before updating Explorer.
          const schools = [
            ...response.publicResults,
            ...response.privateResults
          ];

          this.explorerStore.setDisplayedSchools(schools);
          this.explorerStore.clearSelectedSchool();
          this.explorerStore.closePreview();
        },
        error: error => {
          console.error('Failed to load schools for location:', error);
        }
      });
  }

  onSelectSchool(school: SchoolSearchResult): void {
    this.resultsOpen.set(false);

    this.schoolsApi
      .getSchoolById(school.sector, school._id)
      .subscribe({
        next: fullSchool => {
          this.explorerStore.addDisplayedSchool(fullSchool);
          this.explorerStore.selectSchool(fullSchool);
          this.explorerStore.focusSchool(fullSchool);
        },
        error: error => {
          console.error('Failed to load school:', error);
        }
      });
  }
}
