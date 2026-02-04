import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendenceService } from '../../services/attendence.service';
import { ClassService } from '../../services/class.service';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-weekly-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weekly-attendance.html',
  styleUrl: './weekly-attendance.css',
})
export class WeeklyAttendance implements OnInit {
  private attendanceService = inject(AttendenceService);
  private classService = inject(ClassService);
  private subjectService = inject(SubjectService);

  // State
  loading = false;
  submitting = false;
  error = '';
  gridData: any = null;
  classes: any[] = [];
  subjects: any[] = [];
  loadingSubjects = false;

  // Selection
  selectedClassId: number = 0;
  startDate: string = '';
  endDate: string = '';
  searchQuery: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalStudents = 0;
  Math = Math;

  // Unsaved Changes
  pendingUpdates = new Map<string, any>();
  hasUnsavedChanges = false;

  // Modals
  showDetailModal = false;
  detailModalData: any = {};
  showCountdownModal = false;
  countdownMessage = '';
  countdown = { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };

  // Bulk Selection
  showBulkSelectionPanel = false;
  currentBulkDate: string | null = null;
  bulkSelectionStates = new Map<string, { selectedStatus: string; selectedStudentIds: Set<number> }>();

  statusOptions = [
    { value: 'Present', label: 'Present', symbol: '✓' },
    { value: 'Absent', label: 'Absent', symbol: 'A' },
    { value: 'Late', label: 'Late', symbol: 'L' },
    { value: 'Excused', label: 'Excused', symbol: 'E' }
  ];

  ngOnInit(): void {
    this.initDates();
    this.loadClasses();
    this.loadAllSubjects();
  }

  initDates(): void {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday

    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
  }

  loadClasses(): void {
    this.classService.getAll().subscribe(res => {
      this.classes = res.data;
      if (this.classes.length > 0 && !this.selectedClassId) {
        this.selectedClassId = this.classes[0].class_id;
        this.loadGrid();
      }
    });
  }

  loadAllSubjects(): void {
    this.loadingSubjects = true;
    this.subjectService.getAll().subscribe(res => {
      this.subjects = res.data;
      this.loadingSubjects = false;
    });
  }

  loadGrid(): void {
    if (!this.selectedClassId || !this.startDate || !this.endDate) return;
    this.loading = true;
    this.attendanceService.getWeeklyGrid(this.selectedClassId, this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.gridData = res.data;
        this.totalStudents = this.gridData.students.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load grid data';
        this.loading = false;
      }
    });
  }

  onClassChange(): void { this.loadGrid(); }
  onDateChange(): void { this.loadGrid(); }

  previousWeek(): void {
    const d = new Date(this.startDate);
    d.setDate(d.getDate() - 7);
    this.startDate = d.toISOString().split('T')[0];
    d.setDate(d.getDate() + 6);
    this.endDate = d.toISOString().split('T')[0];
    this.loadGrid();
  }

  nextWeek(): void {
    const d = new Date(this.startDate);
    d.setDate(d.getDate() + 7);
    this.startDate = d.toISOString().split('T')[0];
    d.setDate(d.getDate() + 6);
    this.endDate = d.toISOString().split('T')[0];
    this.loadGrid();
  }

  resetToCurrentWeek(): void {
    this.initDates();
    this.loadGrid();
  }

  refresh(): void { this.loadGrid(); }

  // Search
  onSearch(): void { }
  clearSearch(): void { this.searchQuery = ''; }
  getFilteredStudents(): any[] {
    if (!this.gridData) return [];
    const term = this.searchQuery.toLowerCase();
    return this.gridData.students.filter((s: any) =>
      s.student_name_eng.toLowerCase().includes(term) ||
      s.student_name_kh.includes(term)
    );
  }

  // Staging
  stageAttendanceUpdate(studentId: number, date: string, status: string): void {
    const key = `${studentId}_${date}`;
    this.pendingUpdates.set(key, { studentId, date, status });
    this.hasUnsavedChanges = true;
  }

  hasPendingChanges(studentId: number, date: string): boolean {
    return this.pendingUpdates.has(`${studentId}_${date}`);
  }

  submitAllChanges(): void {
    this.submitting = true;
    const updates = Array.from(this.pendingUpdates.values());
    // In a real app, you'd send this to a bulk-create endpoint
    // For now, let's just mock success and reload
    Promise.all(updates.map(u => this.attendanceService.create({
      student_id: u.studentId,
      subject_id: this.getSelectedSubjectId(u.date) || 1, // Fallback subject
      attendance_date: u.date,
      status: u.status,
      teacher_id: 1 // Fallback teacher
    }).toPromise())).then(() => {
      this.pendingUpdates.clear();
      this.hasUnsavedChanges = false;
      this.submitting = false;
      this.loadGrid();
    }).catch(err => {
      this.error = 'Failed to save some changes';
      this.submitting = false;
    });
  }

  cancelAllChanges(): void {
    this.pendingUpdates.clear();
    this.hasUnsavedChanges = false;
  }

  // UI Helpers
  isToday(date: string): boolean {
    return date === new Date().toISOString().split('T')[0];
  }

  getDateDisplay(date: string): string {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `<div class="day-name">${days[d.getDay()]}</div><div class="day-num">${d.getDate()}</div>`;
  }

  getStatusClass(status: string, date: string = ''): string {
    if (!status) return '';
    const s = status.charAt(0).toUpperCase();
    switch (s) {
      case 'P': return 'status-present';
      case 'A': return 'status-absent';
      case 'L': return 'status-late';
      case 'E': return 'status-excused';
      default: return '';
    }
  }

  getStatusSymbol(status: string): string {
    if (!status) return '';
    const s = status.charAt(0).toUpperCase();
    return s === 'P' ? '✓' : s;
  }

  getDailyStatus(student: any, date: string): string {
    const pending = this.pendingUpdates.get(`${student.student_id}_${date}`);
    if (pending) return pending.status;

    const records = student.daily_attendance[date];
    return records && records.length > 0 ? records[0].status : '';
  }

  isEditMode(studentId: number, date: string): boolean { return false; } // Simplified
  onCellClick(studentId: number, date: string): void {
    if (!this.isDateEditable(date)) return;
    if (this.showBulkSelectionPanel) {
      this.toggleStudentSelection(date, studentId);
      return;
    }
    // Toggle between P and A for quick marking
    const currentStatus = this.getDailyStatus({ student_id: studentId, daily_attendance: this.gridData.students.find((s: any) => s.student_id === studentId).daily_attendance }, date);
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    this.stageAttendanceUpdate(studentId, date, newStatus);
  }

  isDateEditable(date: string): boolean {
    // Only same day or future if business rules allow, but typically same day
    return true; // Simplified for dev
  }

  getGenderIconClass(gender: string): string {
    return gender === 'M' || gender === 'Male' ? 'bi bi-gender-male text-primary' : 'bi bi-gender-female text-danger';
  }

  getAttendanceRateColor(rate: string): string {
    const v = parseInt(rate);
    if (v >= 90) return 'text-success';
    if (v >= 75) return 'text-warning';
    return 'text-danger';
  }

  // Bulk Selection
  getBulkSelectionState(date: string) {
    if (!this.bulkSelectionStates.has(date)) {
      this.bulkSelectionStates.set(date, { selectedStatus: 'Present', selectedStudentIds: new Set() });
    }
    return this.bulkSelectionStates.get(date);
  }

  isBulkSelectionActive(date: string): boolean {
    return this.showBulkSelectionPanel && this.currentBulkDate === date;
  }

  toggleBulkSelection(date: string): void {
    if (this.currentBulkDate === date) {
      this.showBulkSelectionPanel = false;
      this.currentBulkDate = null;
    } else {
      this.showBulkSelectionPanel = true;
      this.currentBulkDate = date;
    }
  }

  toggleStudentSelection(date: string, studentId: number): void {
    const state = this.getBulkSelectionState(date);
    if (state?.selectedStudentIds.has(studentId)) {
      state.selectedStudentIds.delete(studentId);
    } else {
      state?.selectedStudentIds.add(studentId);
    }
  }

  isStudentSelected(date: string, studentId: number): boolean {
    return this.getBulkSelectionState(date)?.selectedStudentIds.has(studentId) || false;
  }

  selectAllStudents(date: string): void {
    const state = this.getBulkSelectionState(date);
    this.getFilteredStudents().forEach(s => state?.selectedStudentIds.add(s.student_id));
  }

  deselectAllStudents(date: string): void {
    this.getBulkSelectionState(date)?.selectedStudentIds.clear();
  }

  getSelectedStudentCount(date: string): number {
    return this.getBulkSelectionState(date)?.selectedStudentIds.size || 0;
  }

  applyBulkAttendance(date: string): void {
    const state = this.getBulkSelectionState(date);
    if (!state) return;
    state.selectedStudentIds.forEach(id => {
      this.stageAttendanceUpdate(id, date, state.selectedStatus);
    });
    this.showBulkSelectionPanel = false;
    this.currentBulkDate = null;
  }

  cancelBulkSelection(date: string): void {
    this.showBulkSelectionPanel = false;
    this.currentBulkDate = null;
  }

  quickSelectAllPresent(date: string): void {
    this.getFilteredStudents().forEach(s => {
      this.stageAttendanceUpdate(s.student_id, date, 'Present');
    });
  }

  // Subject Selection
  subjectSelections = new Map<string, number>();
  getSelectedSubjectId(date: string): number {
    return this.subjectSelections.get(date) || (this.subjects.length > 0 ? this.subjects[0].subject_id : 0);
  }
  onSubjectChange(date: string, subjectId: number): void {
    this.subjectSelections.set(date, subjectId);
  }
  getSubjectsForDate(date: string): any[] { return this.subjects; }

  // Details
  showAttendanceDetail(student: any, date: string): void {
    this.detailModalData = { student, date, subjects: student.daily_attendance[date] };
    this.showDetailModal = true;
  }
  closeDetailModal(): void { this.showDetailModal = false; }
  hasMultipleSubjectRecords(student: any, date: string): boolean {
    return (student.daily_attendance[date]?.length || 0) > 1;
  }
  getAbsentSubjectCount(student: any, date: string): number {
    return student.daily_attendance[date]?.filter((r: any) => r.status === 'Absent').length || 0;
  }

  // Timer/Modal
  closeCountdownModal(): void { this.showCountdownModal = false; }
  getCountdownDisplay(): string { return '00:00'; }
  isPastDate(date: string): boolean { return new Date(date) < new Date(new Date().toDateString()); }

  // Export/Print
  exportToExcel(): void { }
  print(): void { window.print(); }

  // Pagination
  get totalPages(): number { return Math.ceil(this.totalStudents / this.pageSize); }
  onPageSizeChange(): void { this.currentPage = 1; this.loadGrid(); }
  previousPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

  highlightSearch(text: string): string {
    if (!this.searchQuery) return text;
    const regex = new RegExp(`(${this.searchQuery})`, 'gi');
    return text.toString().replace(regex, '<mark>$1</mark>');
  }

  getCellTitle(date: string, student: any): string {
    return `Mark attendance for ${student.student_name_eng} on ${date}`;
  }
}
