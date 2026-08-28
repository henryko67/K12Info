import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  private readonly themeService = inject(ThemeService);

  readonly theme = this.themeService.theme;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
