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
import { ExplorerStore } from '../../services/explorer-store';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-search-bar',
  styleUrl: './search-bar.css',
  templateUrl: './search-bar.html',
})
export class SearchBar {
  private readonly searchApi = inject(SearchApi);
  private readonly explorerStore = inject(ExplorerStore);

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private currentQuery = "";

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

  readonly schoolSearchResults =
    this.explorerStore.schoolSearchResults;

  readonly locationSearchResults =
    this.explorerStore.locationSearchResults;

  readonly paginationResults = this.explorerStore.paginationResults;

  searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true })
  });

  resultsOpen = signal(false);

  onSearch(): void {
    const query = this.searchForm.controls.query.value.trim();

    if (!query) {
      return;
    }

    if (this.currentQuery !== query) {
      this.explorerStore.clearSearch();
      this.explorerStore.clearSelectedSchool();
    }

    this.searchApi.search(query).subscribe(response => {
      this.explorerStore.setSearchResponse(response);
      this.resultsOpen.set(true);
      this.currentQuery = query;
    });
  }

  loadingMoreLocations = signal(false);

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

  loadingMoreSchools = signal(false);

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
}