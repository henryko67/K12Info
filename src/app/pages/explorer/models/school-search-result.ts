import { SchoolSummary } from "./school-summary";

export interface SchoolSearchResult extends SchoolSummary {
  score: number;
  paginationToken: string;
}