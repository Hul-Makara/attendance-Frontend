import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../env/enviroment';

export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    attendanceRate: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/dashboard`;

    getStats(): Observable<{ success: boolean; data: DashboardStats }> {
        return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.apiUrl}/stats`);
    }

    getAttendanceStats(): Observable<{ success: boolean; data: any }> {
        return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/attendance-stats`);
    }
}
