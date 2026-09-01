import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CommentsApi } from '../../services/comments-api';
import { Auth } from '../../services/auth';
import { WebSocketService } from '../../services/websocket';
import { ExplorerSchool } from '../explorer/models/explorer-school';
import { ExplorerStore } from '../explorer/services/explorer-store';
import { SchoolDetailsApi } from '../explorer/services/school-details-api';
import { SchoolsApi } from '../explorer/services/schools-api';
import { SchoolDetails } from './school-details';

describe('SchoolDetails comments', () => {
  it('inserts a created comment immediately and ignores its later realtime duplicate', async () => {
    const school = privateSchool();
    const createdComment = {
      _id: 'comment-1',
      school_id: school._id,
      sector: 'private' as const,
      text: 'New comment',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      is_owner: true,
    };
    let realtimeListener: ((event: { event: 'comment-created'; data: { comment_id: string } }) => void)
      | undefined;
    const commentsApi = {
      getSchoolComments: vi
        .fn()
        .mockResolvedValueOnce({ comments: [], hasMore: false, nextCursor: null })
        .mockResolvedValue({ comments: [createdComment], hasMore: false, nextCursor: null }),
      createComment: vi.fn().mockResolvedValue(createdComment),
      deleteComment: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [SchoolDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => key === 'sector' ? 'private' : school._id } } },
        },
        { provide: SchoolsApi, useValue: { getSchoolById: vi.fn(() => of(school)) } },
        { provide: SchoolDetailsApi, useValue: { getDetails: vi.fn() } },
        { provide: ExplorerStore, useValue: new ExplorerStore() },
        { provide: CommentsApi, useValue: commentsApi },
        {
          provide: WebSocketService,
          useValue: {
            onCommentEvent: vi.fn((listener) => {
              realtimeListener = listener;
              return () => undefined;
            }),
            subscribeSchool: vi.fn(() => () => undefined),
          },
        },
        { provide: Auth, useValue: { isAuthenticated: signal(true) } },
      ],
    });

    const component = TestBed.createComponent(SchoolDetails).componentInstance;
    await vi.waitFor(() => expect(component.school()).toEqual(school));
    TestBed.flushEffects();
    await vi.waitFor(() => expect(commentsApi.getSchoolComments).toHaveBeenCalled());

    component.commentText.set('New comment');
    await component.postComment();

    expect(component.comments()).toEqual([createdComment]);

    realtimeListener?.({ event: 'comment-created', data: { comment_id: createdComment._id } });
    await vi.waitFor(() => expect(commentsApi.getSchoolComments).toHaveBeenCalledTimes(2));

    expect(component.comments()).toEqual([createdComment]);
  });
});

function privateSchool(): ExplorerSchool {
  return {
    _id: 'school-1',
    school_name: 'Private School',
    sector: 'private',
    address: {
      location: {
        street: '1 Main St',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
        state_name: 'Washington',
      },
    },
    location: { type: 'Point', coordinates: [-122.33, 47.61] },
    ids: { school_id: 'source-1', nces_id: 'A123' },
    sources: { nces: { name: 'PSS', abbreviation: 'PSS', year: 2021 } },
  };
}
