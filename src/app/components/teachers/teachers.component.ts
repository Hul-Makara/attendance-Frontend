import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherService } from '../../services/teacher.service';
import { Teacher } from '../../models/Teacher.model';

@Component({
    selector: 'app-teachers',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './teachers.component.html',
    styleUrl: './teachers.component.css'
})
export class TeachersComponent implements OnInit {
    private teacherService = inject(TeacherService);

    teachers = signal<Teacher[]>([]);
    loading = signal(false);
    errorMessage = signal<string | null>(null);

    ngOnInit() {
        this.loadTeachers();
    }

    loadTeachers() {
        this.loading.set(true);
        this.errorMessage.set(null);

        this.teacherService.getAll().subscribe({
            next: (res) => {
                if (res && res.success && res.data) {
                    this.teachers.set(res.data);
                } else {
                    this.teachers.set([]);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load teachers:', err);
                this.errorMessage.set('Could not load teachers. Please try again later.');
                this.loading.set(false);
            }
        });
    }
}
