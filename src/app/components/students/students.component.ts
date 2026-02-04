import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/Student.model';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  private studentService = inject(StudentService);

  students = signal<Student[]>([]);
  searchTerm = signal('');
  genderFilter = signal('All');
  loading = signal(false);
  uploading = signal(false);

  filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const gender = this.genderFilter();

    let filtered = this.students();

    if (gender !== 'All') {
      filtered = filtered.filter(s => s.gender === gender);
    }

    if (term) {
      filtered = filtered.filter(s =>
        s.studentname_en.toLowerCase().includes(term) ||
        s.studentname_kh.toLowerCase().includes(term) ||
        (s.class_code && s.class_code.toLowerCase().includes(term))
      );
    }

    return filtered;
  });

  get showList() {
    return this.studentService.showList;
  }

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.loading.set(true);
    this.studentService.getAll().subscribe({
      next: (res) => {
        this.students.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load students:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  deleteStudent(id: number) {
    if (confirm('Are you sure you want to delete this student?')) {
      this.studentService.delete(id).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: (err) => {
          alert('Delete failed: ' + err.message);
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploading.set(true);
      this.studentService.uploadFile(file).subscribe({
        next: (res) => {
          alert('Students Imported Successfully!');
          this.studentService.showList.set(true);
          this.loadStudents();
          this.uploading.set(false);
        },
        error: (err) => {
          alert('Upload failed: ' + err.message);
          this.uploading.set(false);
        }
      });
    }
  }

  exportToExcel() {
    this.studentService.exportExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_export_${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Export failed: ' + err.message);
      }
    });
  }
}