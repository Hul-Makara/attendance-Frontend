import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/enviroment';
import { Teacher, TeacherListResponse, TeacherResponse, ApiResponse } from '../models/Teacher.model';

@Injectable({
    providedIn: 'root'
})
export class TeacherService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/teacher`;

    getAll(): Observable<TeacherListResponse> {
        return this.http.get<TeacherListResponse>(`${this.apiUrl}/getall`)
            .pipe(catchError(this.handleError));
    }

    getById(id: number): Observable<TeacherResponse> {
        return this.http.get<TeacherResponse>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    create(teacher: Teacher): Observable<TeacherResponse> {
        return this.http.post<TeacherResponse>(`${this.apiUrl}/create`, teacher)
            .pipe(catchError(this.handleError));
    }

    update(id: number, teacher: Teacher): Observable<TeacherResponse> {
        return this.http.put<TeacherResponse>(`${this.apiUrl}/update/${id}`, teacher)
            .pipe(catchError(this.handleError));
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/delete/${id}`)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.error('TeacherService Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
