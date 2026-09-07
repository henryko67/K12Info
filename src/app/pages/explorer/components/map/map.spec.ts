vi.hoisted(() => {
  const layer = { addTo: vi.fn() };

  Object.assign(window, {
    L: {
      markerClusterGroup: vi.fn(() => ({
        addLayer: vi.fn(),
        addTo: vi.fn(),
        clearLayers: vi.fn(),
      })),
      tileLayer: vi.fn(() => layer),
      icon: vi.fn(() => ({})),
    },
  });
});

import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { ExplorerStore } from '../../services/explorer-store';
import { MapSearchApi } from '../../services/map-search-api';
import { LocationSchoolsResponse } from '../../models/location-schools-response';
import { Map } from './map';

describe('Map area search', () => {
  it('disables repeat searches until the current area request completes', () => {
    const response = new Subject<LocationSchoolsResponse>();
    const searchByBounds = vi.fn(() => response);

    TestBed.configureTestingModule({
      imports: [Map],
      providers: [
        ExplorerStore,
        { provide: MapSearchApi, useValue: { searchByBounds } },
      ],
    });

    const component = TestBed.createComponent(Map).componentInstance;
    const bounds = {
      getNorth: () => 48,
      getSouth: () => 47,
      getEast: () => -122,
      getWest: () => -123,
    };
    (component as unknown as {
      map: { getBounds: () => typeof bounds; remove: () => void };
    }).map = {
      getBounds: () => bounds,
      remove: vi.fn(),
    };

    component.onSearchThisArea();
    component.onSearchThisArea();

    expect(component.searchAreaLoading()).toBe(true);
    expect(searchByBounds).toHaveBeenCalledOnce();

    response.next({ publicResults: [], privateResults: [] });
    response.complete();

    expect(component.searchAreaLoading()).toBe(false);
  });
});
