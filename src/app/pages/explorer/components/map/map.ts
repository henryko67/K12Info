import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';

import { ExplorerStore } from '../../services/explorer-store';

import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map implements AfterViewInit, OnDestroy {

  private explorerStore = inject(ExplorerStore);

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [39.8283, -98.5795],
      4
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map.invalidateSize({ animate: false, pan: false });
      });

      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }
}
