import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { CommentsApi } from '../../services/comments-api';
import { Auth } from '../../services/auth';
import { ProfileStore } from '../../services/profile-store';
import { UserApi } from '../../services/user-api';
import { WebSocketService } from '../../services/websocket';
import { Settings } from './settings';

describe('Settings initialization', () => {
  it('waits for resolved authentication and starts its initial loads once', async () => {
    const sessionResolved = signal(false);
    const isAuthenticated = signal(false);
    const getCurrentUserProfile = vi.fn().mockResolvedValue({ username: 'profile-user' });
    const getCurrentUserComments = vi.fn().mockResolvedValue({
      comments: [],
      hasMore: false,
      nextCursor: null,
    });

    TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: Auth, useValue: { sessionResolved, isAuthenticated } },
        { provide: ProfileStore, useValue: { username: signal(null), setUsername: vi.fn() } },
        { provide: UserApi, useValue: { getCurrentUserProfile } },
        { provide: CommentsApi, useValue: { getCurrentUserComments } },
        {
          provide: WebSocketService,
          useValue: { onCommentEvent: vi.fn(() => () => undefined) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    TestBed.createComponent(Settings);
    TestBed.flushEffects();

    expect(getCurrentUserProfile).not.toHaveBeenCalled();
    expect(getCurrentUserComments).not.toHaveBeenCalled();

    isAuthenticated.set(true);
    sessionResolved.set(true);
    TestBed.flushEffects();
    await Promise.resolve();

    expect(getCurrentUserProfile).toHaveBeenCalledOnce();
    expect(getCurrentUserComments).toHaveBeenCalledOnce();

    isAuthenticated.set(false);
    isAuthenticated.set(true);
    TestBed.flushEffects();

    expect(getCurrentUserProfile).toHaveBeenCalledOnce();
    expect(getCurrentUserComments).toHaveBeenCalledOnce();
  });
});
