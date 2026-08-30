import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { Auth } from './services/auth';
import { UserApi } from './services/user-api';
import { ExplorerStore } from './pages/explorer/services/explorer-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    Auth,
    UserApi,
    ExplorerStore
  ]
};