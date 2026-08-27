import { Component, inject, signal } from '@angular/core';
import { ExplorerStore } from '../../services/explorer-store';

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css'
})
export class FilterPanel {
  private readonly explorerStore = inject(ExplorerStore);

  readonly sectorFilter = this.explorerStore.sectorFilter;
  readonly publicFilters = this.explorerStore.publicFilters;
  readonly privateFilters = this.explorerStore.privateFilters;

  readonly isOpen = signal(false);

  togglePanel(): void {
    this.isOpen.update(open => !open);
  }

  setSector(value: 'all' | 'public' | 'private'): void {
    console.log("Sector switch called");
    console.log(value);
    this.explorerStore.setSectorFilter(value);
  }

  setApOnly(value: boolean): void {
    this.explorerStore.setPublicApOnly(value);
  }

  setIbOnly(value: boolean): void {
    this.explorerStore.setPublicIbOnly(value);
  }

  setGiftedOnly(value: boolean): void {
    this.explorerStore.setPublicGiftedOnly(value);
  }

  setDualEnrollmentOnly(value: boolean): void {
    this.explorerStore.setPublicDualEnrollmentOnly(value);
  }

  setCharterOnly(value: boolean): void {
    this.explorerStore.setPublicCharterOnly(value);
  }

  setLunchProgram(value: string): void {
    this.explorerStore.setPublicLunchProgram(
      value === '' ? null : Number(value)
    );
  }

  setMaxRatio(value: string): void {
    const ratio = value === '' ? null : Number(value);

    this.explorerStore.setPublicMaxStudentTeacherRatio(ratio);
    this.explorerStore.setPrivateMaxStudentTeacherRatio(ratio);
  }

  togglePublicLevel(level: number): void {
    this.explorerStore.togglePublicLevel(level);
  }

  togglePrivateLevel(level: number): void {
    this.explorerStore.togglePrivateLevel(level);
  }

  togglePublicType(type: number): void {
    this.explorerStore.togglePublicSchoolType(type);
  }

  togglePrivateType(type: number): void {
    this.explorerStore.togglePrivateSchoolType(type);
  }

  toggleReligiousAffiliation(
    affiliation: number
  ): void {
    this.explorerStore
      .togglePrivateReligiousAffiliation(affiliation);
  }

  clearFilters(): void {
    this.explorerStore.clearAllFilters();
  }
}