import { ExplorerSchool } from '../pages/explorer/models/explorer-school';
import { formatCount, formatGrade, formatSchoolLevel, formatSchoolType } from './school-formatters';

describe('school formatters', () => {
  it('preserves legitimate zero values', () => {
    expect(formatGrade(0)).toBe('Kindergarten');
    expect(formatCount(0)).toBe(0);
  });

  it('maps negative source sentinels to unavailable labels', () => {
    expect(formatGrade(-2)).toBe('Unavailable');
    expect(formatCount(-1)).toBe('Unavailable');
  });

  it('uses the public and private classification mappings independently', () => {
    const publicSchool = {
      sector: 'public',
      classification: {
        level: 1,
        type: 5,
      },
    } as ExplorerSchool;

    const privateSchool = {
      sector: 'private',
      classification: {
        level: 1,
        type: 5,
      },
    } as ExplorerSchool;

    expect(formatSchoolLevel(publicSchool)).toBe('Primary');
    expect(formatSchoolLevel(privateSchool)).toBe('Elementary');
    expect(formatSchoolType(publicSchool)).toBe('Reportable program');
    expect(formatSchoolType(privateSchool)).toBe('Special program emphasis');
  });
});
