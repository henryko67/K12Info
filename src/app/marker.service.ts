import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as L from 'leaflet';


@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  constructor() { }

  //private visibleMarkers: L.Marker[] = [];
  private visibleMarkersSubject: BehaviorSubject<L.Marker[]> = new BehaviorSubject<L.Marker[]>([]);

  setMarkers(markers: L.Marker[]): void {
    //console.log(`New Markers Set! ${markers}`)
    //this.visibleMarkers = markers;
    this.visibleMarkersSubject.next(markers);
    //console.log(`Did I really set the visibleMarkers correctly? ${this.visibleMarkers}`);
  }

  /*getMarkers(): L.Marker[] {
    console.log(`getMarkers called! ${this.visibleMarkers}`);
    return this.visibleMarkers;
  }*/
  getMarkers(): BehaviorSubject<L.Marker[]> {
    //console.log(`getMarkers called! ${this.visibleMarkersSubject}`);
    return this.visibleMarkersSubject;
  }
}