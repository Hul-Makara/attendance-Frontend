import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassService } from '../../services/class.service';
import { Class } from '../../models/Class.model';

@Component({
    selector: 'app-classes',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './classes.component.html',
    styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {
    private classService = inject(ClassService);

    classes = signal<Class[]>([]);
    searchTerm = signal('');
    loading = signal(false);

    filteredClasses = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.classes();

        return this.classes().filter(c =>
            c.class_code.toLowerCase().includes(term) ||
            (c.class_year && c.class_year.toLowerCase().includes(term))
        );
    });

    ngOnInit() {
        this.loadClasses();
    }

    loadClasses() {
        this.loading.set(true);
        this.classService.getAll().subscribe({
            next: (res) => {
                this.classes.set(res.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load classes:', err);
                this.loading.set(false);
            }
        });
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchTerm.set(input.value);
    }

    deleteClass(id: number) {
        if (confirm('Are you sure you want to delete this class?')) {
            this.classService.delete(id).subscribe({
                next: () => this.loadClasses(),
                error: (err) => alert('Delete failed: ' + err.message)
            });
        }
    }

    exportToExcel() {
        this.classService.exportExcel().subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `classes_export_${new Date().getTime()}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => alert('Export failed: ' + err.message)
        });
    }
}
