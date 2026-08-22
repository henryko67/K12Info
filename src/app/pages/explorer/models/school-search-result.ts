import { SchoolAddress } from './school-address';
import { GeoLocation } from './geo-location';

export interface SchoolSearchResult {
    _id: string;
    school_name: string;
    address: SchoolAddress;
    location: GeoLocation;
    score: number;
    paginationToken: string;
    sector: 'public' | 'private';
}