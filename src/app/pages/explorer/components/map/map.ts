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

import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map implements AfterViewInit, OnDestroy {
  
  private readonly injector = inject(Injector);

  private explorerStore = inject(ExplorerStore);

  readonly displayedSchools = this.explorerStore.displayedSchools;

  //Marker cluster code

  private readonly markerClusterGroup: L.MarkerClusterGroup =
    L.markerClusterGroup({
      disableClusteringAtZoom: 12
    });
  
  renderMarkers(): void {
    this.markerClusterGroup.clearLayers();

    const schools = this.displayedSchools();

    for (const school of schools) {
      const [longitude, latitude] = school.location.coordinates;
      const marker = L.marker([latitude, longitude]);
      marker.on('click', () => {
        this.explorerStore.selectSchool(school);
      });
      this.markerClusterGroup.addLayer(marker);
    }

    if (schools.length > 1) {
      const coordinates: L.LatLngExpression[] = schools.map(school => {
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

  private readonly baseLayers: L.Control.LayersObject = {
    'OpenStreetMap': this.osmLayer,
    'Satellite': this.satelliteLayer
  };

  private readonly layersControlOptions: L.Control.LayersOptions = {
    position: 'topright',
    collapsed: false
  };

  private readonly initialCenter: L.LatLngExpression = [
    40.967243,
    -95.771556
  ];

  private readonly initialZoom = 4;

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private resizeObserver?: ResizeObserver;

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
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }
}
