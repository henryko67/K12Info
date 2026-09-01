import { Component, inject, computed } from '@angular/core';
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

    this.schoolDetailsApi
      .getDetails(school.ids.ncessch)
      .subscribe({
        next: details => {
          this.explorerStore.setSchoolDetails(school.ids.ncessch, details);
          this.explorerStore.openDetails();
        },
        error: error => {
          console.error('Failed to load expanded school details:', error);
        }
      });
  }

  closeDetails(): void {
    this.explorerStore.closeDetails();
  }
}
