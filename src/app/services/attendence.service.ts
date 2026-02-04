import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/enviroment';

@Injectable({
    providedIn: 'root'
})
export class AttendenceService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/attendance`;

    constructor() { }

    // Add your attendance service methods here
    getAll(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getall`)
            .pipe(catchError(this.handleError));
    }

    getById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    create(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/create`, data)
            .pipe(catchError(this.handleError));
    }

    update(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/update/${id}`, data)
            .pipe(catchError(this.handleError));
    }

    delete(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/delete/${id}`)
            .pipe(catchError(this.handleError));
    }

    getWeeklyGrid(classId: number, startDate: string, endDate: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/weekly-grid`, {
            params: { classId: classId.toString(), startDate, endDate }
        }).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
        }

        console.error('AttendenceService Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
