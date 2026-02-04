export interface Teacher {
    teacher_id?: number;
    teachername_kh: string;
    teachername_en: string;
    email?: string;
    create_at?: Date;
}

export interface TeacherListResponse {
    success: boolean;
    total: number;
    data: Teacher[];
}

export interface TeacherResponse {
    success: boolean;
    data: Teacher;
    message?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}
