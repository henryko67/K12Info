import { ExplorerSchoolBase } from './explorer-school-base';

export interface PublicExplorerSchool extends ExplorerSchoolBase {
  sector: 'public';

  ids: {
    /** Source identifier retained separately from the MongoDB `_id`. */
    school_id: string;
    /** Public NCES identifier used to retrieve expanded CRDC details. */
    ncessch: string;
    ncessch_num: number;
    leaid: string;
    state_leaid: string;
    seasch: string;
  };

  address: ExplorerSchoolBase['address'] & {
    mailing: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };

  classification?: ExplorerSchoolBase['classification'] & {
    status?: number;
    charter?: number;
    shared_time?: number;
    virtual?: number;
  };

  lunch?: {
    program?: number;
    free?: number;
    reduced_price?: number;
    free_or_reduced_price?: number;
    direct_certification?: number;
  };

  program_enrollment?: {
    ap?: number;
    ib?: number;
    gifted_talented?: number;
    dual_enrollment?: number;
  };

  geography?: ExplorerSchoolBase['geography'] & {
    county_code?: number;
    cbsa?: number;
    csa?: number;
    congressional_district?: number;

    district?: {
      name?: string;

      state_legislative_district?: {
        lower?: string;
        upper?: string;
      };
    };
  };

  /** CCD and CRDC reporting years may differ, so their values need not align. */
  sources: {
    ccd: {
      name: string;
      abbreviation: string;
      year: number;
    };

    crdc: {
      name: string;
      abbreviation: string;
      year: number;
      matched: boolean;
    };
  };
}
