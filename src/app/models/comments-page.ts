import { SchoolComment } from "./school-comment";

export interface CommentsPage {
  comments: SchoolComment[];
  hasMore: boolean;
  nextCursor: string | null;
}