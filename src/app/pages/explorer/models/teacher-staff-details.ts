export interface TeachersStaffDetails {
    _id: string;

    year: number;

    teachers: {
        fte: number;
        certified_fte: number;
        uncertified_fte: number;
        certified_pct: number;
    };

    support_staff: {
        counselors_fte: number;
        psychologists_fte: number;
        social_workers_fte: number;
        nurses_fte: number;
    };

    safety_staff: {
        security_guard_fte: number;
        law_enforcement_fte: number;
    }
}