import { SchoolAddress } from './school-address';
import { GeoLocation } from './geo-location';

export interface DisplaySchool {
  _id: string;
  school_name: string;
  address: SchoolAddress;
  location: GeoLocation;
  sector: 'public' | 'private';
}