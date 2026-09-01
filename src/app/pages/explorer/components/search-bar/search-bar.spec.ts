import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';

import { SearchResponse } from '../../models/search-response';
import { ExplorerStore } from '../../services/explorer-store';
import { LocationsApi } from '../../services/locations-api';
import { SchoolsApi } from '../../services/schools-api';
import { SearchApi } from '../../services/search-api';
import { SearchBar } from './search-bar';

describe('SearchBar', () => {
  it('ignores a search response that arrives after a newer request', () => {
    const firstResponse = new Subject<SearchResponse>();
    const secondResponse = new Subject<SearchResponse>();
    const search = vi
      .fn()
      .mockReturnValueOnce(firstResponse)
      .mockReturnValueOnce(secondResponse);
    const store = new ExplorerStore();

    TestBed.configureTestingModule({
      imports: [SearchBar],
      providers: [
        { provide: SearchApi, useValue: { search, searchMore: vi.fn() } },
        { provide: LocationsApi, useValue: { getSchoolsByLocation: vi.fn(() => of(null)) } },
        { provide: SchoolsApi, useValue: { getSchoolById: vi.fn(() => of(null)) } },
        { provide: ExplorerStore, useValue: store },
      ],
    });

    const component = TestBed.createComponent(SearchBar).componentInstance;
    const first = response('first');
    const second = response('second');

    component.searchForm.controls.query.setValue('first');
    component.onSearch();
    component.searchForm.controls.query.setValue('second');
    component.onSearch();

    secondResponse.next(second);
    firstResponse.next(first);

    expect(store.searchResponse()).toBe(second);
  });
});

function response(id: string): SearchResponse {
  return {
    locations: [],
    schools: [
      {
        _id: id,
        school_name: id,
        sector: 'public',
        score: 1,
        paginationToken: id,
        address: {
          location: {
            street: '',
            city: '',
            state: '',
            zip: '',
            state_name: '',
          },
        },
      },
    ],
    pagination: {
      publicAfter: '',
      privateAfter: '',
      locationAfter: '',
      publicHasMore: false,
      privateHasMore: false,
      locationHasMore: false,
    },
  };
}
