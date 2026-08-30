export interface UserComment {
  _id: string;
  school_id: string;
  school_name: string;
  sector: 'public' | 'private';
  text: string;
  created_at: string;
  updated_at: string;
}