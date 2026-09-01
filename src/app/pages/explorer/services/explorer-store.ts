import { computed, Service, signal } from '@angular/core';
import { SearchResponse } from '../models/search-response';
import { SearchMoreResponse } from '../models/search-more-response';

import { ExplorerSchool } from '../models/explorer-school';
import { SchoolDetailsResponse } from '../models/school-details-response';

/**
 * Owns Explorer state shared by the search results, map, preview, and details
 * views. HTTP access stays in API services; this store only coordinates signals
 * and caches the currently selected school's expanded details.
 */
@Service({
  autoProvided: false,
})
export class ExplorerStore {
  // Search suggestions are distinct from the schools currently rendered on
  // the map; choosing a suggestion or location promotes results into the
  // displayedSchools state below.
  readonly searchResponse = signal<SearchResponse | null>(null);

  readonly schoolSearchResults = computed(() => {
    const response = this.searchResponse();

    if (response === null) {
      return [];
    }

    return response.schools;
  });

  readonly locationSearchResults = computed(() => {
    const response = this.searchResponse();

    if (response === null) {
      return [];
    }

    return response.locations;
  });

  readonly paginationResults = computed(() => {
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

  readonly selectedSchool = signal<ExplorerSchool | null>(null);

  selectSchool(school: ExplorerSchool): void {
    // Selection is the synchronization point for map highlighting, sidebar
    // scrolling, and preview visibility. Expanded details never carry across
    // to a newly selected school.
    this.selectedSchool.set(school);
    this.openPreview();
    this.schoolDetails.set(null);
    this.detailsOpen.set(false);
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

      schools: [...current.schools, ...(response.schools ?? [])],

      locations: [...current.locations, ...(response.locations ?? [])],

      pagination: {
        ...current.pagination,
        ...response.pagination,
      },
    });
  }

  readonly displayedSchools = signal<ExplorerSchool[]>([]);

  addDisplayedSchool(school: ExplorerSchool): void {
    this.displayedSchools.set([school]);
  }

  setDisplayedSchools(schools: ExplorerSchool[]): void {
    this.displayedSchools.set(schools);
  }

  readonly focusRequest = signal<{
    school: ExplorerSchool;
    requestId: number;
  } | null>(null);

  focusSchool(school: ExplorerSchool): void {
    // A request token makes repeated selections of the same school observable
    // to the map effect, where a plain selectedSchool signal would not rerun.
    this.focusRequest.set({
      school,
      requestId: Date.now(),
    });
  }

  readonly previewOpen = signal(false);

  openPreview(): void {
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  readonly resultsSidebarOpen = signal(true);

  toggleResultsSidebar(): void {
    this.resultsSidebarOpen.update((open) => !open);
  }

  readonly publicFilters = signal({
    levels: [] as number[],
    maxStudentTeacherRatio: null as number | null,
    apOnly: false,
    ibOnly: false,
    giftedOnly: false,
    dualEnrollmentOnly: false,
    charterOnly: false,
    lunchProgram: null as number | null,
    schoolTypes: [] as number[],
  });

  readonly privateFilters = signal({
    levels: [] as number[],
    maxStudentTeacherRatio: null as number | null,
    religiousAffiliations: [] as number[],
    schoolTypes: [] as number[],
  });

  readonly sectorFilter = signal<'all' | 'public' | 'private'>('all');

  setSectorFilter(value: 'all' | 'public' | 'private'): void {
    this.sectorFilter.set(value);
  }

  setPublicApOnly(value: boolean): void {
    this.publicFilters.update((filters) => ({
      ...filters,
      apOnly: value,
    }));
  }

  setPublicIbOnly(value: boolean): void {
    this.publicFilters.update((filters) => ({
      ...filters,
      ibOnly: value,
    }));
  }

  setPublicGiftedOnly(value: boolean): void {
    this.publicFilters.update((filters) => ({
      ...filters,
      giftedOnly: value,
    }));
  }

  setPublicDualEnrollmentOnly(value: boolean): void {
    this.publicFilters.update((filters) => ({
      ...filters,
      dualEnrollmentOnly: value,
    }));
  }

  setPublicCharterOnly(value: boolean): void {
    this.publicFilters.update((filters) => ({
      ...filters,
      charterOnly: value,
    }));
  }

  setPublicLunchProgram(value: number | null): void {
    this.publicFilters.update((filters) => ({
      ...filters,
      lunchProgram: value,
    }));
  }

  setPublicMaxStudentTeacherRatio(value: number | null): void {
    this.publicFilters.update((filters) => ({
      ...filters,
      maxStudentTeacherRatio: value,
    }));
  }

  setPrivateMaxStudentTeacherRatio(value: number | null): void {
    this.privateFilters.update((filters) => ({
      ...filters,
      maxStudentTeacherRatio: value,
    }));
  }

  togglePublicLevel(level: number): void {
    this.publicFilters.update((filters) => {
      const exists = filters.levels.includes(level);

      return {
        ...filters,
        levels: exists
          ? filters.levels.filter((value) => value !== level)
          : [...filters.levels, level],
      };
    });
  }

  togglePublicSchoolType(type: number): void {
    this.publicFilters.update((filters) => {
      const exists = filters.schoolTypes.includes(type);

      return {
        ...filters,
        schoolTypes: exists
          ? filters.schoolTypes.filter((value) => value !== type)
          : [...filters.schoolTypes, type],
      };
    });
  }

  togglePrivateLevel(level: number): void {
    this.privateFilters.update((filters) => {
      const exists = filters.levels.includes(level);

      return {
        ...filters,
        levels: exists
          ? filters.levels.filter((value) => value !== level)
          : [...filters.levels, level],
      };
    });
  }

  togglePrivateSchoolType(type: number): void {
    this.privateFilters.update((filters) => {
      const exists = filters.schoolTypes.includes(type);

      return {
        ...filters,
        schoolTypes: exists
          ? filters.schoolTypes.filter((value) => value !== type)
          : [...filters.schoolTypes, type],
      };
    });
  }

  togglePrivateReligiousAffiliation(affiliation: number): void {
    this.privateFilters.update((filters) => {
      const exists = filters.religiousAffiliations.includes(affiliation);

      return {
        ...filters,
        religiousAffiliations: exists
          ? filters.religiousAffiliations.filter((value) => value !== affiliation)
          : [...filters.religiousAffiliations, affiliation],
      };
    });
  }

  clearPublicFilters(): void {
    this.publicFilters.set({
      levels: [],
      maxStudentTeacherRatio: null,
      apOnly: false,
      ibOnly: false,
      giftedOnly: false,
      dualEnrollmentOnly: false,
      charterOnly: false,
      lunchProgram: null,
      schoolTypes: [],
    });
  }

  clearPrivateFilters(): void {
    this.privateFilters.set({
      levels: [],
      maxStudentTeacherRatio: null,
      religiousAffiliations: [],
      schoolTypes: [],
    });
  }

  clearAllFilters(): void {
    this.sectorFilter.set('all');

    this.clearPublicFilters();
    this.clearPrivateFilters();
  }

  readonly filteredSchools = computed(() => {
    // Both the map and results sidebar consume this computed signal so filters
    // cannot leave their visible school sets out of sync.
    const schools = this.displayedSchools();

    const sector = this.sectorFilter();
    const publicFilters = this.publicFilters();
    const privateFilters = this.privateFilters();

    return schools.filter((school) => {
      if (sector !== 'all' && school.sector !== sector) {
        return false;
      }

      // Public and private NCES datasets use different classification codes.
      if (school.sector === 'public') {
        if (
          publicFilters.levels.length > 0 &&
          (school.classification?.level === undefined ||
            !publicFilters.levels.includes(school.classification.level))
        ) {
          return false;
        }

        if (
          publicFilters.maxStudentTeacherRatio !== null &&
          (school.enrollment?.students_per_teacher === undefined ||
            school.enrollment.students_per_teacher > publicFilters.maxStudentTeacherRatio)
        ) {
          return false;
        }

        if (publicFilters.apOnly && (school.program_enrollment?.ap ?? -1) < 0) {
          return false;
        }

        if (publicFilters.ibOnly && (school.program_enrollment?.ib ?? -1) < 0) {
          return false;
        }

        if (publicFilters.giftedOnly && (school.program_enrollment?.gifted_talented ?? -1) < 0) {
          return false;
        }

        if (
          publicFilters.dualEnrollmentOnly &&
          (school.program_enrollment?.dual_enrollment ?? -1) < 0
        ) {
          return false;
        }

        if (publicFilters.charterOnly && school.classification?.charter !== 1) {
          return false;
        }

        if (
          publicFilters.lunchProgram !== null &&
          school.lunch?.program !== publicFilters.lunchProgram
        ) {
          return false;
        }

        if (
          publicFilters.schoolTypes.length > 0 &&
          (school.classification?.type === undefined ||
            !publicFilters.schoolTypes.includes(school.classification.type))
        ) {
          return false;
        }
      }

      if (school.sector === 'private') {
        if (
          privateFilters.levels.length > 0 &&
          (school.classification?.level === undefined ||
            !privateFilters.levels.includes(school.classification.level))
        ) {
          return false;
        }

        if (
          privateFilters.maxStudentTeacherRatio !== null &&
          (school.enrollment?.students_per_teacher === undefined ||
            school.enrollment.students_per_teacher > privateFilters.maxStudentTeacherRatio)
        ) {
          return false;
        }

        if (
          privateFilters.religiousAffiliations.length > 0 &&
          (school.classification?.religious_affiliation === undefined ||
            !privateFilters.religiousAffiliations.includes(
              school.classification.religious_affiliation,
            ))
        ) {
          return false;
        }

        if (
          privateFilters.schoolTypes.length > 0 &&
          (school.classification?.type === undefined ||
            !privateFilters.schoolTypes.includes(school.classification.type))
        ) {
          return false;
        }
      }

      return true;
    });
  });

  readonly schoolDetails = signal<{
    ncessch: string;
    details: SchoolDetailsResponse;
  } | null>(null);

  /**
   * Caches CRDC-expanded public-school details by NCES school identifier.
   * This key is intentionally distinct from the base MongoDB `_id` used by
   * school routes, selection, and comments.
   */
  setSchoolDetails(ncessch: string, details: SchoolDetailsResponse): void {
    this.schoolDetails.set({
      ncessch,
      details,
    });
  }

  readonly detailsOpen = signal(false);

  openDetails(): void {
    this.detailsOpen.set(true);
  }

  closeDetails(): void {
    this.detailsOpen.set(false);
  }
}
