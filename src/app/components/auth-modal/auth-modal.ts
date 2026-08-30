import { Component, HostListener, inject, output, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { Auth } from '../../services/auth';
import { UserApi } from '../../services/user-api';
import { ProfileStore } from '../../services/profile-store';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css'
})
export class AuthModal {
  private readonly auth = inject(Auth);
  private readonly userApi = inject(UserApi);
  private readonly profileStore = inject(ProfileStore);
  readonly closed = output<void>();

  readonly mode = signal<'login' | 'signup' | 'verify' | 'complete-profile'>('login');

  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly loading = signal(false);

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email
      ]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required
      ]
    })
  });

  close(): void {
    this.closed.emit();
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Please check your email and password.');
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loading.set(true);

    try {
      const result =
        await this.auth.login(
          email.trim(),
          password
        );

      if (result === 'CONFIRM_SIGN_UP') {
        this.pendingEmail.set(email.trim());

        sessionStorage.setItem(
          'authPendingVerification',
          'true'
        );

        this.mode.set('verify');

        this.successMessage.set(
          'Please enter the verification code sent to your email.'
        );

        return;
      }

      const profile =
        await this.userApi.getCurrentUserProfile();

      if (profile) {
        this.profileStore.setUsername(
          profile.username
        );
      } else  {
        const pendingUsername =
          this.getPendingSignup()?.username;

        if (pendingUsername) {
          const createdProfile =
            await this.userApi.createUserProfile(
              pendingUsername
            );

          this.profileStore.setUsername(
            createdProfile.username
          );
        } else {
          this.mode.set('complete-profile');
          return;
        }
      }

      this.clearPendingSignup();

      this.auth.markAuthenticated();

      this.successMessage.set(
        'Logged in successfully.'
      );

    } catch (error: any) {
      console.error(error);

      if (error.name === 'NotAuthorizedException') {
        this.errorMessage.set('Incorrect email or password.');
      } else {
        this.errorMessage.set(
          'Unable to log in. Please try again.'
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  readonly pendingEmail = signal('');

  readonly signupForm = new FormGroup({
    displayUsername: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email
      ]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required
      ]
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required
      ]
    })
  });

  readonly verifyForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required
      ]
    })
  });

  constructor() {
    const pendingSignup =
      this.getPendingSignup();

    const wasVerifying =
      sessionStorage.getItem(
        'authPendingVerification'
      ) === 'true';

    if (pendingSignup && wasVerifying) {
      this.pendingEmail.set(
        pendingSignup.email
      );

      this.mode.set('verify');
    }
  }

  async signup(): Promise<void> {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.errorMessage.set('Please check the form fields.');
      return;
    }

    const {
      displayUsername,
      email,
      password,
      confirmPassword
    } = this.signupForm.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loading.set(true);

    try {
      // Check K12Info/Mongo username availability
      const available =
        await this.userApi.checkUsernameAvailability(
          displayUsername.trim()
        );

      if (!available) {
        this.errorMessage.set('Username is already taken.');
        return;
      }

      // Then create the Cognito account
      await this.auth.signup(email.trim(), password);

      this.savePendingSignup(
        email.trim(),
        displayUsername.trim()
      );

      sessionStorage.setItem(
        'authPendingVerification',
        'true'
      );

      this.pendingEmail.set(email.trim());
      this.mode.set('verify');

    } catch (error: any) {
      console.error(error);

      if (error.name === 'InvalidPasswordException') {
        this.errorMessage.set(
          'Password does not meet the required password rules.'
        );
      } else if (error.name === 'UsernameExistsException') {
        this.errorMessage.set(
          'An account with this email already exists.'
        );
      } else if (error.name === 'InvalidParameterException') {
        this.errorMessage.set(
          'Please check your account information and try again.'
        );
      } else {
        this.errorMessage.set(
          'Unable to create account. Please try again.'
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  async verify(): Promise<void> {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      this.errorMessage.set('Please enter the verification code.');
      return;
    }

    const { code } = this.verifyForm.getRawValue();
    const email = this.pendingEmail();

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loading.set(true);

    try {
      const signedIn =
        await this.auth.confirmSignup(
          email,
          code.trim()
        );
      if (!signedIn) {
        this.successMessage.set(
          'Email verified. Please log in to finish creating your account.'
        );

        this.mode.set('login');
        return;
      }

      const pendingSignup = this.getPendingSignup();

      if (!pendingSignup) {
        this.mode.set('complete-profile');
        return;
      }


      const createdProfile =
        await this.userApi.createUserProfile(
          pendingSignup.username
        );

      this.profileStore.setUsername(
        createdProfile.username
      );

      this.clearPendingSignup();

      this.auth.markAuthenticated();

      this.successMessage.set(
        'Account created successfully.'
      );
    } catch (error: any) {
      console.error(error);

      if (error.name === 'CodeMismatchException') {
        this.errorMessage.set('That verification code is incorrect.');
      } else if (error.name === 'ExpiredCodeException') {
        this.errorMessage.set('That verification code has expired.');
      } else {
        this.errorMessage.set('Unable to verify your email.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private savePendingSignup(
    email: string,
    username: string
  ): void {
    localStorage.setItem(
      'pendingSignup',
      JSON.stringify({
        email,
        username
      })
    );
  }

  private getPendingSignup(): {
    email: string;
    username: string;
  } | null {
    const stored = localStorage.getItem('pendingSignup');

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch {
      this.clearPendingSignup();
      return null;
    }
  }

  private clearPendingSignup(): void {
    localStorage.removeItem('pendingSignup');

    sessionStorage.removeItem(
      'authPendingVerification'
    );
  }

  readonly completeProfileForm = new FormGroup({
    displayUsername: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]
    })
  });

  async completeProfile(): Promise<void> {
    if (this.completeProfileForm.invalid) {
      this.completeProfileForm.markAllAsTouched();
      this.errorMessage.set('Please enter a valid username.');
      return;
    }

    const { displayUsername } =
      this.completeProfileForm.getRawValue();

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loading.set(true);

    try {
      const available =
        await this.userApi.checkUsernameAvailability(
          displayUsername.trim()
        );

      if (!available) {
        this.errorMessage.set('Username is already taken.');
        return;
      }

      const createdProfile =
        await this.userApi.createUserProfile(
          displayUsername.trim()
        );

      this.profileStore.setUsername(
        createdProfile.username
      );

      this.clearPendingSignup();

      this.auth.markAuthenticated();

      this.successMessage.set(
        'Account setup completed successfully.'
      );

    } catch (error: any) {
      console.error(error);

      this.errorMessage.set(
        'Unable to complete account setup. Please try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent): void {
    if (
      event.key === 'pendingSignup' &&
      event.newValue === null &&
      this.mode() === 'verify'
    ) {
      this.mode.set('login');
      this.pendingEmail.set('');
      this.successMessage.set(
        'Email verification completed. You can log in.'
      );
    }
  }
}