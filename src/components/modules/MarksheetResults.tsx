import React, { useState } from 'react';
import { Button, Dialog } from '../ui/primitives';
import { Assessment, Grade, Student, GradeClassification } from '../../lib/types';
import { buildStudentMarksheet } from '../../lib/marksheet';
import { recordGradeInDB, toggleGradePublishInDB } from '../../lib/api-sync';
import {
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  Award,
  Search,
  Printer
} from 'lucide-react';

interface MarksheetResultsProps {
  students: Student[];
  assessments: Assessment[];
  submissions: import('../../lib/types').Submission[];
  grades: Grade[];
  onRefresh: () => void;
  onSelectStudentForDetails: (student: Student) => void;
}

export const MarksheetResults: React.FC<MarksheetResultsProps> = ({
  students,
  assessments,
  submissions,
  grades,
  onRefresh,
  onSelectStudentForDetails,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Grading Modal State
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [gradeStudentId, setGradeStudentId] = useState<string>('');
  const [gradeAssessmentId, setGradeAssessmentId] = useState<string>('');
  const [numericScore, setNumericScore] = useState<string>('75');
  const [feedback, setFeedback] = useState<string>('');
  const [isPublishedState, setIsPublishedState] = useState<boolean>(true);
  const [gradingError, setGradingError] = useState<string | null>(null);

  const activeStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  // Get active student's marksheet summary
  const studentMarksheet = activeStudent
    ? buildStudentMarksheet(activeStudent.id, students, assessments, submissions, grades)
    : null;

  // Open Grading Modal
  const handleOpenGrading = (studentId: string, assessmentId: string) => {
    setGradeStudentId(studentId);
    setGradeAssessmentId(assessmentId);
    const existing = grades.find(
      (g) => g.studentId === studentId && g.assessmentId === assessmentId
    );
    if (existing) {
      setNumericScore(existing.numericScore.toString());
      setFeedback(existing.feedback || '');
      setIsPublishedState(existing.isPublished);
    } else {
      setNumericScore('75');
      setFeedback('Comprehensive analysis and rigorous methodological execution.');
      setIsPublishedState(true);
    }
    setGradingError(null);
    setIsGradingModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setGradingError(null);

    const scoreNum = parseFloat(numericScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setGradingError('Score must be a valid number between 0 and 100.');
      return;
    }

    try {
      const result = await recordGradeInDB({
        studentId: gradeStudentId,
        assessmentId: gradeAssessmentId,
        numericScore: scoreNum,
        isPublished: isPublishedState,
        feedback: feedback || undefined,
        gradedBy: 'Prof. Dr. Mohammad Rafiqul Islam (Exam Board Chair)',
      });

      if (!result) {
        throw new Error('Failed to save grade to the database.');
      }

      setIsGradingModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setGradingError(err.message || 'Failed to record grade.');
    }
  };

  // Toggle publish single grade
  const handleTogglePublish = async (gradeId: string, currentStatus: boolean) => {
    await toggleGradePublishInDB(gradeId, !currentStatus);
    await onRefresh();
  };

  // Bulk Publish / Withhold for active student
  const handleBulkToggle = async (publish: boolean) => {
    if (!studentMarksheet) return;
    for (const item of studentMarksheet.items) {
      if (item.grade) {
        await toggleGradePublishInDB(item.grade.id, publish);
      }
    }
    await onRefresh();
  };

  // Helper for Classification Text
  const getClassificationText = (cls?: GradeClassification) => {
    if (!cls) return <span className="text-[#5A6270] italic text-xs">Ungraded / Pending</span>;

    switch (cls) {
      case 'Distinction':
        return <span className="text-[#4A2B68] font-medium text-xs">Distinction (70%+)</span>;
      case 'Merit':
        return <span className="text-[#1B2A4A] font-medium text-xs">Merit (60% - 69%)</span>;
      case 'Pass':
        return <span className="text-[#2E6F40] font-medium text-xs">Pass (50% - 59%)</span>;
      case 'Fail':
        return <span className="text-[#7A2E2E] font-medium text-xs">Fail (&lt;50%)</span>;
      default:
        return <span className="text-[#5A6270] text-xs">{cls}</span>;
    }
  };

  const filteredStudents = students.filter((s) => {
    return (
      searchTerm === '' ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.programme?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-serif font-medium text-[#1B2A4A] tracking-tight">
                Examination Board & Marksheet Moderation
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                Academic Session 2024/25
              </span>
            </div>
            <p className="text-xs text-[#5A6270] mt-1">
              Assessment score moderation, degree classification algorithms (UK Honours Standard), and publication release governance.
            </p>
          </div>

          {activeStudent && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(true)}
                className="gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[#2E6F40]" />
                Release All Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(false)}
                className="gap-1.5"
              >
                <EyeOff className="w-3.5 h-3.5 text-[#7A2E2E]" />
                Withhold for Moderation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Student Selector & Academic Transcript Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Candidate Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="p-3 bg-[#F7F5F0] border-b border-[#DCD7CD] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-medium text-xs text-[#1B2A4A] uppercase tracking-wider">
                  Candidate Cohort
                </span>
                <span className="text-[11px] font-mono text-[#5A6270]">
                  {students.length} Candidates
                </span>
              </div>
              <div className="relative">
                <Search className="w-3 h-3 text-[#5A6270] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter candidate name or ID..."
                  className="w-full pl-7 pr-2.5 py-1 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
                />
              </div>
            </div>

            <div className="divide-y divide-[#EAE6DF] max-h-[550px] overflow-y-auto">
              {filteredStudents.map((s) => {
                const isSelected = s.id === activeStudent?.id;
                const ms = buildStudentMarksheet(s.id, students, assessments, submissions, grades);
                const isComplete = ms.totalGraded === ms.items.length;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#F7F5F0] border-l-4 border-l-[#1B2A4A]'
                        : 'hover:bg-[#F7F5F0]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#5A6270]">
                        {s.studentId}
                      </span>
                      {ms.averageScore !== null ? (
                        <span className="font-serif font-medium text-xs text-[#1B2A4A]">
                          {ms.averageScore}% avg
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#8C6214] italic font-mono">
                          Incomplete
                        </span>
                      )}
                    </div>

                    <div className="font-serif font-medium text-xs text-[#1B2A4A] mt-1">
                      {s.fullName}
                    </div>

                    <div className="text-[11px] text-[#5A6270] mt-0.5 flex items-center justify-between">
                      <span className="truncate max-w-[150px]">{s.programme?.code}</span>
                      <span className="font-mono text-[10px]">
                        {ms.totalGraded}/{ms.items.length} Graded
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Official Marksheet Transcript */}
        <div className="lg:col-span-8 space-y-6">
          {activeStudent && studentMarksheet && (
            <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
              {/* Marksheet Official Header */}
              <div className="p-5 border-b border-[#DCD7CD] bg-[#F7F5F0]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#5A6270]">
                      Office of the Controller of Examinations &bull; Official Marksheet
                    </div>
                    <h2 className="text-lg font-serif font-medium text-[#1B2A4A] mt-1">
                      {activeStudent.fullName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5A6270] mt-1.5 font-mono">
                      <span>Registration No: <strong className="text-[#1B2A4A]">{activeStudent.studentId}</strong></span>
                      <span>Programme: <strong className="text-[#1B2A4A]">{activeStudent.programme?.name} ({activeStudent.programme?.code})</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#5A6270]" />
                      Print Marksheet
                    </Button>
                  </div>
                </div>
              </div>

              {/* Classification & Average Calculation Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DCD7CD] border-b border-[#DCD7CD] p-4 bg-white">
                <div>
                  <span className="text-[11px] text-[#5A6270]">Cumulative Mean Score</span>
                  <div className="text-2xl font-serif font-medium text-[#1B2A4A] mt-1">
                    {studentMarksheet.averageScore !== null ? `${studentMarksheet.averageScore}%` : 'N/A'}
                  </div>
                  <div className="text-[10px] text-[#5A6270] font-mono mt-0.5">
                    {studentMarksheet.totalGraded} of {studentMarksheet.items.length} assessments evaluated
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#5A6270]">Degree Honours Classification</span>
                  <div className="text-base font-serif font-medium text-[#1B2A4A] mt-1">
                    {studentMarksheet.overallClassification || 'Pending Full Moderation'}
                  </div>
                  <div className="text-[10px] text-[#5A6270] mt-0.5">
                    Based on UK Honours Degree Framework
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#5A6270]">Board Publication Release</span>
                  <div className="text-xs font-medium text-[#1B2A4A] mt-1.5">
                    {studentMarksheet.publishedCount} Published &bull; {studentMarksheet.items.length - studentMarksheet.publishedCount} Withheld
                  </div>
                  <div className="text-[10px] text-[#5A6270] mt-0.5">
                    {(studentMarksheet.items.length - studentMarksheet.publishedCount) === 0 ? 'Fully released to student portal' : 'Awaiting moderation signoff'}
                  </div>
                </div>
              </div>

              {/* Module Assessment Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1B2A4A]">
                  <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 font-normal">Module & Component</th>
                      <th className="py-2.5 px-4 font-normal">Document Submission</th>
                      <th className="py-2.5 px-4 font-normal text-center">Score (Max 100)</th>
                      <th className="py-2.5 px-4 font-normal">Classification</th>
                      <th className="py-2.5 px-4 font-normal text-center">Release Status</th>
                      <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE6DF]">
                    {studentMarksheet.items.map((item) => {
                      const hasGrade = item.grade !== null;
                      const score = item.grade?.numericScore;
                      const isPublished = item.isPublished;

                      return (
                        <tr key={item.assessment.id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono text-xs text-[#5A6270]">
                              {item.assessment.moduleCode}
                            </div>
                            <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                              {item.assessment.title}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {item.submission ? (
                              <div>
                                <span className="text-[#2E6F40] font-medium text-xs">Submitted</span>
                                <div className="text-[10px] font-mono text-[#5A6270] truncate max-w-[150px]">
                                  {item.submission.fileName}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#8C6214] italic text-xs">No file received</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {hasGrade ? (
                              <span className="font-serif font-medium text-sm text-[#1B2A4A]">
                                {score}%
                              </span>
                            ) : (
                              <span className="text-[#5A6270] font-mono text-xs">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {getClassificationText(item.grade?.classification)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {hasGrade ? (
                              <button
                                onClick={() =>
                                  item.grade && handleTogglePublish(item.grade.id, isPublished)
                                }
                                className={`text-[11px] font-mono px-2 py-0.5 rounded-[2px] border transition-colors ${
                                  isPublished
                                    ? 'bg-[#F2F7F3] text-[#2E6F40] border-[#C8E0CD] hover:bg-[#E2F0E6]'
                                    : 'bg-[#FDF9F0] text-[#8C6214] border-[#ECDAB0] hover:bg-[#FAF1DD]'
                                }`}
                              >
                                {isPublished ? 'Released' : 'Withheld'}
                              </button>
                            ) : (
                              <span className="text-[#5A6270] text-[11px]">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenGrading(activeStudent.id, item.assessment.id)}
                              className="text-[#1B2A4A] hover:underline font-mono text-xs"
                            >
                              {hasGrade ? 'Re-evaluate' : 'Grade Mark'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Marksheet Footer / Signoff */}
              <div className="p-4 bg-[#F7F5F0] border-t border-[#DCD7CD] text-xs text-[#5A6270] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-serif font-medium text-[#1B2A4A]">Authorized Evaluator:</span> Prof. Dr. Mohammad Rafiqul Islam, Controller of Examinations
                </div>
                <div className="font-mono text-[10px]">
                  Official Registry Seal Validated
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enter Grade & Qualitative Feedback Modal */}
      <Dialog
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        title="Record Academic Assessment Score"
        description="Enter moderated examination score, qualitative feedback rubric, and publication flag."
      >
        <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
          {gradingError && (
            <div className="p-3 bg-[#FDF6F6] border border-[#E8C4C4] text-[#7A2E2E] rounded-[2px]">
              {gradingError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Moderated Score (0 - 100) <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={numericScore}
                onChange={(e) => setNumericScore(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-serif text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Computed Honours Classification
              </label>
              <div className="p-2 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] font-serif font-medium text-[#1B2A4A]">
                {Number(numericScore) >= 70
                  ? 'Distinction (70%+)'
                  : Number(numericScore) >= 60
                  ? 'Merit (60% - 69%)'
                  : Number(numericScore) >= 50
                  ? 'Pass (50% - 59%)'
                  : 'Fail (<50%)'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Examination Board Feedback & Rubric Notes
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Detailed evaluative comments for student academic record..."
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublishedState}
                onChange={(e) => setIsPublishedState(e.target.checked)}
                className="rounded-[2px] border-[#DCD7CD] text-[#1B2A4A]"
              />
              <div>
                <span className="font-medium text-[#1B2A4A]">Release grade immediately to Student Portal</span>
                <p className="text-[11px] text-[#5A6270]">
                  If unchecked, score remains withheld in Examination Board moderation.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGradingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Confirm Grade Record
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
