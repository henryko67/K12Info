import { ExplorerSchoolBase } from './explorer-school-base';

export interface PrivateExplorerSchool
  extends ExplorerSchoolBase {

  sector: 'private';

  ids: {
    school_id: string;
    nces_id: string;
  };

  classification?: ExplorerSchoolBase['classification'] & {
    religious_affiliation?: number;
    religion?: string;
  };

  enrollment?: ExplorerSchoolBase['enrollment'] & {
    by_grade?: {
      kindergarten?: number;
      grade_1?: number;
      grade_2?: number;
      grade_3?: number;
      grade_4?: number;
      grade_5?: number;
      grade_6?: number;
      grade_7?: number;
      grade_8?: number;
      grade_9?: number;
      grade_10?: number;
      grade_11?: number;
      grade_12?: number;
    };

    grade_bands?: {
      grades_1_to_8?: number;
      grades_9_to_12?: number;
    };
  };

  operations?: {
    school_day_hours?: number;
    school_days_per_year?: number;
  };

  facilities?: {
    library_media_center?: number;
  };

  geography?: ExplorerSchoolBase['geography'] & {
    state_name?: string;
  };

  sources: {
    nces: {
      name: string;
      abbreviation: string;
      year: number;
    };
  };
}