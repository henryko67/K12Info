import { Routes } from '@angular/router';

import { Explorer } from './pages/explorer/explorer';
import { About } from './pages/about/about';
import { SchoolDetails } from './pages/school-details/school-details';

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
    path: 'school/:sector/:id',
    component: SchoolDetails
  },
  {
    path: '**',
    redirectTo: ''
  }
];