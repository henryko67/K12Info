/** Opaque continuation state returned independently for each Atlas Search category. */
export interface SearchPagination {
  publicAfter: string;
  privateAfter: string;
  locationAfter: string;
  publicHasMore: boolean;
  privateHasMore: boolean;
  locationHasMore: boolean;
}
