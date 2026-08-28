import { TestBed } from '@angular/core/testing';
import { SchoolDetailsApi } from './school-details-api';

describe('SchoolDetailsApi', () => {
  let service: SchoolDetailsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchoolDetailsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
