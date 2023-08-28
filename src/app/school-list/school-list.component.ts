import { Component, OnDestroy } from '@angular/core';
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
export class SchoolListComponent implements OnDestroy {
  //visibleMarkers: L.Marker[] = [];
  schools: CustomMarkerOptions[] = [];
  private subscription: Subscription;

  constructor(private markerService: MarkerService) {
    this.subscription = this.markerService.getMarkers().subscribe(markers => {
      //console.log("SchoolListComponent: BehaviorSubject updated");
      //this.visibleMarkers = markers;
      console.log(`school list markers: ${markers}`);
      for (let marker of markers) {
        this.schools.push((marker.options as CustomMarkerOptions));
        //console.log((marker.options as CustomMarkerOptions));
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
