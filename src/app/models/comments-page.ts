import { SchoolComment } from './school-comment';

/** A cursor page ordered deterministically by `created_at` and `_id`. */
export interface CommentsPage {
  comments: SchoolComment[];
  hasMore: boolean;
  nextCursor: string | null;
}
