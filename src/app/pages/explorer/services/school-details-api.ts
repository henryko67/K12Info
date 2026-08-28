import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SchoolDetailsResponse } from '../models/school-details-response';

@Service()
export class SchoolDetailsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/schools';

  getDetails(
    ncessch: string
  ): Observable<SchoolDetailsResponse> {
    return this.http.get<SchoolDetailsResponse>(
      `${this.apiUrl}/public/${ncessch}/details`
    );
  }
}