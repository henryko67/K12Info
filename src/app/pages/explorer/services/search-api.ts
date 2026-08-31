import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResponse } from '../models/search-response';
import { SearchMoreResponse } from '../models/search-more-response';

@Service()
export class SearchApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/search';

  /** Starts a combined school/location Atlas Search query. */
  search(query: string): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(this.apiUrl, {
      params: {
        q: query,
      },
    });
  }

  /**
   * Continues exactly one result category using its opaque Atlas Search token.
   * The query and category remain part of the request because each parameter
   * affects the result set and therefore any future cache key.
   */
  searchMore(
    query: string,
    type: 'public' | 'private' | 'location',
    after: string,
  ): Observable<SearchMoreResponse> {
    return this.http.get<SearchMoreResponse>(this.apiUrl, {
      params: {
        q: query,
        type,
        after,
      },
    });
  }
}
