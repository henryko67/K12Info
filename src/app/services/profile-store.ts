import { Service, signal } from '@angular/core';

/** Maintains the MongoDB-backed display username independently of Cognito identity. */
@Service()
export class ProfileStore {
  readonly username = signal<string | null>(null);

  private readonly profileChannel = new BroadcastChannel('k12info-profile');

  constructor() {
    // Profile edits and sign-out clear sibling tabs without persisting a second
    // source of truth in browser storage.
    this.profileChannel.onmessage = (event) => {
      if (event.data.type === 'USERNAME_UPDATED') {
        this.username.set(event.data.username);
      }

      if (event.data.type === 'PROFILE_CLEARED') {
        this.username.set(null);
      }
    };
  }

  setUsername(username: string): void {
    this.username.set(username);
  }

  updateUsername(username: string): void {
    this.username.set(username);

    this.profileChannel.postMessage({
      type: 'USERNAME_UPDATED',
      username,
    });
  }

  clear(): void {
    this.username.set(null);

    this.profileChannel.postMessage({
      type: 'PROFILE_CLEARED',
    });
  }
}
