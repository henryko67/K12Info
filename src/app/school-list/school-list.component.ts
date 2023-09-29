import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MarkerService } from '../marker.service';
import { ActiveMarkerService } from '../active-marker.service';
import { Subscription } from 'rxjs';

interface CustomMarkerOptions extends L.MarkerOptions {
  icon: L.Icon<L.IconOptions>;
  state: string;
  address: string;
  school: string;
  id: number;
}

@Component({
  selector: 'app-school-list',
  templateUrl: './school-list.component.html',
  styleUrls: ['./school-list.component.css']
})
export class SchoolListComponent implements OnInit, OnDestroy {

  @ViewChild('mapDisplay') mapDisplay!: ElementRef;


  //visibleMarkers: L.Marker[] = [];
  schools: CustomMarkerOptions[] = [];
  subscription: Subscription = new Subscription();

  constructor(private markerService: MarkerService, private activeMarkerService: ActiveMarkerService) {}

  ngOnInit() {
    this.subscription = this.markerService.getMarkers().subscribe(markers => {
      const schoolList: CustomMarkerOptions[] = [];
      for (let marker of markers) {
        //this.schools.push((marker.options as CustomMarkerOptions));
        schoolList.push((marker.options as CustomMarkerOptions));
        //console.log((marker.options as CustomMarkerOptions));
      }
      this.schools = schoolList;
      console.log("displaying schools");
    });

    this.activeMarkerService.getActiveId$().subscribe((activeId: number | null) => {
      if (activeId !== null) {
        console.log("marker hit detected");
        this.scrollToSchool(activeId);
      }
    });
  }

  onSchoolItemClick(schoolId: number, index: number): void {
    this.activeMarkerService.setActiveId(schoolId);
    console.log(`Clicked index is: ${index}`);
    //this.toggleAccordion(index);
  }

  currentListItem!: HTMLElement | null;
  currentDescription!: HTMLElement | null;
  scrollToSchool(activeId: number): void {
    if (this.mapDisplay) { // Check if mapDisplay is defined
      console.log(activeId + " should be scrolling");
      const listItem: HTMLElement = this.mapDisplay.nativeElement.querySelector(`#school-${activeId} a`);
      const description: HTMLElement = this.mapDisplay.nativeElement.querySelector(`#school-${activeId} div`);
      if (listItem) {
        if (this.currentListItem != null && this.currentDescription != null) {
          this.currentListItem.classList.remove('scrolled-into-view'); // Remove the CSS class
          this.currentDescription.classList.add('collapse');
        }
        this.currentListItem = listItem;
        this.currentDescription = description;
        console.log("FOUND THE ITEM");
        listItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        listItem.classList.add('scrolled-into-view'); // Add the CSS class
        description.classList.remove('collapse');
      }
    }
  }

  clearActive(): void {
    if (this.currentDescription != null) {
      console.log(this.currentDescription);
      this.currentDescription.classList.add('collapse');
    }
  }

  activeIndex: number | null = null;

  toggleAccordion(index: number): void {
    /*console.log(`Current index is: ${index}`);
    if (this.activeIndex === index) {
      console.log("Collapsing");
      this.activeIndex = null; // Collapse if already open
    } else {
      console.log("Expanding");
      this.activeIndex = index; // Expand if closed
    }*/
    if (this.currentDescription != null && this.currentDescription.classList.contains('collapse')) {
      this.currentDescription.classList.remove('collapse');
    } else if (this.currentDescription != null && !this.currentDescription.classList.contains('collapse')) {
      this.currentDescription.classList.add('collapse');
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}