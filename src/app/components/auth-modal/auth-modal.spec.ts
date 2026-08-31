import { TestBed } from '@angular/core/testing';

import { Auth } from '../../services/auth';
import { ProfileStore } from '../../services/profile-store';
import { UserApi } from '../../services/user-api';
import { AuthModal } from './auth-modal';

describe('AuthModal password reset', () => {
  const auth = {
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
  };

  function createComponent(): AuthModal {
    TestBed.configureTestingModule({
      imports: [AuthModal],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: UserApi, useValue: {} },
        { provide: ProfileStore, useValue: {} },
      ],
    });

    return TestBed.createComponent(AuthModal).componentInstance;
  }

  beforeEach(() => {
    auth.requestPasswordReset.mockReset();
    auth.confirmPasswordReset.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('opens the forgot-password form with the login email', () => {
    const component = createComponent();
    component.loginForm.controls.email.setValue('person@example.com');

    component.showForgotPassword();

    expect(component.mode()).toBe('forgot-password');
    expect(component.forgotPasswordForm.controls.email.value).toBe('person@example.com');
  });

  it('requests a reset code and advances to password confirmation', async () => {
    auth.requestPasswordReset.mockResolvedValue('CONFIRM_RESET_PASSWORD_WITH_CODE');
    const component = createComponent();
    component.forgotPasswordForm.controls.email.setValue('person@example.com');

    await component.requestPasswordReset();

    expect(auth.requestPasswordReset).toHaveBeenCalledWith('person@example.com');
    expect(component.passwordResetEmail()).toBe('person@example.com');
    expect(component.mode()).toBe('reset-password');
    expect(component.successMessage()).toContain('reset code');
  });

  it('does not request a code for an invalid email', async () => {
    const component = createComponent();
    component.forgotPasswordForm.controls.email.setValue('not-an-email');

    await component.requestPasswordReset();

    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Please enter a valid email address.');
  });

  it('shows an account-specific error when Cognito cannot find the email', async () => {
    auth.requestPasswordReset.mockRejectedValue({ name: 'UserNotFoundException' });
    const component = createComponent();
    component.mode.set('forgot-password');
    component.forgotPasswordForm.controls.email.setValue('missing@example.com');

    await component.requestPasswordReset();

    expect(component.errorMessage()).toBe('No account was found for that email address.');
    expect(component.mode()).toBe('forgot-password');
  });

  it('does not confirm reset when the new passwords differ', async () => {
    const component = createComponent();
    component.passwordResetEmail.set('person@example.com');
    component.resetPasswordForm.setValue({
      code: '123456',
      newPassword: 'NewPassword1!',
      confirmPassword: 'DifferentPassword1!',
    });

    await component.confirmPasswordReset();

    expect(auth.confirmPasswordReset).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Passwords do not match.');
  });

  it('confirms the password reset and returns to login', async () => {
    auth.confirmPasswordReset.mockResolvedValue(undefined);
    const component = createComponent();
    component.mode.set('reset-password');
    component.passwordResetEmail.set('person@example.com');
    component.resetPasswordForm.setValue({
      code: ' 123456 ',
      newPassword: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    });

    await component.confirmPasswordReset();

    expect(auth.confirmPasswordReset).toHaveBeenCalledWith(
      'person@example.com',
      '123456',
      'NewPassword1!',
    );
    expect(component.mode()).toBe('login');
    expect(component.loginForm.controls.email.value).toBe('person@example.com');
    expect(component.successMessage()).toBe('Password reset successfully. You can now log in.');
  });

  it.each([
    ['CodeMismatchException', 'That verification code is incorrect.'],
    ['ExpiredCodeException', 'That verification code has expired. Request a new code.'],
    ['InvalidPasswordException', 'Password does not meet the required password rules.'],
  ])('maps %s to a useful confirmation error', async (name, expectedMessage) => {
    auth.confirmPasswordReset.mockRejectedValue({ name });
    const component = createComponent();
    component.mode.set('reset-password');
    component.passwordResetEmail.set('person@example.com');
    component.resetPasswordForm.setValue({
      code: '123456',
      newPassword: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    });

    await component.confirmPasswordReset();

    expect(component.errorMessage()).toBe(expectedMessage);
    expect(component.mode()).toBe('reset-password');
  });
});
