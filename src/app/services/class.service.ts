import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/enviroment';
import { Class, ClassListResponse, ClassResponse, ApiResponse } from '../models/Class.model';

@Injectable({
    providedIn: 'root'
})
export class ClassService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/class`;

    constructor() { }

    getAll(): Observable<ClassListResponse> {
        return this.http.get<ClassListResponse>(`${this.apiUrl}/getall`)
            .pipe(catchError(this.handleError));
    }

    getById(id: number): Observable<ClassResponse> {
        return this.http.get<ClassResponse>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    create(classData: Class): Observable<ClassResponse> {
        return this.http.post<ClassResponse>(`${this.apiUrl}/create`, classData)
            .pipe(catchError(this.handleError));
    }

    update(id: number, classData: Class): Observable<ClassResponse> {
        return this.http.put<ClassResponse>(`${this.apiUrl}/update/${id}`, classData)
            .pipe(catchError(this.handleError));
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/delete/${id}`)
            .pipe(catchError(this.handleError));
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

        console.error('ClassService Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
