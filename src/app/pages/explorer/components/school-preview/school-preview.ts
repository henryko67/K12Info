import { Component, inject, signal } from '@angular/core';
import { ExplorerStore } from '../../services/explorer-store';

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
}
