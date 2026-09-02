import React from 'react';
import { Button, Badge } from '../ui/primitives';
import { RegistryStats, Student, Assessment } from '../../lib/types';
import {
  Users,
  CreditCard,
  FileText,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus
} from 'lucide-react';

interface OverviewDashboardProps {
  stats: RegistryStats;
  students: Student[];
  assessments: Assessment[];
  onNavigateTab: (tab: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  students,
  assessments,
  onNavigateTab,
  onSelectStudent,
}) => {
  const overdueStudents = students.filter((s) => s.isOverdue);

  return (
    <div className="space-y-6">
      {/* Institutional Session Ledger Header */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-serif font-medium text-[#1B2A4A] tracking-tight">
                Academic Administration Ledger
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                Academic Year 2024/25
              </span>
            </div>
            <p className="text-xs text-[#5A6270] mt-1 max-w-3xl">
              Registry balance sheet, student enrolment register, statutory tuition reconciliations, and Examination Board result moderation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('enrolment')}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#5A6270]" />
              + Add New Student
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onNavigateTab('marksheet')}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Examination Board
            </Button>
          </div>
        </div>
      </div>

      {/* Dense Institutional Registry Summary Ledger (Replaces generic 4 KPI cards) */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] divide-y divide-[#DCD7CD]">
        <div className="px-5 py-3 bg-[#F7F5F0] border-b border-[#DCD7CD] flex items-center justify-between">
          <span className="font-serif font-medium text-xs text-[#1B2A4A] uppercase tracking-wider">
            Consolidated Registry & Financial Ledger Summary
          </span>
          <span className="text-[11px] font-mono text-[#5A6270]">
            Official Audit Record
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DCD7CD]">
          {/* Cell 1: Matriculated Students */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-[#5A6270]">
                  Total Student Body
                </span>
                <Users className="w-3.5 h-3.5 text-[#5A6270]" />
              </div>
              <div className="mt-2 text-2xl font-serif font-medium text-[#1B2A4A]">
                {stats.totalStudents}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#EAE6DF] text-[11px] text-[#5A6270] flex justify-between font-mono">
              <span>{stats.enrolledStudents} Enrolled</span>
              <span>{stats.deferredStudents} Deferred</span>
              <span>{stats.withdrawnStudents} Withdrawn</span>
            </div>
          </div>

          {/* Cell 2: Tuition Collections & Receipts */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-[#5A6270]">
                  Tuition Receipts Realized
                </span>
                <CreditCard className="w-3.5 h-3.5 text-[#5A6270]" />
              </div>
              <div className="mt-2 text-2xl font-serif font-medium text-[#1B2A4A]">
                £{stats.totalFeesCollected.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#EAE6DF] text-[11px] flex items-center justify-between">
              <span className="text-[#5A6270] font-mono">Billed: £{stats.totalFeesBilled.toLocaleString()}</span>
              {stats.overdueStudentsCount > 0 && (
                <span className="text-[#7A2E2E] font-medium font-mono">
                  {stats.overdueStudentsCount} in Arrears
                </span>
              )}
            </div>
          </div>

          {/* Cell 3: Total Outstanding Balance */}
          <div className={`p-4 sm:p-5 flex flex-col justify-between ${stats.totalOutstandingBalance > 0 ? 'bg-[#FDF6F6]/40' : ''}`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-[#5A6270]">
                  Outstanding Balance
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#7A2E2E]" />
              </div>
              <div className="mt-2 text-2xl font-serif font-medium text-[#7A2E2E]">
                £{stats.totalOutstandingBalance.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#EAE6DF] text-[11px] text-[#5A6270] flex justify-between">
              <span>Payment Terms: 30 Days Net</span>
              <button 
                onClick={() => onNavigateTab('fees')}
                className="text-[#7A2E2E] hover:underline text-[11px] font-medium"
              >
                Inspect Ledger &rarr;
              </button>
            </div>
          </div>

          {/* Cell 4: Examination Board Status */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-[#5A6270]">
                  Published Results
                </span>
                <GraduationCap className="w-3.5 h-3.5 text-[#5A6270]" />
              </div>
              <div className="mt-2 text-2xl font-serif font-medium text-[#1B2A4A]">
                {stats.gradesPublishedCount}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#EAE6DF] text-[11px] text-[#5A6270] flex justify-between font-mono">
              <span>{stats.gradesWithheldCount} In Moderation</span>
              <span>{stats.totalAssessments} Open Modules</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Administrative Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Delinquent Accounts in Arrears & Registry Modules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Accounts Table with left border-color bar */}
          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#DCD7CD] bg-[#FDF6F6] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-serif font-medium text-[#7A2E2E]">
                    Delinquent Accounts & Arrears
                  </h2>
                  <span className="px-1.5 py-0.2 rounded-[2px] bg-[#7A2E2E] text-white text-[10px] font-mono">
                    {overdueStudents.length} Flagged
                  </span>
                </div>
                <p className="text-[11px] text-[#7A2E2E]/80 mt-0.5">
                  Students with outstanding balance beyond authorized payment schedule
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('fees')}
                className="text-xs border-[#E8C4C4] text-[#7A2E2E] hover:bg-[#FDF6F6]"
              >
                Open Fee Ledger
              </Button>
            </div>

            {overdueStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5A6270]">
                <CheckCircle2 className="w-6 h-6 text-[#2E6F40] mx-auto mb-2" />
                All student accounts are currently in good financial standing.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE6DF]">
                {overdueStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-[#7A2E2E] bg-white hover:bg-[#F7F5F0]/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-medium text-sm text-[#1B2A4A]">
                          {student.fullName}
                        </span>
                        <span className="font-mono text-xs text-[#5A6270] px-1.5 py-0.2 rounded-[2px] bg-[#F7F5F0] border border-[#DCD7CD]">
                          {student.studentId}
                        </span>
                        <span className="text-[11px] text-[#7A2E2E] font-medium">
                          {student.daysOverdue} Days Overdue
                        </span>
                      </div>
                      <p className="text-xs text-[#5A6270] mt-1">
                        Programme: {student.programme?.name} &bull; Due Date:{' '}
                        <span className="font-mono">{student.feeDueDate ? new Date(student.feeDueDate).toLocaleDateString() : 'N/A'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[11px] text-[#5A6270]">Outstanding Balance</div>
                        <div className="text-base font-serif font-medium text-[#7A2E2E]">
                          £{student.outstandingBalance?.toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateTab('fees')}
                        className="text-xs"
                      >
                        Record Payment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Registry Directory Hub */}
          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#DCD7CD] bg-[#F7F5F0]">
              <h2 className="text-sm font-serif font-medium text-[#1B2A4A]">
                Academic Registry Portfolios
              </h2>
              <p className="text-[11px] text-[#5A6270] mt-0.5">
                Institutional record management and compliance units
              </p>
            </div>

            <div className="divide-y divide-[#EAE6DF]">
              {/* Row 1 */}
              <div
                onClick={() => onNavigateTab('enrolment')}
                className="p-4 hover:bg-[#F7F5F0]/80 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#1B2A4A]">
                    <Users className="w-4 h-4 text-[#1B2A4A]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-medium text-[#1B2A4A]">
                      Student Enrolment & Registration
                    </h3>
                    <p className="text-[11px] text-[#5A6270] mt-0.5">
                      Enroll incoming cohorts, update academic progression standing (Enrolled, Deferred, Withdrawn), and search student records.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#5A6270] group-hover:text-[#1B2A4A] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>

              {/* Row 2 */}
              <div
                onClick={() => onNavigateTab('fees')}
                className="p-4 hover:bg-[#F7F5F0]/80 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#1B2A4A]">
                    <CreditCard className="w-4 h-4 text-[#1B2A4A]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-medium text-[#1B2A4A]">
                      Tuition Reconciliations & Ledger Accounts
                    </h3>
                    <p className="text-[11px] text-[#5A6270] mt-0.5">
                      Statutory tuition fees, payment voucher recording, bank transfer references, and outstanding balance audits.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#5A6270] group-hover:text-[#1B2A4A] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>

              {/* Row 3 */}
              <div
                onClick={() => onNavigateTab('assessments')}
                className="p-4 hover:bg-[#F7F5F0]/80 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#1B2A4A]">
                    <FileText className="w-4 h-4 text-[#1B2A4A]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-medium text-[#1B2A4A]">
                      Coursework & Examination Submissions
                    </h3>
                    <p className="text-[11px] text-[#5A6270] mt-0.5">
                      Module coursework assignments, PDF and DOCX document reception, timestamp verification, and late submission flags.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#5A6270] group-hover:text-[#1B2A4A] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>

              {/* Row 4 */}
              <div
                onClick={() => onNavigateTab('marksheet')}
                className="p-4 hover:bg-[#F7F5F0]/80 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#1B2A4A]">
                    <GraduationCap className="w-4 h-4 text-[#1B2A4A]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-medium text-[#1B2A4A]">
                      Examination Board & Marksheet Moderation
                    </h3>
                    <p className="text-[11px] text-[#5A6270] mt-0.5">
                      Score capture (0-100), UK Honours degree classification calculations, and formal release control to student transcripts.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#5A6270] group-hover:text-[#1B2A4A] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Deadlines & Student Matriculation Roster */}
        <div className="space-y-6">
          {/* Upcoming Examination Deadlines */}
          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DCD7CD] bg-[#F7F5F0] flex items-center justify-between">
              <h2 className="text-xs font-serif font-medium text-[#1B2A4A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5A6270]" />
                Upcoming Deadlines
              </h2>
              <button
                onClick={() => onNavigateTab('assessments')}
                className="text-[11px] text-[#1B2A4A] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-[#EAE6DF]">
              {assessments.slice(0, 4).map((assessment) => {
                const deadlineDate = new Date(assessment.deadline);
                const isPast = deadlineDate.getTime() < new Date().getTime();
                return (
                  <div
                    key={assessment.id}
                    className="p-3 hover:bg-[#F7F5F0]/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-[#1B2A4A]">
                        {assessment.moduleCode}
                      </span>
                      {isPast ? (
                        <span className="text-[10px] font-mono text-[#5A6270]">
                          Submissions Closed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#8C6214]">
                          Due: {deadlineDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-[#1B2A4A] mt-1 truncate">
                      {assessment.title}
                    </div>
                    <div className="text-[11px] text-[#5A6270] mt-0.5">
                      {assessment.moduleName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Student Enrolment Roster */}
          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DCD7CD] bg-[#F7F5F0] flex items-center justify-between">
              <h2 className="text-xs font-serif font-medium text-[#1B2A4A] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#5A6270]" />
                Recent Students
              </h2>
              <button
                onClick={() => onNavigateTab('enrolment')}
                className="text-[11px] text-[#1B2A4A] hover:underline"
              >
                Full Roster
              </button>
            </div>

            <div className="divide-y divide-[#EAE6DF]">
              {students.slice(0, 4).map((student) => (
                <div
                  key={student.id}
                  className="p-3 flex items-center justify-between hover:bg-[#F7F5F0]/60 transition-colors"
                >
                  <div>
                    <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                      {student.fullName}
                    </div>
                    <div className="text-[11px] text-[#5A6270] font-mono">
                      {student.studentId} &bull; {student.programme?.code}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateTab('enrolment');
                      onSelectStudent(student.id);
                    }}
                    className="text-[11px] text-[#1B2A4A] hover:underline font-mono"
                    title="Inspect student record"
                  >
                    View &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
