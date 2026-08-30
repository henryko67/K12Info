export interface SchoolComment {
  _id: string;
  school_id: string;
  sector: 'public' | 'private';
  text: string;
  created_at: string;
  updated_at: string;

  author?: {
    username?: string;
  };

  is_owner: boolean;
}