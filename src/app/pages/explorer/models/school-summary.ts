import { SchoolAddress } from './school-address';

export interface SchoolSummary {
  _id: string;
  school_name: string;
  address: SchoolAddress;
  sector: 'public' | 'private';
}
