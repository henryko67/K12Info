import { DisplaySchool } from "./display-school";

export interface SchoolSearchResult extends DisplaySchool {
  score: number;
  paginationToken: string;
}