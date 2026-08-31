import { ExplorerStore } from './explorer-store';
import { ExplorerSchool } from '../models/explorer-school';

const publicSchool = {
  _id: 'public-id',
  school_name: 'Public School',
  sector: 'public',
  address: {
    location: {
      street: '1 Main St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      state_name: 'Washington',
    },
    mailing: {
      street: '1 Main St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
    },
  },
  location: {
    type: 'Point',
    coordinates: [-122.33, 47.61],
  },
  ids: {
    school_id: 'public-source-id',
    ncessch: '123456789012',
    ncessch_num: 123456789012,
    leaid: '1234567',
    state_leaid: 'WA-1',
    seasch: '1',
  },
  classification: {
    level: 3,
  },
  program_enrollment: {
    ap: 0,
  },
  sources: {
    ccd: {
      name: 'CCD',
      abbreviation: 'CCD',
      year: 2023,
    },
    crdc: {
      name: 'CRDC',
      abbreviation: 'CRDC',
      year: 2022,
      matched: true,
    },
  },
} as ExplorerSchool;

const privateSchool = {
  _id: 'private-id',
  school_name: 'Private School',
  sector: 'private',
  address: {
    location: {
      street: '2 Main St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      state_name: 'Washington',
    },
  },
  location: {
    type: 'Point',
    coordinates: [-122.34, 47.62],
  },
  ids: {
    school_id: 'private-source-id',
    nces_id: 'A1234567',
  },
  classification: {
    level: 8,
  },
  sources: {
    nces: {
      name: 'PSS',
      abbreviation: 'PSS',
      year: 2021,
    },
  },
} as ExplorerSchool;

describe('ExplorerStore', () => {
  let store: ExplorerStore;

  beforeEach(() => {
    store = new ExplorerStore();
  });

  it('filters displayed schools by sector and sector-specific criteria', () => {
    store.setDisplayedSchools([publicSchool, privateSchool]);

    store.setSectorFilter('public');
    expect(store.filteredSchools()).toEqual([publicSchool]);

    store.setSectorFilter('all');
    store.togglePrivateLevel(7);
    expect(store.filteredSchools()).toEqual([publicSchool]);
  });

  it('treats a reported zero program enrollment as available', () => {
    store.setDisplayedSchools([publicSchool]);
    store.setPublicApOnly(true);

    expect(store.filteredSchools()).toEqual([publicSchool]);
  });

  it('clears sector-specific filters and restores all sectors', () => {
    store.setSectorFilter('private');
    store.togglePublicLevel(3);
    store.togglePrivateLevel(8);

    store.clearAllFilters();

    expect(store.sectorFilter()).toBe('all');
    expect(store.publicFilters().levels).toEqual([]);
    expect(store.privateFilters().levels).toEqual([]);
  });

  it('resets stale detail state when selecting a school', () => {
    store.setSchoolDetails('previous-ncessch', {
      teachersStaff: null,
      discipline: null,
    });
    store.openDetails();

    store.selectSchool(publicSchool);

    expect(store.selectedSchool()).toBe(publicSchool);
    expect(store.previewOpen()).toBe(true);
    expect(store.schoolDetails()).toBeNull();
    expect(store.detailsOpen()).toBe(false);
  });
});
