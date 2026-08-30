import { TestBed } from '@angular/core/testing';
import { CommentsApi } from './comments-api';

describe('CommentsApi', () => {
  let service: CommentsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
