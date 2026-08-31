import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExplorerSchool } from '../models/explorer-school';

@Service()
export class SchoolsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/schools';

  /** Loads a base school document by the `_id` used in application routes. */
  getSchoolById(sector: 'public' | 'private', id: string): Observable<ExplorerSchool> {
    return this.http.get<ExplorerSchool>(`${this.apiUrl}/${sector}/${id}`);
  }
}
