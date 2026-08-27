import { Component, inject } from '@angular/core';

import { SearchBar } from './components/search-bar/search-bar';
import { FilterPanel } from './components/filter-panel/filter-panel';
import { Map } from './components/map/map';
import { ResultsSidebar } from './components/results-sidebar/results-sidebar';
import { SchoolPreview } from './components/school-preview/school-preview';

import { ExplorerStore } from './services/explorer-store';

@Component({
  selector: 'app-explorer',
  imports: [
    SearchBar,
    FilterPanel,
    Map,
    ResultsSidebar,
    SchoolPreview
  ],
  providers: [ExplorerStore],
  templateUrl: './explorer.html',
  styleUrl: './explorer.css'
})
export class Explorer {
  private readonly explorerStore = inject(ExplorerStore);
  readonly previewOpen = this.explorerStore.previewOpen;
  readonly resultsSidebarOpen = this.explorerStore.resultsSidebarOpen;
}
