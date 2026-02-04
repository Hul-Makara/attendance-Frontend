export interface Subject {
    subject_id?: number;
    subject_name: string;
    subject_code?: string;
    description?: string;
    create_at?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    total?: number;
}

export interface SubjectListResponse extends ApiResponse<Subject[]> {
    total: number;
    data: Subject[];
}

export interface SubjectResponse extends ApiResponse<Subject> {
    data: Subject;
}
