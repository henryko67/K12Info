import { Service, signal, inject } from '@angular/core';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  autoSignIn
} from 'aws-amplify/auth';

import { UserApi } from './user-api';
import { ProfileStore } from './profile-store';

@Service()
export class Auth {
  readonly isAuthenticated = signal(false);
  readonly sessionResolved = signal(false);

  private readonly userApi = inject(UserApi);
  private readonly profileStore = inject(ProfileStore);

  private readonly authChannel = new BroadcastChannel('k12info-auth');

  constructor() {
    this.restoreSession();

    this.authChannel.onmessage = (event) => {
      if (event.data === 'SIGNED_IN') {
        this.isAuthenticated.set(true);
        this.sessionResolved.set(true);
      }

      if (event.data === 'SIGNED_OUT') {
        this.isAuthenticated.set(false);
        this.sessionResolved.set(true);
      }
    };
  }

  private async restoreSession(): Promise<void> {
    try {
      await getCurrentUser();
    } catch {
      this.profileStore.clear();
      this.isAuthenticated.set(false);
      this.sessionResolved.set(true);
      return;
    }

    try {
      
      const profile =
        await this.userApi.getCurrentUserProfile();

      if (!profile) {
        this.profileStore.clear();
        this.isAuthenticated.set(false);
        return;
      }

      this.profileStore.setUsername(
        profile.username
      );

      this.isAuthenticated.set(true);
    } catch (error) {
      console.error(
        'Unable to restore K12Info profile:',
        error
      );

      this.profileStore.clear();
      this.isAuthenticated.set(false);
    } finally {
      this.sessionResolved.set(true);
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<'SIGNED_IN' | 'CONFIRM_SIGN_UP'> {
    try {
      await getCurrentUser();

      // Cognito session already exists.
      // Let AuthModal continue into Mongo profile recovery.
      return 'SIGNED_IN';
    } catch {
      // No Cognito session. Perform a normal login.
    }

    const result = await signIn({
      username: email,
      password
    });

    if (result.isSignedIn) {

      return 'SIGNED_IN';
    }

    if (
      result.nextStep.signInStep ===
      'CONFIRM_SIGN_UP'
    ) {
      return 'CONFIRM_SIGN_UP';
    }

    throw new Error(
      `Unsupported sign-in step: ${result.nextStep.signInStep}`
    );
  }

  async signup(email: string, password: string): Promise<void> {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email
        },
        autoSignIn: true
      }
    });

    console.log(
      'Cognito confirmation step:',
      result.nextStep.signUpStep
    );

    console.log(
      'Full Cognito confirmation result:',
      result
    );
  }

  async confirmSignup(
    email: string,
    code: string
  ): Promise<boolean> {
    const result = await confirmSignUp({
      username: email,
      confirmationCode: code
    });

    console.log('Cognito confirmation result:', result);

    if (
      result.nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN'
    ) {
      const signInResult = await autoSignIn();

      console.log('Auto sign-in result:', signInResult);

      if (signInResult.nextStep.signInStep === 'DONE') {
        return true;
      }
    }

    return false;
  }

  async logout(): Promise<void> {
    await signOut();

    this.profileStore.clear();

    this.isAuthenticated.set(false);
    this.sessionResolved.set(true);

    this.authChannel.postMessage(
      'SIGNED_OUT'
    );
  }

  markAuthenticated(): void {
    this.isAuthenticated.set(true);
    this.sessionResolved.set(true);

    this.authChannel.postMessage(
      'SIGNED_IN'
    );
  }
}