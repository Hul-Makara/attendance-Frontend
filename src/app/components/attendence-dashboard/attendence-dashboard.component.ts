import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ClassService } from '../../services/class.service';
import { AttendenceService } from '../../services/attendence.service';

@Component({
    selector: 'app-attendence-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attendence-dashboard.component.html',
    styleUrl: './attendence-dashboard.component.css',
    providers: [DatePipe]
})
export class AttendenceDashboardComponent implements OnInit {
    private dashboardService = inject(DashboardService);
    private classService = inject(ClassService);
    private attendanceService = inject(AttendenceService);
    private router = inject(Router);

    // Signals
    loading = signal(false);
    classes = signal<any[]>([]);
    selectedClassId = signal<number>(0);
    selectedWeekStart = signal<string>(this.getCurrentWeekStart());
    students = signal<any[]>([]);
    attendanceRecords = signal<any[]>([]);

    // Schedule Config (Mon-Sat, 3 slots per day)
    weeklySchedule = [
        { day: 'Monday', slots: [{ id: 1, name: 'SM' }, { id: 2, name: '2D' }, { id: 3, name: 'Oracle' }] },
        { day: 'Tuesday', slots: [{ id: 1, name: 'IS' }, { id: 2, name: 'WBD' }, { id: 3, name: 'Java' }] },
        { day: 'Wednesday', slots: [{ id: 1, name: 'Oracle' }, { id: 2, name: 'SA' }, { id: 3, name: 'SM' }] },
        { day: 'Thursday', slots: [{ id: 1, name: 'WBD' }, { id: 2, name: 'SA' }, { id: 3, name: 'MIS' }] },
        { day: 'Friday', slots: [{ id: 1, name: 'MIS' }, { id: 2, name: 'IS' }, { id: 3, name: 'NET' }] },
        { day: 'Saturday', slots: [{ id: 1, name: 'NET' }, { id: 2, name: 'Java' }, { id: 3, name: '2D' }] }
    ];

    attendanceDates = computed(() => {
        const start = new Date(this.selectedWeekStart());
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d.toISOString().split('T')[0];
        });
    });

    attendanceStats = computed(() => {
        const studentList = this.students();
        const total = studentList.length;
        if (total === 0) return { totalStudents: 0, present: 0, absent: 0, percentage: 0 };

        let presentCount = 0;
        let absentCount = 0;
        let totalCells = 0;

        studentList.forEach(s => {
            this.attendanceDates().forEach(date => {
                this.weeklySchedule[0].slots.forEach(slot => {
                    totalCells++;
                    const status = this.getAttendanceStatus(s.studentid, date, slot.id);
                    if (status === 'present') presentCount++;
                    else if (status === 'absent') absentCount++;
                });
            });
        });

        return {
            totalStudents: total,
            present: presentCount,
            absent: absentCount,
            percentage: totalCells > 0 ? Math.round((presentCount / totalCells) * 100) : 0
        };
    });

    ngOnInit(): void {
        this.loadClasses();
    }

    getCurrentWeekStart(): string {
        const today = new Date();
        const day = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(today.setDate(diff));
        return monday.toISOString().split('T')[0];
    }

    loadClasses(): void {
        this.classService.getAll().subscribe({
            next: (res: any) => {
                if (res.success) {
                    // Map class_id to classid to match HTML
                    this.classes.set(res.data.map((c: any) => ({
                        classid: c.class_id,
                        classname: c.class_code || c.class_name
                    })));
                }
            }
        });
    }

    onClassChange(): void {
        if (this.selectedClassId() > 0) {
            this.reloadAttendanceForNewWeek();
        } else {
            this.students.set([]);
        }
    }

    reloadAttendanceForNewWeek(): void {
        const classId = this.selectedClassId();
        const dates = this.attendanceDates();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        this.loading.set(true);
        this.attendanceService.getWeeklyGrid(classId, startDate, endDate).subscribe({
            next: (res: any) => {
                if (res.success) {
                    // Map backend students to frontend students signal
                    // Note: backend uses student_id, student_name_en, student_name_kh
                    // HTML uses studentid, studentname_kh, studentname_eng
                    this.students.set(res.data.students.map((s: any) => ({
                        studentid: s.student_id,
                        studentname_kh: s.student_name_kh,
                        studentname_eng: s.student_name_eng,
                        gender: s.gender
                    })));

                    // Store raw attendance records for easy lookup
                    // Simplification: backend returns daily_attendance as an object of dates: records[]
                    const flattenedRecords: any[] = [];
                    res.data.students.forEach((s: any) => {
                        Object.keys(s.daily_attendance).forEach(date => {
                            s.daily_attendance[date].forEach((record: any, index: number) => {
                                flattenedRecords.push({
                                    studentId: s.student_id,
                                    date: date,
                                    slotId: index + 1, // Map records to slots 1, 2, 3...
                                    status: record.status.toLowerCase()
                                });
                            });
                        });
                    });
                    this.attendanceRecords.set(flattenedRecords);
                }
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    getAttendanceStatus(studentId: number, date: string, slotId: number): string {
        const record = this.attendanceRecords().find(r =>
            r.studentId === studentId && r.date === date && r.slotId === slotId
        );
        return record ? record.status : 'empty';
    }

    toggleAttendance(studentId: number, date: string, slotId: number): void {
        const currentStatus = this.getAttendanceStatus(studentId, date, slotId);
        let nextStatus = 'present';

        if (currentStatus === 'present') nextStatus = 'absent';
        else if (currentStatus === 'absent') nextStatus = 'empty';

        // Update local state (optimistic update)
        const records = [...this.attendanceRecords()];
        const index = records.findIndex(r => r.studentId === studentId && r.date === date && r.slotId === slotId);

        if (index > -1) {
            if (nextStatus === 'empty') {
                records.splice(index, 1);
            } else {
                records[index].status = nextStatus;
            }
        } else if (nextStatus !== 'empty') {
            records.push({ studentId, date, slotId, status: nextStatus });
        }

        this.attendanceRecords.set(records);
    }

    getPresentCount(studentId: number): number {
        return this.attendanceRecords().filter(r => r.studentId === studentId && r.status === 'present').length;
    }

    getSelectedClassName(): string {
        const cls = this.classes().find(c => c.classid === this.selectedClassId());
        return cls ? cls.classname : 'Selected Class';
    }

    getSelectedTeacherName(): string {
        return 'Admin / Coordinator'; // Mock or fetch if available
    }

    previousWeek(): void {
        const start = new Date(this.selectedWeekStart());
        start.setDate(start.getDate() - 7);
        this.selectedWeekStart.set(start.toISOString().split('T')[0]);
        this.onClassChange();
    }

    nextWeek(): void {
        const start = new Date(this.selectedWeekStart());
        start.setDate(start.getDate() + 7);
        this.selectedWeekStart.set(start.toISOString().split('T')[0]);
        this.onClassChange();
    }

    onWeekStartChange(event: any): void {
        this.selectedWeekStart.set(event);
        this.onClassChange();
    }

    saveAttendance(): void {
        console.log('Saving changes...', this.attendanceRecords());
        // Implement batch save logic here
    }

    exportAttendance(): void {
        console.log('Exporting PDF...');
    }
}
