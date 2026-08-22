import { LocationSearchResult } from "./location-search-result";
import { SchoolSearchResult } from "./school-search-result";
import { SearchPagination } from "./search-pagination";

export interface SearchResponse {
    locations: LocationSearchResult[];
    schools: SchoolSearchResult[];
    pagination: SearchPagination;
}