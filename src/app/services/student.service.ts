import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/enviroment';
import { Student, StudentListResponse, StudentResponse, ApiResponse } from '../models/Student.model';

export interface UploadResponse {
    success: boolean;
    message?: string;
    summary?: {
        total: number;
        success: number;
        failed: number;
    };
    results?: {
        success: any[];
        failed: any[];
    };
    count?: number; // For bulk modes
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/student`;

    showList = signal(false);

    constructor() { }

    getAll(): Observable<StudentListResponse> {
        return this.http.get<StudentListResponse>(`${this.apiUrl}/getall`)
            .pipe(catchError(this.handleError));
    }

    getById(id: number): Observable<StudentResponse> {
        return this.http.get<StudentResponse>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    create(student: Student): Observable<StudentResponse> {
        return this.http.post<StudentResponse>(`${this.apiUrl}/create`, student)
            .pipe(catchError(this.handleError));
    }

    update(id: number, student: Student): Observable<StudentResponse> {
        return this.http.put<StudentResponse>(`${this.apiUrl}/update/${id}`, student)
            .pipe(catchError(this.handleError));
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/delete/${id}`)
            .pipe(catchError(this.handleError));
    }

    deleteAll(): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/delete-all`)
            .pipe(catchError(this.handleError));
    }

    uploadFile(file: File): Observable<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('students', file);

        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/upload`, formData)
            .pipe(catchError(this.handleError));
    }

    uploadExcel(file: File): Observable<UploadResponse> {
        const formData = new FormData();
        formData.append('students', file);

        return this.http.post<any>(`${this.apiUrl}/upload`, formData).pipe(
            catchError(this.handleError),
            // Map the current backend response to the expected UploadResponse format
            (obs) => new Observable<UploadResponse>(subscriber => {
                obs.subscribe({
                    next: (res) => {
                        if (res.success) {
                            this.showList.set(true);
                        }
                        subscriber.next({
                            success: res.success,
                            message: res.message,
                            summary: {
                                total: res.summary?.totalRowsInFile || 0,
                                success: res.newlyCreated?.length || 0,
                                failed: res.errors?.length || 0
                            },
                            results: {
                                success: res.newlyCreated?.map((s: any) => ({
                                    student_id: s.student_id,
                                    student: {
                                        student_name_eng: s.studentname_en,
                                        student_name_kh: s.studentname_kh
                                    }
                                })) || [],
                                failed: res.errors?.map((e: any) => ({
                                    row_number: e.row,
                                    error: e.message,
                                    row_data: e.data
                                })) || []
                            }
                        });
                        subscriber.complete();
                    },
                    error: (err) => subscriber.error(err)
                });
            })
        );
    }

    uploadExcelBulk(file: File): Observable<UploadResponse> {
        // For now, reuse uploadExcel but maybe simpler response
        return this.uploadExcel(file);
    }

    downloadTemplate(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download-template`, {
            responseType: 'blob'
        }).pipe(catchError(this.handleError));
    }

    exportExcel(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export`, {
            responseType: 'blob'
        }).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
        }

        console.error('StudentService Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
