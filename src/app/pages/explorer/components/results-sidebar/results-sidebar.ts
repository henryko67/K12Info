import { Component, inject } from '@angular/core';
import { ExplorerStore } from '../../services/explorer-store';
import { SchoolResultCard } from '../school-result-card/school-result-card';
import { SchoolSearchResult } from '../../models/school-search-result';

@Component({
  selector: 'app-results-sidebar',
  imports: [SchoolResultCard],
  templateUrl: './results-sidebar.html',
  styleUrl: './results-sidebar.css'
})
export class ResultsSidebar {
  private readonly explorerStore = inject(ExplorerStore);

  readonly displayedSchools = this.explorerStore.displayedSchools;

  onSelectSchool(school: SchoolSearchResult): void {
    this.explorerStore.selectSchool(school);
  }
}