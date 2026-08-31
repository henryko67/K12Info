/** Fields normalized across public and private source datasets for Explorer use. */
export interface ExplorerSchoolBase {
  _id: string;

  school_name: string;

  sector: 'public' | 'private';

  address: {
    location: {
      street: string;
      city: string;
      state: string;
      zip: string;
      state_name: string;
    };
  };

  contact?: {
    phone?: string;
  };

  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  classification?: {
    level?: number;
    type?: number;
    locale?: number | string;
  };

  grades?: {
    lowest?: number;
    highest?: number;
  };

  enrollment?: {
    students?: number;
    teachers_fte?: number;
    students_per_teacher?: number;
  };

  geography?: {
    fips?: number;
  };
}
