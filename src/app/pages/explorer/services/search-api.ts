import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResponse } from '../models/search-response';
import { SearchMoreResponse } from '../models/saerch-more-response';

@Service()
export class SearchApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/search';

  search(query: string): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(
      this.apiUrl,
      {
        params: {
          q: query
        }
      }
    );
  }

  searchMore(query: string, type: 'public' | 'private' | 'location', after: string): Observable<SearchMoreResponse> {
    return this.http.get<SearchMoreResponse>(
        this.apiUrl,
        {
            params: {
                q: query,
                type,
                after
            }
        }
    );
  }
}