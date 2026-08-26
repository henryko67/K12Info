import { TestBed } from '@angular/core/testing';
import { MapSearchApi } from './map-search-api';

describe('MapSearchApi', () => {
  let service: MapSearchApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapSearchApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
