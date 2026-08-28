import { TeachersStaffDetails } from "./teacher-staff-details";
import { DisciplineDetails } from "./discipline-details";

export interface SchoolDetailsResponse {
  teachersStaff: TeachersStaffDetails | null;
  discipline: DisciplineDetails | null;
}