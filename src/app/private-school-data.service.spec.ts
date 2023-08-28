import { TestBed } from '@angular/core/testing';

import { PrivateSchoolDataService } from './private-school-data.service';

describe('PrivateSchoolDataService', () => {
  let service: PrivateSchoolDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrivateSchoolDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
