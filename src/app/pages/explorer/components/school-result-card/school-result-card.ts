import { Component, input, output } from '@angular/core';
import { SchoolSearchResult } from '../../models/school-search-result';

@Component({
  selector: 'app-school-result-card',
  imports: [],
  templateUrl: './school-result-card.html',
  styleUrl: './school-result-card.css'
})
export class SchoolResultCard {
  school = input.required<SchoolSearchResult>();
  schoolSelected = output<SchoolSearchResult>();

  onSelect(): void {
    this.schoolSelected.emit(this.school());
  }
}