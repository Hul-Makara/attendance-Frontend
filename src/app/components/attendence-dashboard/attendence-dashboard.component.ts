import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

@Component({
    selector: 'app-attendence-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './attendence-dashboard.component.html',
    styleUrl: './attendence-dashboard.component.css'
})
export class AttendenceDashboardComponent implements OnInit {
    private dashboardService = inject(DashboardService);
    private router = inject(Router);

    dashboardData: any = null;
    loading = true;
    error = '';

    statusDistribution: any[] = [];

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        this.loading = true;
        this.dashboardService.getAttendanceStats().subscribe({
            next: (response: any) => {
                if (response.success) {
                    this.dashboardData = response.data;
                    this.setupDistribution();
                }
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load dashboard data';
                this.loading = false;
            }
        });
    }

    setupDistribution(): void {
        if (!this.dashboardData) return;
        const today = this.dashboardData.today;
        this.statusDistribution = [
            { name: 'Present', value: today.P, color: '#28a745' },
            { name: 'Absent', value: today.A, color: '#dc3545' },
            { name: 'Late', value: today.L, color: '#ffc107' },
            { name: 'Excused', value: today.E, color: '#17a2b8' }
        ];
    }

    refreshDashboard(): void {
        this.loadDashboardData();
    }

    getStatusColor(rate: string): string {
        const value = parseInt(rate);
        if (value >= 90) return 'success';
        if (value >= 75) return 'warning';
        return 'danger';
    }

    getRiskBadgeClass(rate: string): string {
        const value = parseInt(rate);
        if (value < 50) return 'bg-danger';
        return 'bg-warning text-dark';
    }

    navigateToStudents(): void { this.router.navigate(['/students']); }
    navigateToTeachers(): void { this.router.navigate(['/teachers']); }
    navigateToSubjects(): void { this.router.navigate(['/subjects']); }
    navigateToClasses(): void { this.router.navigate(['/classes']); }
    navigateToWeeklyGrid(): void { this.router.navigate(['/attendance/weekly']); }
}
