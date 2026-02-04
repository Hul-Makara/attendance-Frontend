import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/enviroment';
import { Subject, SubjectListResponse, SubjectResponse, ApiResponse } from '../models/Subject.model';

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/subject`;

    constructor() { }

    getAll(): Observable<SubjectListResponse> {
        return this.http.get<SubjectListResponse>(`${this.apiUrl}/getall`)
            .pipe(catchError(this.handleError));
    }

    getById(id: number): Observable<SubjectResponse> {
        return this.http.get<SubjectResponse>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    create(subject: Subject): Observable<SubjectResponse> {
        return this.http.post<SubjectResponse>(`${this.apiUrl}/create`, subject)
            .pipe(catchError(this.handleError));
    }

    update(id: number, subject: Subject): Observable<SubjectResponse> {
        return this.http.put<SubjectResponse>(`${this.apiUrl}/update/${id}`, subject)
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

        console.error('SubjectService Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
