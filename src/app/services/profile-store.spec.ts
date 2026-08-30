import { TestBed } from '@angular/core/testing';
import { ProfileStore } from './profile-store';

describe('ProfileStore', () => {
  let service: ProfileStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
