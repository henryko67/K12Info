import { ExplorerSchoolBase } from './explorer-school-base';

export interface PublicExplorerSchool
  extends ExplorerSchoolBase {

  sector: 'public';

  ids: {
    school_id: string;
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