import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationSchoolsResponse } from '../models/location-schools-response';

@Service()
export class LocationsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/locations';

  getSchoolsByLocation(
    locationId: string
  ): Observable<LocationSchoolsResponse> {
    return this.http.get<LocationSchoolsResponse>(
      `${this.apiUrl}/${locationId}/schools`
    );
  }
}