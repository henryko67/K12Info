import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { fetchAuthSession } from 'aws-amplify/auth';

import { CommentsApi } from './comments-api';

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

describe('CommentsApi', () => {
  beforeEach(() => {
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        accessToken: { toString: () => 'access-token' },
      },
    } as never);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CommentsApi],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('normalizes a newly posted comment as owned by its authenticated caller', async () => {
    const commentsApi = TestBed.inject(CommentsApi);
    const http = TestBed.inject(HttpTestingController);
    const resultPromise = commentsApi.createComment('public', 'school-1', 'New comment');

    await Promise.resolve();

    const request = http.expectOne('/api/schools/public/school-1/comments');

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');

    request.flush({
      message: 'Comment created successfully',
      comment: {
        _id: 'comment-1',
        school_id: 'school-1',
        sector: 'public',
        text: 'New comment',
        created_at: '2026-09-04T00:00:00.000Z',
        updated_at: '2026-09-04T00:00:00.000Z',
        author: { username: 'Henry' },
      },
    });

    await expect(resultPromise).resolves.toEqual({
      _id: 'comment-1',
      school_id: 'school-1',
      sector: 'public',
      text: 'New comment',
      created_at: '2026-09-04T00:00:00.000Z',
      updated_at: '2026-09-04T00:00:00.000Z',
      author: { username: 'Henry' },
      is_owner: true,
    });
  });
});
