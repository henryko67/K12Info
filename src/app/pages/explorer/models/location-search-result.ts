export interface LocationSearchResult {
    _id: string;
    city: string;
    state_name: string;
    type: 'city' | 'state';
    label: string;
    state: string;
    score: number;
    paginationToken: string;
}