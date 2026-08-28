import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'k12info-theme';

  readonly theme = signal<Theme>(this.getInitialTheme());

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.document.documentElement.dataset['theme'] = theme;

    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
      // The visual theme still works when storage is unavailable.
    }
  }

  private getInitialTheme(): Theme {
    const appliedTheme = this.document.documentElement.dataset['theme'];

    if (appliedTheme === 'light' || appliedTheme === 'dark') {
      return appliedTheme;
    }

    return 'light';
  }
}
