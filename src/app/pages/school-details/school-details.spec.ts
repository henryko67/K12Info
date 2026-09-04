import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { CommentsApi } from '../../services/comments-api';
import { Auth } from '../../services/auth';
import { WebSocketService } from '../../services/websocket';
import { ExplorerSchool } from '../explorer/models/explorer-school';
import { PublicExplorerSchool } from '../explorer/models/public-explorer-school';
import { SchoolDetailsResponse } from '../explorer/models/school-details-response';
import { SchoolPreview } from '../explorer/components/school-preview/school-preview';
import { ExplorerStore } from '../explorer/services/explorer-store';
import { SchoolDetailsApi } from '../explorer/services/school-details-api';
import { SchoolsApi } from '../explorer/services/schools-api';
import { SchoolDetails } from './school-details';

describe('SchoolDetails comments', () => {
  it('immediately renders a created comment as owned and ignores its later realtime duplicate', async () => {
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

    const fixture = TestBed.createComponent(SchoolDetails);
    const component = fixture.componentInstance;
    await vi.waitFor(() => expect(component.school()).toEqual(school));
    TestBed.flushEffects();
    await vi.waitFor(() => expect(commentsApi.getSchoolComments).toHaveBeenCalled());

    component.commentText.set('New comment');
    await component.postComment();

    expect(component.comments()).toEqual([createdComment]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('details.comment-actions')).not.toBeNull();

    realtimeListener?.({ event: 'comment-created', data: { comment_id: createdComment._id } });
    await vi.waitFor(() => expect(commentsApi.getSchoolComments).toHaveBeenCalledTimes(2));

    expect(component.comments()).toEqual([createdComment]);
  });
});

describe('SchoolDetails expanded-detail reuse', () => {
  it('reuses details loaded in the preview when the full page opens for the same school', async () => {
    const school = publicSchool();
    const details = expandedDetails();
    const store = new ExplorerStore();
    const getDetails = vi.fn(() => of(details));
    const navigate = vi.fn();

    store.selectSchool(school);

    TestBed.configureTestingModule({
      imports: [SchoolPreview, SchoolDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => key === 'sector' ? 'public' : school._id },
            },
          },
        },
        { provide: Router, useValue: { navigate } },
        { provide: SchoolsApi, useValue: { getSchoolById: vi.fn(() => of(school)) } },
        { provide: SchoolDetailsApi, useValue: { getDetails } },
        { provide: ExplorerStore, useValue: store },
        {
          provide: CommentsApi,
          useValue: {
            getSchoolComments: vi.fn().mockResolvedValue({
              comments: [],
              hasMore: false,
              nextCursor: null,
            }),
          },
        },
        {
          provide: WebSocketService,
          useValue: {
            onCommentEvent: vi.fn(() => () => undefined),
            subscribeSchool: vi.fn(() => () => undefined),
          },
        },
        { provide: Auth, useValue: { isAuthenticated: signal(false) } },
      ],
    });

    const preview = TestBed.createComponent(SchoolPreview).componentInstance;
    preview.onMoreDetails();

    expect(preview.expandedDetails()).toBe(details);
    expect(getDetails).toHaveBeenCalledOnce();
    expect(getDetails).toHaveBeenCalledWith(school.ids.ncessch);

    preview.openSchoolDetails();
    expect(navigate).toHaveBeenCalledWith(['/school', school.sector, school._id]);

    const fullPage = TestBed.createComponent(SchoolDetails).componentInstance;
    await vi.waitFor(() => expect(fullPage.expandedDetails()).toBe(details));

    expect(getDetails).toHaveBeenCalledOnce();
  });

  it('fetches and uses expanded details when the full page opens without cached data', async () => {
    const school = publicSchool();
    const details = expandedDetails();
    const store = new ExplorerStore();
    const getDetails = vi.fn(() => of(details));

    TestBed.configureTestingModule({
      imports: [SchoolDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => key === 'sector' ? 'public' : school._id },
            },
          },
        },
        { provide: SchoolsApi, useValue: { getSchoolById: vi.fn(() => of(school)) } },
        { provide: SchoolDetailsApi, useValue: { getDetails } },
        { provide: ExplorerStore, useValue: store },
        {
          provide: CommentsApi,
          useValue: {
            getSchoolComments: vi.fn().mockResolvedValue({
              comments: [],
              hasMore: false,
              nextCursor: null,
            }),
          },
        },
        {
          provide: WebSocketService,
          useValue: {
            onCommentEvent: vi.fn(() => () => undefined),
            subscribeSchool: vi.fn(() => () => undefined),
          },
        },
        { provide: Auth, useValue: { isAuthenticated: signal(false) } },
      ],
    });

    const fullPage = TestBed.createComponent(SchoolDetails).componentInstance;
    await vi.waitFor(() => expect(fullPage.expandedDetails()).toBe(details));

    expect(getDetails).toHaveBeenCalledOnce();
    expect(getDetails).toHaveBeenCalledWith(school.ids.ncessch);
    expect(store.schoolDetails()).toEqual({
      ncessch: school.ids.ncessch,
      details,
    });
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

function publicSchool(): PublicExplorerSchool {
  return {
    _id: 'public-school-1',
    school_name: 'Public School',
    sector: 'public',
    address: {
      location: {
        street: '2 Main St',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
        state_name: 'Washington',
      },
      mailing: {
        street: '2 Main St',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
      },
    },
    location: { type: 'Point', coordinates: [-122.34, 47.62] },
    ids: {
      school_id: 'public-source-1',
      ncessch: '123456789012',
      ncessch_num: 123456789012,
      leaid: '1234567',
      state_leaid: 'WA-1',
      seasch: '1',
    },
    sources: {
      ccd: { name: 'CCD', abbreviation: 'CCD', year: 2023 },
      crdc: { name: 'CRDC', abbreviation: 'CRDC', year: 2022, matched: true },
    },
  };
}

function expandedDetails(): SchoolDetailsResponse {
  return {
    teachersStaff: null,
    discipline: null,
  };
}
