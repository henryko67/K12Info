import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme';

import { Auth } from '../../services/auth';
import { AuthModal } from '../auth-modal/auth-modal';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, AuthModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  private readonly themeService = inject(ThemeService);
  readonly auth = inject(Auth);

  readonly theme = this.themeService.theme;
  readonly authOpen = signal(false);
  readonly accountOpen = signal(false);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openAuth(): void {
    this.authOpen.set(true);
  }

  closeAuth(): void {
    this.authOpen.set(false);
  }

  toggleAccount(): void {
    this.accountOpen.update(open => !open);
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      this.accountOpen.set(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}
