import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    private dashboardService = inject(DashboardService);

    totalStudents = signal(0);
    totalTeachers = signal(0);
    totalClasses = signal(0);
    attendanceRate = signal(0);
    loading = signal(false);

    ngOnInit() {
        this.loadDashboardStats();
    }

    loadDashboardStats() {
        this.loading.set(true);
        this.dashboardService.getStats().subscribe({
            next: (res) => {
                if (res.success) {
                    this.totalStudents.set(res.data.totalStudents);
                    this.totalTeachers.set(res.data.totalTeachers);
                    this.totalClasses.set(res.data.totalClasses);
                    this.attendanceRate.set(res.data.attendanceRate);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load dashboard stats:', err);
                this.loading.set(false);
            }
        });
    }
}
