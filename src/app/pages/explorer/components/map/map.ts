import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  Injector,
  effect
} from '@angular/core';

import { ExplorerStore } from '../../services/explorer-store';

import { MapSearchApi } from '../../services/map-search-api';

import type * as Leaflet from 'leaflet';

const L = (window as typeof window & { L: typeof Leaflet }).L;

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map implements AfterViewInit, OnDestroy {
  
  private readonly injector = inject(Injector);

  private explorerStore = inject(ExplorerStore);

  //readonly displayedSchools = this.explorerStore.displayedSchools;
  readonly displayedSchools = this.explorerStore.filteredSchools;

  //Marker cluster code

  private readonly markerClusterGroup: Leaflet.MarkerClusterGroup =
    L.markerClusterGroup({
      disableClusteringAtZoom: 12
    });
  
  private renderMarkers(): void {
    this.markerClusterGroup.clearLayers();
    this.schoolMarkers.clear();

    const schools = this.displayedSchools();

    for (const school of schools) {
      const [longitude, latitude] = school.location.coordinates;
      const marker = L.marker([latitude, longitude], {icon: this.normalMarkerIcon});
      marker.on('click', () => {
        this.explorerStore.selectSchool(school);
        this.explorerStore.focusSchool(school);
      });
      this.schoolMarkers.set(school._id, marker);
      this.markerClusterGroup.addLayer(marker);
    }

    if (schools.length > 1) {
      const coordinates: Leaflet.LatLngExpression[] = schools.map(school => {
        const [longitude, latitude] = school.location.coordinates;
        return [latitude, longitude];
      });

      const bounds = L.latLngBounds(coordinates);

      this.map.fitBounds(bounds, {
        padding: [50, 50]
      });

    } else if (schools.length === 1) {
      const [longitude, latitude] = schools[0].location.coordinates;

      this.map.setView([latitude, longitude], 14);
    }
  }

  //Map generation basic code and settings

  private readonly osmLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }
  );

  private readonly satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri and contributors',
      maxZoom: 19
    }
  );

  private readonly baseLayers: Leaflet.Control.LayersObject = {
    'OpenStreetMap': this.osmLayer,
    'Satellite': this.satelliteLayer
  };

  private readonly layersControlOptions: Leaflet.Control.LayersOptions = {
    position: 'topright',
    collapsed: false
  };

  private readonly initialCenter: Leaflet.LatLngExpression = [
    40.967243,
    -95.771556
  ];

  private readonly initialZoom = 4;

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<HTMLDivElement>;

  private map!: Leaflet.Map;
  private resizeObserver?: ResizeObserver;

  // Focusing on marker

  readonly selectedSchool = this.explorerStore.selectedSchool;

  // 1. Leaflet icon definitions
  private readonly schoolMarkers = new globalThis.Map<string, Leaflet.Marker>();

  private readonly normalMarkerIcon = L.icon({
    iconUrl: '/markers/marker-icon.png',
    iconRetinaUrl: '/markers/marker-icon-2x.png',
    shadowUrl: '/markers/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });

  private readonly selectedMarkerIcon = L.icon({
    iconUrl: '/markers/marker-icon-selected.png',
    iconRetinaUrl: '/markers/marker-icon-2x-selected.png',
    shadowUrl: '/markers/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });

  private updateSelectedMarker(): void {
    const selectedSchool = this.selectedSchool();

    for (const [schoolId, marker] of this.schoolMarkers) {
      if (selectedSchool !== null && schoolId === selectedSchool._id) {
        marker.setIcon(this.selectedMarkerIcon);
      } else {
        marker.setIcon(this.normalMarkerIcon);
      }
    }
  }

  readonly focusRequest = this.explorerStore.focusRequest;

  private focusRequestedSchool(): void {
    const request = this.focusRequest();

    if (request === null) {
      return;
    }

    const [longitude, latitude] =
      request.school.location.coordinates;

    this.map.setView([latitude, longitude], 14);
  }

  //Search area button

  private readonly mapSearchApi = inject(MapSearchApi);

onSearchThisArea(): void {
  const bounds = this.map.getBounds();

  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  this.mapSearchApi
    .searchByBounds(north, south, east, west)
    .subscribe(response => {
      const schools = [
        ...response.publicResults,
        ...response.privateResults
      ];

      this.explorerStore.clearSelectedSchool();
      this.explorerStore.closePreview();
      this.explorerStore.setDisplayedSchools(schools);
    });
}

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.initialCenter,
      zoom: this.initialZoom,
      minZoom: 3,
      maxZoom: 19,
      layers: [this.osmLayer]
    });

    L.control
      .layers(
        this.baseLayers,
        undefined,
        this.layersControlOptions
      )
      .addTo(this.map);

    this.markerClusterGroup.addTo(this.map);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map.invalidateSize({ animate: false, pan: false });
      });

      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }

    effect(() => {
      this.renderMarkers();
    },
    { injector: this.injector });

    effect(() => {
      this.updateSelectedMarker();
    }, 
    { injector: this.injector });

    effect(
      () => {
        this.focusRequestedSchool();
      },
      { injector: this.injector }
    );
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }
}
