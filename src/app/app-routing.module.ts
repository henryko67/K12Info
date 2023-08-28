import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapDisplayComponent } from './map-display/map-display.component';

const routes: Routes = [
  { path: 'map', component: MapDisplayComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }