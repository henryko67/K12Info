import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationSchoolsResponse } from '../models/location-schools-response';

@Service()
export class MapSearchApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/map-search';

  searchByBounds(
    north: number,
    south: number,
    east: number,
    west: number
  ): Observable<LocationSchoolsResponse> {
    return this.http.get<LocationSchoolsResponse>(
      this.apiUrl,
      {
        params: {
          north,
          south,
          east,
          west
        }
      }
    );
  }
}