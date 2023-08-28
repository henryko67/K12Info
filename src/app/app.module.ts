import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@asymmetrik/ngx-leaflet-markercluster';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapDisplayComponent } from './map-display/map-display.component';
import { SchoolListComponent } from './school-list/school-list.component';

@NgModule({
  declarations: [
    AppComponent,
    MapDisplayComponent,
    SchoolListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LeafletModule,
    LeafletMarkerClusterModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
