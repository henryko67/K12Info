import { Component, inject, computed, signal } from '@angular/core';
import { ExplorerStore } from '../../services/explorer-store';
import { ExplorerSchool } from '../../models/explorer-school';
import { SchoolDetailsApi } from '../../services/school-details-api';
import { Router } from '@angular/router';

import {
  formatGrade,
  formatSchoolLevel,
  formatSchoolType,
  formatStatus,
  formatYesNo,
  formatVirtual,
  formatProgramAvailability,
  formatLibraryMediaCenter,
  formatLunchProgram,
  formatFte,
  formatCount,
  showSecondaryPrograms,
  showPreschoolData
} from '../../../../utils/school-formatters';

@Component({
  imports: [],
  selector: 'app-school-preview',
  styleUrl: './school-preview.css',
  templateUrl: './school-preview.html',
})
export class SchoolPreview {
  private readonly explorerStore = inject(ExplorerStore);
  private readonly router = inject(Router);
  readonly schoolDetailsApi = inject(SchoolDetailsApi);

  readonly expandedDetails = computed(
    () => this.explorerStore.schoolDetails()?.details ?? null
  );

  readonly selectedSchool = this.explorerStore.selectedSchool;
  readonly detailsOpen = this.explorerStore.detailsOpen;
  private readonly detailsRequestNcessch = signal<string | null>(null);
  readonly detailsLoading = computed(() => {
    const school = this.selectedSchool();

    return (
      school?.sector === 'public' &&
      this.detailsRequestNcessch() === school.ids.ncessch
    );
  });

  readonly formatGrade = formatGrade;
  readonly formatSchoolLevel = formatSchoolLevel;
  readonly formatSchoolType = formatSchoolType;
  readonly formatStatus = formatStatus;
  readonly formatYesNo = formatYesNo;
  readonly formatVirtual = formatVirtual;
  readonly formatProgramAvailability = formatProgramAvailability;
  readonly formatLibraryMediaCenter = formatLibraryMediaCenter;
  readonly formatLunchProgram = formatLunchProgram;
  readonly formatFte = formatFte;
  readonly formatCount = formatCount;
  readonly showSecondaryPrograms = showSecondaryPrograms;
  readonly showPreschoolData = showPreschoolData;

  openSchoolDetails(): void {
    const school = this.explorerStore.selectedSchool();

    if (!school) {
      return;
    }

    this.router.navigate([
      '/school',
      school.sector,
      school._id
    ]);
  }

  closePreview(): void {
    this.explorerStore.closePreview();
  }

  formatReligion(school: ExplorerSchool): string {
    if (school.sector !== 'private') {
      return 'Unavailable';
    }

    return school.classification?.religion ?? 'Unavailable';
  }

  onMoreDetails(): void {
    const school = this.explorerStore.selectedSchool();

    if (
      school === null ||
      school.sector !== 'public'
    ) {
      return;
    }

    const cachedDetails =
      this.explorerStore.schoolDetails();

    if (
      cachedDetails?.ncessch ===
      school.ids.ncessch
    ) {
      this.explorerStore.openDetails();
      return;
    }

    if (this.detailsRequestNcessch() === school.ids.ncessch) {
      return;
    }

    const requestedNcessch = school.ids.ncessch;
    this.detailsRequestNcessch.set(requestedNcessch);

    this.schoolDetailsApi
      .getDetails(requestedNcessch)
      .subscribe({
        next: details => {
          const selectedSchool = this.explorerStore.selectedSchool();

          if (
            selectedSchool?.sector !== 'public' ||
            selectedSchool.ids.ncessch !== requestedNcessch
          ) {
            return;
          }

          this.explorerStore.setSchoolDetails(requestedNcessch, details);
          this.explorerStore.openDetails();
        },
        error: error => {
          if (this.detailsRequestNcessch() === requestedNcessch) {
            this.detailsRequestNcessch.set(null);
          }

          console.error('Failed to load expanded school details:', error);
        },
        complete: () => {
          if (this.detailsRequestNcessch() === requestedNcessch) {
            this.detailsRequestNcessch.set(null);
          }
        }
      });
  }

  closeDetails(): void {
    this.explorerStore.closeDetails();
  }
}
