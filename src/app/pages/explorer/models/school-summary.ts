import { SchoolAddress } from './school-address';
import { GeoLocation } from './geo-location';

export interface SchoolSummary {
  _id: string;
  school_name: string;
  address: SchoolAddress;
  sector: 'public' | 'private';
}