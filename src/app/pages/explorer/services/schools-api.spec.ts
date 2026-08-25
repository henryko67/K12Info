import { TestBed } from '@angular/core/testing';
import { SchoolsApi } from './schools-api';

describe('SchoolsApi', () => {
  let service: SchoolsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchoolsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
