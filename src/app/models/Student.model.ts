export interface Student {
    student_id?: number;
    studentname_kh: string;
    studentname_en: string;
    class_id?: number;
    class_code?: string;
    gender?: string;
    create_at?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    total?: number;
}

export interface StudentListResponse extends ApiResponse<Student[]> {
    total: number;
    data: Student[];
}

export interface StudentResponse extends ApiResponse<Student> {
    data: Student;
}
