import { Component, input, output } from '@angular/core';
import { DisplaySchool } from '../../models/display-school';

@Component({
  selector: 'app-school-result-card',
  imports: [],
  templateUrl: './school-result-card.html',
  styleUrl: './school-result-card.css'
})
export class SchoolResultCard {
  school = input.required<DisplaySchool>();
  schoolSelected = output<DisplaySchool>();

  onSelect(): void {
    this.schoolSelected.emit(this.school());
  }
}