'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchStudentsFromDB,
  fetchProgrammesFromDB,
  fetchAssessmentsFromDB,
  fetchSubmissionsFromDB,
  fetchPaymentsFromDB,
  fetchGradesFromDB,
  fetchStatsFromDB,
  seedDB,
} from './lib/api-sync';
import { Student, Programme, Assessment, Submission, Payment, Grade, RegistryStats, AuthUser, UserRole } from './lib/types';
import { getSavedSession, clearSession } from './lib/auth';
import { Header } from './components/layout/Header';
import { LoginScreen } from './components/auth/LoginScreen';
import { TeacherPortal } from './components/modules/TeacherPortal';
import { OverviewDashboard } from './components/modules/OverviewDashboard';
import { StudentEnrolment } from './components/modules/StudentEnrolment';
import { FeesAndPayments } from './components/modules/FeesAndPayments';
import { AssessmentSubmission } from './components/modules/AssessmentSubmission';
import { MarksheetResults } from './components/modules/MarksheetResults';
import { StudentPortal } from './components/modules/StudentPortal';
import { StudentDetailModal } from './components/modules/StudentDetailModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const role: UserRole = currentUser ? currentUser.role : 'admin';
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  
  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [stats, setStats] = useState<RegistryStats | null>(null);

  // Student Detail Modal state
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Connection state - surfaces real DB failures instead of silently
  // substituting mock data, per the "no mocked data" requirement.
  const [dbError, setDbError] = useState<string | null>(null);

  // Sync data from the real database API (PostgreSQL + Prisma). No
  // client-side mock/localStorage fallback - if the API is unreachable we
  // show a connection error banner instead of hiding the problem.
  const refreshData = useCallback(async () => {
    try {
      const [dbStudents, dbProgrammes, dbAssessments, dbSubmissions, dbPayments, dbGrades, dbStats] = await Promise.all([
        fetchStudentsFromDB(),
        fetchProgrammesFromDB(),
        fetchAssessmentsFromDB(),
        fetchSubmissionsFromDB(),
        fetchPaymentsFromDB(),
        fetchGradesFromDB(),
        fetchStatsFromDB(),
      ]);

      if (
        dbStudents === null ||
        dbProgrammes === null ||
        dbAssessments === null ||
        dbSubmissions === null ||
        dbPayments === null ||
        dbGrades === null ||
        dbStats === null
      ) {
        setDbError('Could not reach the database API. Check your DATABASE_URL and that the server is running.');
        return;
      }

      setDbError(null);
      setStudents(dbStudents);
      setProgrammes(dbProgrammes);
      setAssessments(dbAssessments);
      setSubmissions(dbSubmissions);
      setPayments(dbPayments);
      setGrades(dbGrades);
      setStats(dbStats);

      if (!currentStudentId && dbStudents.length > 0) {
        const session = getSavedSession();
        if (session?.role === 'student' && session.studentRecordId) {
          setCurrentStudentId(session.studentRecordId);
        } else {
          setCurrentStudentId(dbStudents[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to refresh data from database:', err);
      setDbError(err?.message || 'Unexpected error while loading data from the database.');
    }
  }, [currentStudentId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle successful login
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'student') {
      const matched = students.find(
        (s) => s.email.toLowerCase() === user.email.toLowerCase() || s.studentId === user.studentId
      );
      if (matched) {
        setCurrentStudentId(matched.id);
      } else if (user.studentRecordId) {
        setCurrentStudentId(user.studentRecordId);
      } else if (students.length > 0) {
        setCurrentStudentId(students[0].id);
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  // Handle resetting data - re-runs the real Prisma seed script against the DB
  const handleResetSeed = async () => {
    if (window.confirm('Reset all registry data to initial seed records? Any unsaved edits will be refreshed.')) {
      await seedDB();
      await refreshData();
    }
  };

  // If user is not authenticated, display the unified login screen
  if (!currentUser) {
    return (
      <LoginScreen
        students={students}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const overdueCount = students.filter((s) => s.isOverdue).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {dbError && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 text-sm px-4 py-2 text-center">
          {dbError}
        </div>
      )}
      {/* Universal Top Header with User Profile */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        role={role}
        currentUser={currentUser}
        onLogout={handleLogout}
        students={students}
        currentStudentId={currentStudentId}
        onSelectStudent={setCurrentStudentId}
        onResetSeed={handleResetSeed}
        overdueCount={overdueCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ROLE 1: Student Portal View */}
        {role === 'student' && (
          <StudentPortal
            currentStudentId={currentStudentId}
            students={students}
            assessments={assessments}
            submissions={submissions}
            grades={grades}
            onRefresh={refreshData}
          />
        )}

        {/* ROLE 2: Teacher / Faculty Portal View */}
        {role === 'teacher' && (
          <TeacherPortal
            currentUser={currentUser}
            students={students}
            assessments={assessments}
            submissions={submissions}
            grades={grades}
            programmes={programmes}
            onRefresh={refreshData}
            onSelectStudentForDetails={setSelectedStudentForDetail}
          />
        )}

        {/* ROLE 3: Administrator Central Registry Modules */}
        {role === 'admin' && (
          <>
            {currentTab === 'dashboard' && stats && (
              <OverviewDashboard
                stats={stats}
                students={students}
                assessments={assessments}
                onNavigateTab={setCurrentTab}
                onSelectStudent={setCurrentStudentId}
              />
            )}

            {currentTab === 'enrolment' && (
              <StudentEnrolment
                students={students}
                programmes={programmes}
                onRefresh={refreshData}
                onSelectStudentForDetails={setSelectedStudentForDetail}
              />
            )}

            {currentTab === 'fees' && (
              <FeesAndPayments
                students={students}
                payments={payments}
                programmes={programmes}
                onRefresh={refreshData}
                onSelectStudentForDetails={setSelectedStudentForDetail}
              />
            )}

            {currentTab === 'assessments' && (
              <AssessmentSubmission
                assessments={assessments}
                submissions={submissions}
                students={students}
                currentStudentId={currentStudentId}
                role="staff"
                onRefresh={refreshData}
              />
            )}

            {currentTab === 'marksheet' && (
              <MarksheetResults
                students={students}
                assessments={assessments}
                submissions={submissions}
                grades={grades}
                onRefresh={refreshData}
                onSelectStudentForDetails={setSelectedStudentForDetail}
              />
            )}
          </>
        )}
      </main>

      {/* Student Details Modal */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={!!selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(null)}
        assessments={assessments}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Student Management System &bull; University Academic Registry & Examination Board</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="text-slate-400">Logged in as {currentUser.email} ({role})</span>
        </div>
      </footer>
    </div>
  );
}

