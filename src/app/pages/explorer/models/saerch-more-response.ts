import { LocationSearchResult } from "./location-search-result";
import { SchoolSearchResult } from "./school-search-result";
import { SearchPagination } from "./search-pagination";

export interface SearchMoreResponse {
  schools?: SchoolSearchResult[];
  locations?: LocationSearchResult[];
  pagination: Partial<SearchPagination>;
}