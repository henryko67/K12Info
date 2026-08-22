import { TestBed } from '@angular/core/testing';
import { SearchApi } from './search-api';

describe('SearchApi', () => {
  let service: SearchApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
