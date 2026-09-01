import { TestBed } from '@angular/core/testing';
import { getCurrentUser } from 'aws-amplify/auth';

import { Auth } from './auth';
import { ProfileStore } from './profile-store';
import { UserApi } from './user-api';

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  autoSignIn: vi.fn(),
  resetPassword: vi.fn(),
  confirmResetPassword: vi.fn(),
}));

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(readonly name: string) {
    FakeBroadcastChannel.instances.push(this);
  }

  postMessage(): void {}
}

describe('Auth cross-tab synchronization', () => {
  beforeEach(() => {
    FakeBroadcastChannel.instances = [];
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resolves the MongoDB profile before accepting a sibling SIGNED_IN event', async () => {
    const getCurrentUserMock = vi.mocked(getCurrentUser);
    const getCurrentUserProfile = vi.fn();
    const setUsername = vi.fn();
    getCurrentUserMock.mockRejectedValueOnce(new Error('signed out'));

    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: UserApi, useValue: { getCurrentUserProfile } },
        { provide: ProfileStore, useValue: { setUsername, clear: vi.fn() } },
      ],
    });

    const auth = TestBed.inject(Auth);
    await vi.waitFor(() => expect(auth.sessionResolved()).toBe(true));

    getCurrentUserMock.mockResolvedValue({ username: 'cognito-user', userId: 'sub' });
    getCurrentUserProfile.mockResolvedValue({ username: 'mongo-user' });

    FakeBroadcastChannel.instances[0].onmessage?.(
      new MessageEvent('message', { data: 'SIGNED_IN' }),
    );

    expect(auth.sessionResolved()).toBe(false);
    expect(auth.isAuthenticated()).toBe(false);

    await vi.waitFor(() => expect(auth.sessionResolved()).toBe(true));

    expect(getCurrentUserProfile).toHaveBeenCalledOnce();
    expect(setUsername).toHaveBeenCalledWith('mongo-user');
    expect(auth.isAuthenticated()).toBe(true);
  });
});
