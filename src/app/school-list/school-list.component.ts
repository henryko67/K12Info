import { Component, OnDestroy, ChangeDetectorRef, OnInit  } from '@angular/core';
import { MarkerService } from '../marker.service';
import { Subscription } from 'rxjs';

interface CustomMarkerOptions extends L.MarkerOptions {
  icon: L.Icon<L.IconOptions>;
  state: string;
  address: string;
  level: string;
  school: string;
  city: string;
  type: string;
}

@Component({
  selector: 'app-school-list',
  templateUrl: './school-list.component.html',
  styleUrls: ['./school-list.component.css']
})
export class SchoolListComponent implements OnInit, OnDestroy {
  //visibleMarkers: L.Marker[] = [];
  schools: CustomMarkerOptions[] = [];
  subscription: Subscription = new Subscription();

  constructor(private markerService: MarkerService) {}

  ngOnInit() {
    this.subscription = this.markerService.getMarkers().subscribe(markers => {
      const schoolList: CustomMarkerOptions[] = [];
      for (let marker of markers) {
        //this.schools.push((marker.options as CustomMarkerOptions));
        schoolList.push((marker.options as CustomMarkerOptions));
        //console.log((marker.options as CustomMarkerOptions));
      }
      this.schools = schoolList;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
