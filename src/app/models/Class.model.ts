export interface Class {
    class_id?: number;
    class_code: string;
    class_year?: string;
    schedule?: string;
    room_number?: string;
    subject_id?: number;
    create_at?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    total?: number;
}

export interface ClassListResponse extends ApiResponse<Class[]> {
    total: number;
    data: Class[];
}

export interface ClassResponse extends ApiResponse<Class> {
    data: Class;
}
