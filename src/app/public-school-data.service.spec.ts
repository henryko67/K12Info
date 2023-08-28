import { TestBed } from '@angular/core/testing';

import { PublicSchoolDataService } from './public-school-data.service';

describe('PrivateSchoolDataService', () => {
  let service: PublicSchoolDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicSchoolDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
