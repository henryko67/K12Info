import { Component, inject, signal } from '@angular/core';
import { ExplorerStore } from '../../services/explorer-store';
import { ExplorerSchool } from '../../models/explorer-school';
import { SchoolDetailsApi } from '../../services/school-details-api';

@Component({
  imports: [],
  selector: 'app-school-preview',
  styleUrl: './school-preview.css',
  templateUrl: './school-preview.html',
})
export class SchoolPreview {
  private readonly explorerStore = inject(ExplorerStore);

  readonly selectedSchool = this.explorerStore.selectedSchool;

  closePreview(): void {
    this.explorerStore.closePreview();
  }

  //Data formatting from raw docs

  formatGrade(value?: number): string {
    if (value === undefined || value < -1) {
      return 'Unavailable';
    }

    if (value === -1) return 'Pre-K';
    if (value === 0) return 'Kindergarten';
    if (value >= 1 && value <= 12) return `Grade ${value}`;
    if (value === 14) return 'Adult education';
    if (value === 15) return 'Ungraded';

    return 'Unavailable';
  }

  formatSchoolLevel(school: ExplorerSchool): string {
    const value = school.classification?.level;

    if (value === undefined || value < 0) {
      return 'Unavailable';
    }

    if (school.sector === 'public') {
      const levels: Record<number, string> = {
        0: 'Pre-K',
        1: 'Primary',
        2: 'Middle',
        3: 'High',
        4: 'Other',
        5: 'Ungraded',
        6: 'Adult education',
        7: 'Secondary'
      };

      return levels[value] ?? 'Unavailable';
    }

    const levels: Record<number, string> = {
      1: 'Elementary',
      7: 'Secondary',
      8: 'Combined'
    };

    return levels[value] ?? 'Unavailable';
  }

  formatSchoolType(school: ExplorerSchool): string {
    const value = school.classification?.type;

    if (value === undefined || value < 0) {
      return 'Unavailable';
    }

    const publicTypes: Record<number, string> = {
      1: 'Regular school',
      2: 'Special education school',
      3: 'Vocational school',
      4: 'Alternative / other school',
      5: 'Reportable program'
    };

    const privateTypes: Record<number, string> = {
      1: 'Regular school',
      2: 'Special education',
      3: 'Career / technical / vocational',
      4: 'Alternative / other',
      5: 'Special program emphasis',
      6: 'Montessori',
      7: 'Early childhood / child care'
    };

    return school.sector === 'public'
      ? publicTypes[value] ?? 'Unavailable'
      : privateTypes[value] ?? 'Unavailable';
  }

  formatStatus(value?: number): string {
    if (value === undefined || value <= 0) {
      return 'Unavailable';
    }

    const statuses: Record<number, string> = {
      1: 'Open',
      2: 'Closed',
      3: 'New',
      4: 'Added',
      5: 'Changed agency',
      6: 'Inactive',
      7: 'Future',
      8: 'Reopened'
    };

    return statuses[value] ?? 'Unavailable';
  }

  formatYesNo(value?: number): string {
    if (value === 0) return 'No';
    if (value === 1) return 'Yes';

    return 'Unavailable';
  }

  formatVirtual(value?: number): string {
    if (value === undefined || value < 0) {
      return 'Unavailable';
    }

    const values: Record<number, string> = {
      0: 'Not virtual',
      1: 'Virtual',
      2: 'Virtual with face-to-face options',
      3: 'Supplemental virtual'
    };

    return values[value] ?? 'Unavailable';
  }

  formatProgramAvailability(value?: number): string {
    if (value === undefined || value < 0) {
      return 'Unavailable / not offered';
    }

    return 'Yes';
  }

  showSecondaryPrograms(school: ExplorerSchool): boolean {
    return (school.grades?.highest ?? -1) >= 9;
  }

  formatLibraryMediaCenter(value?: number): string {
    if (value === undefined || value < 0) {
      return 'Unavailable';
    }

    return value > 0 ? 'Yes' : 'No';
  }

  formatLunchProgram(value?: number): string {
    if (value === undefined || value < 0) {
      return 'Unavailable';
    }

    const values: Record<number, string> = {
      0: 'Not participating',
      1: 'Participating',
      2: 'Participating under CEP',
      3: 'Participating under Provision 1',
      4: 'Participating under Provision 2',
      5: 'Participating under Provision 3'
    };

    return values[value] ?? 'Unavailable';
  }

  formatReligion(school: ExplorerSchool): string {
    if (school.sector !== 'private') {
      return 'Unavailable';
    }

    return school.classification?.religion ?? 'Unavailable';
  }

  readonly schoolDetailsApi = inject(SchoolDetailsApi);
  readonly schoolDetails = this.explorerStore.schoolDetails;
  readonly detailsOpen = this.explorerStore.detailsOpen;

  onMoreDetails(): void {
    const school = this.explorerStore.selectedSchool();

    if (
      school === null ||
      school.sector !== 'public'
    ) {
      return;
    }

    if (this.explorerStore.schoolDetails() !== null) {
      this.explorerStore.openDetails();
      return;
    }

    this.schoolDetailsApi
      .getDetails(school.ids.ncessch)
      .subscribe(details => {
        this.explorerStore.setSchoolDetails(details);
        this.explorerStore.openDetails();
      });
  }

  formatFte(value: number | undefined): string | number {
    if (value === undefined || value < 0) {
      return 'Unavailable';
    }

    return value;
  }

  formatCount(value: number | undefined): string | number {
    if (value === undefined || value < 0) {
      return 'Unavailable';
    }

    return value;
  }

  showPreschoolData(school: ExplorerSchool): boolean {
    const lowest = school.grades?.lowest;
    const highest = school.grades?.highest;

    if (
      lowest === undefined ||
      highest === undefined
    ) {
      return false;
    }

    return lowest <= -1 && highest >= -1;
  }

  closeDetails(): void {
    this.explorerStore.closeDetails();
  }
}
