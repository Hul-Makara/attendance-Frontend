import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StudentsComponent } from './components/students/students.component';
import { TeachersComponent } from './components/teachers/teachers.component';
import { SubjectsComponent } from './components/subjects/subjects.component';
import { ClassesComponent } from './components/classes/classes.component';
import { AttendenceDashboardComponent } from './components/attendence-dashboard/attendence-dashboard.component';
import { WeeklyAttendance } from './components/weekly-attendance/weekly-attendance';
import { NotFoundComponent } from './components/not-found/not-found.component';

export const routes: Routes = [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'students', component: StudentsComponent },
    { path: 'teachers', component: TeachersComponent },
    { path: 'subjects', component: SubjectsComponent },
    { path: 'classes', component: ClassesComponent },
    { path: 'attendance', component: AttendenceDashboardComponent },
    { path: 'attendance/weekly', component: WeeklyAttendance },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: '**', component: NotFoundComponent }
];
