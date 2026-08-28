export interface DisciplineDetails {
    _id: string;

    year: number;

    suspensions: {
        instances: number,
        preschool_instances: number
    };

    corporal_punishment: {
        instances: number,
        preschool_instances: number
    }
}