import { Component, OnInit } from '@angular/core';

import { PrivateSchool } from '../privateSchool';
import { PrivateSchoolDataService } from '../private-school-data.service';

import { PublicSchool } from '../publicSchool';
import { PublicSchoolDataService } from '../public-school-data.service';

import { MarkerService } from '../marker.service';

import * as L from 'leaflet';
import 'leaflet.markercluster';

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
  selector: 'app-map-display',
  templateUrl: './map-display.component.html',
  styleUrls: ['./map-display.component.css']
})

export class MapDisplayComponent implements OnInit {
  privateSchools: PrivateSchool[] = [];
  publicSchools: PublicSchool[] = [];
  visibleMarkers: L.Marker[] = [];

  constructor(
    private privateSchoolDataService: PrivateSchoolDataService,
    private publicSchoolDataService: PublicSchoolDataService,
    private markerService: MarkerService
    ) { }

    // Marker cluster stuff
	markerClusterGroup: L.MarkerClusterGroup = L.markerClusterGroup();
	markerClusterData: L.Marker[] = [];

  // Leaflet Map Details
	optionsSpec: any = {
		layers: [{ url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }],
		zoom: 4.5,
    maxZoom: 15,
    minZoom: 3,
		center: [ 40.967243, -100.771556 ]
	};

	// Leaflet bindings
	zoom = this.optionsSpec.zoom;
	center = L.latLng(this.optionsSpec.center);
	options = {
		layers: [ L.tileLayer(this.optionsSpec.layers[0].url, { attribution: this.optionsSpec.layers[0].attribution }) ],
		zoom: this.optionsSpec.zoom,
		center: L.latLng(this.optionsSpec.center)
	};

  ngOnInit(): void {
    this.getPrivateSchools();
  }

  // experimental function for shifted map view results
  onMapReady(map: L.Map): void {
    map.on('moveend', () => {
      this.updateVisibleMarkers(map);
    });
  }

  updateVisibleMarkers(map: L.Map): void {
    const markerList: L.Marker[] = [];
  
    this.markerClusterData.forEach(marker => {
      if (map.getBounds().contains(marker.getLatLng())) {
        markerList.push(marker);
      }
    });
  
    this.markerService.setMarkers(markerList); // Update markers in the service
  }

  markerClusterReady(group: L.MarkerClusterGroup) {
		this.markerClusterGroup = group;
	}

  // private school list retrieval
  getPrivateSchools(): void {
    this.privateSchoolDataService.getPrivateSchoolData()
    .subscribe(privateSchools => {this.privateSchools = privateSchools;
    //this.showData(this.privateSchools);
    this.markerClusterData = this.generateData(this.privateSchools);
    this.markerService.setMarkers(this.markerClusterData);
    });
  }

  //test function for data loading
  private showData(psData: PrivateSchool[]) {
    console.log("showing data");
    for (let element of psData) {
      if (element != null) {
        console.log(element.School_Name);
        console.log(element.Latitude + " " + element.Longitude);
      }
    }
  }

  //school data loader onto map. basically creates private school objects based on private school class defined and loads onto the map
  
  private generateData(psData: PrivateSchool[]): L.Marker[] {
    console.log("we've reached data generation!");
    const data: L.Marker[] = [];

    for (let school of psData) {
      //console.log(`State ${school.State_Name}`);
      if (school != undefined) {
        const markerOptions: CustomMarkerOptions = {
          icon: L.icon({
            iconSize: [ 25, 41 ],
            iconAnchor: [ 13, 41 ],
            iconUrl: 'assets/leaflet/marker-icon.png',
            iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
            shadowUrl: 'assets/leaflet/marker-shadow.png'
          }),
          state: school.State_Name,
          address: school.Full_Address,
          level: school.School_Level,
          school: school.School_Name,
          city: school.City,
          type: school.School_Type
        };
        //console.log(`State should match: ${markerOptions.state}`);
        const marker = L.marker([school.Latitude, school.Longitude], markerOptions).bindPopup(`NAME: ${school.School_Name} <br> ADDRESS: ${school.Full_Address} <br> STATE: ${school.State_Name}`);
        data.push(marker);
      }
    }

    return data;
  }
}