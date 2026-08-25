import { Component, input, output, inject } from '@angular/core';
import { ExplorerStore } from '../../services/explorer-store';

import { ExplorerSchool } from '../../models/explorer-school';

@Component({
  selector: 'app-school-result-card',
  imports: [],
  templateUrl: './school-result-card.html',
  styleUrl: './school-result-card.css'
})
export class SchoolResultCard {
  school = input.required<ExplorerSchool>();
  schoolSelected = output<ExplorerSchool>();

  private readonly explorerStore = inject(ExplorerStore);

  readonly selectedSchool = this.explorerStore.selectedSchool;

  onSelect(): void {
    this.schoolSelected.emit(this.school());
  }
}