import { Routes } from '@angular/router';

import { Explorer } from './pages/explorer/explorer';
import { About } from './pages/about/about';
import { SchoolDetails } from './pages/school-details/school-details';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
  {
    path: '',
    component: Explorer
  },
  {
    path: 'location/:type/:id',
    component: Explorer
  },
  {
    path: 'about',
    component: About
  },
  {
    // SchoolDetails can hydrate itself from the URL when no Explorer selection
    // survives a refresh or direct link.
    path: 'school/:sector/:id',
    component: SchoolDetails
  },
  {
    path: 'settings',
    component: Settings
  },
  {
    path: '**',
    redirectTo: ''
  }
];
