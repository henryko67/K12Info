import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

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
  school: string;
}

@Component({
  selector: 'app-map-display',
  templateUrl: './map-display.component.html',
  styleUrls: ['./map-display.component.css']
})

export class MapDisplayComponent implements OnInit {
  privateSchools: PrivateSchool[] = [];
  publicSchools: PublicSchool[] = [];
  markers: L.Marker[] = [];

  constructor(
    private privateSchoolDataService: PrivateSchoolDataService,
    private publicSchoolDataService: PublicSchoolDataService,
    private markerService: MarkerService
    ) { }

  // Map object
  map!: L.Map;

  // Marker cluster stuff
	markerClusterGroup: L.MarkerClusterGroup = L.markerClusterGroup();
	markerClusterData: L.Marker[] = [];
  searchAreaMode: boolean = false;
  
  // Open Street Map object
  LAYER_OSM = {
    id: 'openstreetmap',
    name: 'Open Street Map',
    enabled: true,
    layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
  };

  // World Imagery Map object
  LAYER_WI = {
    id: 'arcgisworldimagery',
    name: 'World Imagery',
    enabled: false,
    layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
  }
  // Leaflet layer options menu
  layersControlOptions: L.Control.LayersOptions = {
    position: 'topright',
    collapsed: false
  };

  // Base layer object
  baseLayers = {
    'Open Street Map': this.LAYER_OSM.layer,
    'Satellite': this.LAYER_WI.layer
  };

  // Leaflet Map Details
	optionsSpec: any = {
		zoom: 4.5,
    maxZoom: 15,
    minZoom: 10,
		center: [ 40.967243, -95.771556 ]
	};

	//Leaflet bindings
	zoom = this.optionsSpec.zoom;
	center = L.latLng(this.optionsSpec.center);
	options = {
		zoom: this.optionsSpec.zoom,
		center: L.latLng(this.optionsSpec.center)
	};

  ngOnInit(): void {
    //this.getPrivateSchools();
    //this.getPublicSchools();
    this.getSchools();
  }

  /**
   * Function detects changes on the map and requests updates for visible markers.
   * Function is currently disabled for optimization purposes.
   */
  /*onMapReady(map: L.Map): void {
    map.on('moveend', () => {
      this.updateVisibleMarkers(map);
    });
  }*/

  onMapReady(map: L.Map): void {
    this.map = map;
  }

  // Function creates the functionality of searching the map boundaries for markers

  searchArea() {
    this.searchAreaMode = !this.searchAreaMode;

    //this.getSchools();

    // Clear te current marker cluster group;
    this.markerClusterGroup.clearLayers();
    this.markerClusterData = [];

    this.markers.forEach(marker => {
      if (this.map.getBounds().contains(marker.getLatLng())) {
        this.markerClusterData.push(marker);
        this.markerClusterGroup.addLayer(marker);
      }
    });

    this.map.addLayer(this.markerClusterGroup);

    this.markerService.setMarkers(this.markerClusterData);

    //this.updateVisibleMarkers(this.map);
  }

  /**
   * Function that actually updates the list of visible markers
   * The function retreives the map and loops through every marker and checks which ones are within
   * current viewable bounds
  */
  updateVisibleMarkers(map: L.Map): void {
    const markerList: L.Marker[] = [];
    const bounds: L.LatLngBounds = map.getBounds();
  
    this.markerClusterData.forEach(marker => {
      if (bounds.contains(marker.getLatLng())) {
        markerList.push(marker);
      }
    });
  
    this.markerService.setMarkers(markerList); // Update markers in the service
  }

  getSchools(): void {
    forkJoin([
      this.publicSchoolDataService.getPublicSchoolData(),
      this.privateSchoolDataService.getPrivateSchoolData()
    ]).subscribe(([publicSchools, privateSchools]) => {
      this.publicSchools = publicSchools;
      this.privateSchools = privateSchools;
      
      const publicMarkers = this.generateData(this.publicSchools);
      const privateMarkers = this.generateData(this.privateSchools);
  
      // Combine the markers from both sources into one array
      //this.markerClusterData = publicMarkers.concat(privateMarkers);

      this.markers = publicMarkers.concat(privateMarkers);
  
      //this.markerService.setMarkers(this.markerClusterData);
  
      console.log("Data loaded successfully.");
    });
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

  // private school list retrieval
  getPublicSchools(): void {
    console.log("getting public schools");
    this.publicSchoolDataService.getPublicSchoolData()
    .subscribe(publicSchools => {this.publicSchools = publicSchools;
    //this.showData(this.privateSchools);
    this.markerClusterData = this.generateData(this.publicSchools);
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

  private generateData(schoolData: PrivateSchool[] | PublicSchool[]): L.Marker[] {
    console.log("we've reached data generation!");
    const data: L.Marker[] = [];

    for (let school of schoolData) {
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
          school: school.School_Name
        };
        //console.log(`State should match: ${markerOptions.state}`);
        const marker = L.marker([school.Latitude, school.Longitude], markerOptions).bindPopup(`NAME: ${school.School_Name} <br> ADDRESS: ${school.Full_Address} <br> STATE: ${school.State_Name}`);
        data.push(marker);
        //console.log(school.School_Name);
      }
    }
    return data;
  }

}