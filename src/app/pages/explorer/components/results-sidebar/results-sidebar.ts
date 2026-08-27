import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  effect,
  inject,
  Injector
} from '@angular/core';
import { ExplorerStore } from '../../services/explorer-store';
import { SchoolResultCard } from '../school-result-card/school-result-card';

import { ExplorerSchool } from '../../models/explorer-school';

@Component({
  selector: 'app-results-sidebar',
  imports: [SchoolResultCard],
  templateUrl: './results-sidebar.html',
  styleUrl: './results-sidebar.css'
})
export class ResultsSidebar {
  private readonly explorerStore = inject(ExplorerStore);
  private readonly injector = inject(Injector);

  //readonly displayedSchools = this.explorerStore.displayedSchools;
  readonly displayedSchools = this.explorerStore.filteredSchools;
  readonly isOpen = this.explorerStore.resultsSidebarOpen;

  toggleSidebar(): void {
    this.explorerStore.toggleResultsSidebar();
  }

  onSelectSchool(school: ExplorerSchool): void {
    this.explorerStore.selectSchool(school);
    this.explorerStore.focusSchool(school);
  }

  readonly selectedSchool = this.explorerStore.selectedSchool;

  @ViewChildren('schoolItem')
  schoolItems!: QueryList<ElementRef<HTMLElement>>;

  scrollToSelectedSchool(): void {
    const school = this.selectedSchool();

    if (school === null) {
      return;
    }

    const item = this.schoolItems.find(element =>
      element.nativeElement.dataset['schoolId'] === school._id
    );

    item?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  ngAfterViewInit() {
    effect(
      () => {
        this.scrollToSelectedSchool();
      },
      { injector: this.injector }
    );
  }
}
