import { TestBed } from '@angular/core/testing';
import { ExplorerStore } from '../explorer-store';

describe('ExplorerStore', () => {
  let service: ExplorerStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExplorerStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
