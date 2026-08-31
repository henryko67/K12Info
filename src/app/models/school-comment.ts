/**
 * Public school-comment projection. Ownership is computed only when optional
 * authentication succeeds; the backend never exposes the stored `author_sub`.
 */
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
