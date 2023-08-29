import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as L from 'leaflet';


@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  private visibleMarkersSubject: BehaviorSubject<L.Marker[]> = new BehaviorSubject<L.Marker[]>([]);
  visibleMarkers$ = this.visibleMarkersSubject.asObservable();

  constructor(private ngZone: NgZone) { }
 
  setMarkers(newMarkers: L.Marker[]): void {
    this.ngZone.run(() => {
      this.visibleMarkersSubject.next(newMarkers); // Emit the new markers to subscribers
    })
  }

  getMarkers(): BehaviorSubject<L.Marker[]> {
    //console.log(`getMarkers called! ${this.visibleMarkersSubject}`);
    return this.visibleMarkersSubject;
  }
}