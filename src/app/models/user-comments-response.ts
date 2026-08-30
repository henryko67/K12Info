import { UserComment } from "./user-comment";

export interface UserCommentsResponse {
  comments: UserComment[];
  hasMore: boolean;
  nextCursor: string | null;
}