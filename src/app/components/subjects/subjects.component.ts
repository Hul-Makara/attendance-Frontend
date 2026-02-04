import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectService } from '../../services/subject.service';
import { Subject } from '../../models/Subject.model';

@Component({
    selector: 'app-subjects',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './subjects.component.html',
    styleUrl: './subjects.component.css'
})
export class SubjectsComponent implements OnInit {
    private subjectService = inject(SubjectService);

    subjects = signal<Subject[]>([]);
    searchTerm = signal('');
    loading = signal(false);

    filteredSubjects = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.subjects();

        return this.subjects().filter(s =>
            s.subject_name.toLowerCase().includes(term) ||
            (s.subject_code && s.subject_code.toLowerCase().includes(term))
        );
    });

    ngOnInit() {
        this.loadSubjects();
    }

    loadSubjects() {
        this.loading.set(true);
        this.subjectService.getAll().subscribe({
            next: (res) => {
                this.subjects.set(res.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load subjects:', err);
                this.loading.set(false);
            }
        });
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchTerm.set(input.value);
    }

    deleteSubject(id: number) {
        if (confirm('Are you sure you want to delete this subject?')) {
            this.subjectService.delete(id).subscribe({
                next: () => this.loadSubjects(),
                error: (err) => alert('Delete failed: ' + err.message)
            });
        }
    }

    exportToExcel() {
        this.subjectService.exportExcel().subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `subjects_export_${new Date().getTime()}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => alert('Export failed: ' + err.message)
        });
    }
}
