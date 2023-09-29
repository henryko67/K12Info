import { TestBed } from '@angular/core/testing';

import { ActiveMarkerService } from './active-marker.service';

describe('ActiveMarkerService', () => {
  let service: ActiveMarkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveMarkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
