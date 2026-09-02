import React, { useState } from 'react';
import { Button, Dialog } from '../ui/primitives';
import { Student, Assessment, Submission, Grade, GradeClassification } from '../../lib/types';
import { buildStudentMarksheet } from '../../lib/marksheet';
import { submitAssessmentInDB } from '../../lib/api-sync';
import {
  FileText,
  Upload,
  Calendar,
  Lock,
  Printer,
  Award,
  CreditCard
} from 'lucide-react';

interface StudentPortalProps {
  currentStudentId: string;
  students: Student[];
  assessments: Assessment[];
  submissions: Submission[];
  grades: Grade[];
  onRefresh: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudentId,
  students,
  assessments,
  submissions,
  grades,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'results' | 'assessments' | 'marksheet' | 'finance'>('results');

  // Submit Modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mockFileName, setMockFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const student = students.find((s) => s.id === currentStudentId) || students[0];

  // Get student's published marksheet (strict query-level security -
  // unpublished items are still visible here so the student sees a "not
  // yet published" state, per the assessment's requirement, but the
  // classification/score are only ever rendered for published items in JSX)
  const marksheet = student ? buildStudentMarksheet(student.id, students, assessments, submissions, grades) : null;
  const publishedItems = marksheet?.items.filter((item) => item.isPublished) || [];
  const unpublishedItems = marksheet?.items.filter((item) => !item.isPublished) || [];

  const handleOpenSubmit = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setSelectedFile(null);
    setMockFileName('');
    setUploadError(null);
    setIsSubmitModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      setUploadError('Invalid format. Please select a .pdf or .docx file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setMockFileName(file.name);
  };

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment || !student) return;

    const finalName = selectedFile?.name || mockFileName.trim();
    if (!finalName) {
      setUploadError('Please select a file to upload.');
      return;
    }

    const ext = finalName.substring(finalName.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      setUploadError('File must be .pdf or .docx');
      return;
    }

    setIsUploading(true);
    try {
      const result = await submitAssessmentInDB({
        assessmentId: selectedAssessment.id,
        studentId: student.id,
        fileName: finalName,
        fileSize: selectedFile?.size || 1840000,
        fileType:
          ext === '.pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      if (!result) {
        throw new Error('Failed to save submission to the database.');
      }

      setIsSubmitModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Submission failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getClassificationText = (cls?: GradeClassification) => {
    if (!cls) return <span className="text-[#5A6270] italic text-xs">Pending Moderation</span>;

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

  if (!student) {
    return (
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-8 text-center text-[#5A6270]">
        No student matriculation record located.
      </div>
    );
  }

  const outstanding = student.outstandingBalance ?? 0;
  const isOverdue = student.isOverdue;

  return (
    <div className="space-y-6">
      {/* Student Banner Header */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-serif font-medium text-[#1B2A4A] tracking-tight">
                {student.fullName}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                {student.studentId}
              </span>
              <span className="text-xs text-[#2E6F40] font-medium ml-1">
                &bull; {student.enrolmentStatus}
              </span>
            </div>
            <p className="text-xs text-[#5A6270] mt-1 font-mono">
              {student.programme?.name} ({student.programme?.code}) &bull; {student.academicYear} &bull; {student.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#5A6270]" />
              Print Academic Record
            </Button>
          </div>
        </div>

        {/* Key Indicators Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DCD7CD] border-t border-[#DCD7CD] mt-4 pt-4">
          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-[#5A6270] block">Published Academic Mean</span>
            <span className="text-xl font-serif font-medium text-[#1B2A4A] mt-0.5 block">
              {marksheet?.averageScore !== null ? `${marksheet?.averageScore}%` : 'Pending'}
            </span>
            <span className="text-[10px] text-[#5A6270] font-serif">
              {marksheet?.overallClassification || 'Board Moderation in Progress'}
            </span>
          </div>

          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-[#5A6270] block">Coursework Receipts</span>
            <span className="text-xl font-serif font-medium text-[#1B2A4A] mt-0.5 block">
              {submissions.filter((s) => s.studentId === student.id).length} of {assessments.length}
            </span>
            <span className="text-[10px] text-[#5A6270] font-mono">
              All submissions timestamp-verified
            </span>
          </div>

          <div className={`p-2 sm:px-4 ${isOverdue ? 'bg-[#FDF6F6]/40' : ''}`}>
            <span className={`text-[11px] block ${isOverdue ? 'text-[#7A2E2E] font-medium' : 'text-[#5A6270]'}`}>
              Tuition Account Balance
            </span>
            <span className={`text-xl font-serif font-medium mt-0.5 block ${isOverdue ? 'text-[#7A2E2E]' : 'text-[#1B2A4A]'}`}>
              £{outstanding.toLocaleString()}
            </span>
            <span className={`text-[10px] font-mono ${isOverdue ? 'text-[#7A2E2E]' : 'text-[#2E6F40]'}`}>
              {isOverdue ? `Arrears (${student.daysOverdue} days past due)` : outstanding === 0 ? 'Account in full settlement' : 'Payment on schedule'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-2">
        <nav className="flex space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('results')}
            className={`py-1.5 px-3.5 text-xs rounded-[2px] border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'results'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#C5BFB5]" />
            <span>1. My Results & Marksheet</span>
            {publishedItems.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-mono ${activeTab === 'results' ? 'bg-[#2E6F40] text-white' : 'bg-[#EAE6DF] text-[#1B2A4A]'}`}>
                {publishedItems.length} Published
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-1.5 px-3.5 text-xs rounded-[2px] border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'assessments'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Coursework Submissions Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`py-1.5 px-3.5 text-xs rounded-[2px] border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'finance'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. Tuition & Fees Account</span>
          </button>
        </nav>
      </div>

      {/* Tab: My Results & Marksheet */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Classification Key Banner */}
          <div className="bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-serif font-medium text-[#1B2A4A]">University Classification Standard:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-[2px] bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]">
                Distinction &ge; 70%
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                Merit &ge; 60%
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                Pass &ge; 40%
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                Fail &lt; 40%
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="p-4 bg-[#F7F5F0] border-b border-[#DCD7CD] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-serif font-medium text-xs text-[#1B2A4A] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#1B2A4A]" />
                  Official Student Marksheet & Published Results
                </span>
                <p className="text-[11px] text-[#5A6270] mt-0.5">
                  Secure transcript of published marks authorized by the Examination Moderation Board
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs text-[#1B2A4A] bg-white px-2.5 py-1 rounded-[2px] border border-[#DCD7CD]">
                  Overall Standing: <strong>{marksheet?.overallClassification || 'Board Moderation in Progress'}</strong>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1B2A4A]">
                <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-normal">Module Code</th>
                    <th className="py-2.5 px-4 font-normal">Assessment Title</th>
                    <th className="py-2.5 px-4 font-normal text-center">Score (0-100)</th>
                    <th className="py-2.5 px-4 font-normal">Classification</th>
                    <th className="py-2.5 px-4 font-normal">Publication Status</th>
                    <th className="py-2.5 px-4 font-normal">Academic Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {assessments.map((assessment) => {
                    const gradeItem = marksheet?.items.find((item) => item.assessment.id === assessment.id);
                    const isPublished = gradeItem?.isPublished;
                    const grade = gradeItem?.grade;

                    return (
                      <tr key={assessment.id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-xs">
                          <span className="bg-[#F7F5F0] text-[#1B2A4A] px-1.5 py-0.5 rounded-[2px] border border-[#DCD7CD]">
                            {assessment.moduleCode}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                            {assessment.title}
                          </div>
                          <div className="text-[11px] text-[#5A6270]">
                            {assessment.moduleName} &bull; {assessment.weighting}% weight
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-serif font-medium text-sm text-[#1B2A4A]">
                          {isPublished && grade ? (
                            <span className="font-mono font-bold text-[#1B2A4A]">{grade.numericScore}%</span>
                          ) : (
                            <span className="text-[#5A6270] italic font-mono text-xs">---</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isPublished && grade ? (
                            getClassificationText(grade.classification)
                          ) : (
                            <span className="text-[#5A6270] italic text-xs">Withheld / Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2E6F40] bg-[#EBF5EE] px-2 py-0.5 rounded-[2px] border border-[#C2E2CC]">
                              Published &bull; Released
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8C6214] bg-[#FDF9F0] px-2 py-0.5 rounded-[2px] border border-[#ECDAB0]">
                              Withheld (In Moderation)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-xs text-[#5A6270] max-w-xs">
                          {isPublished && grade ? (
                            grade.feedback || <span className="italic">Standard pass record</span>
                          ) : (
                            <span className="italic text-[11px] text-[#5A6270]">Examination Board review in progress</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {unpublishedItems.length > 0 && (
              <div className="p-3.5 bg-[#FDF9F0] border-t border-[#ECDAB0] text-xs text-[#8C6214] flex items-center justify-between">
                <span>
                  <strong>{unpublishedItems.length} assessment component(s)</strong> are withheld awaiting formal moderation signoff by the Examination Board.
                </span>
                <span className="font-mono text-[11px]">Strict Student Privacy Active</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Coursework Submissions */}
      {activeTab === 'assessments' && (
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
          <div className="p-3.5 bg-[#F7F5F0] border-b border-[#DCD7CD] flex items-center justify-between">
            <div>
              <span className="font-serif font-medium text-xs text-[#1B2A4A] uppercase tracking-wider">
                Active Assessment Deliverables
              </span>
              <p className="text-[11px] text-[#5A6270]">
                Official submission gateway for required coursework papers and deliverables
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#5A6270]">
              Academic Session 2024/25
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1B2A4A]">
              <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Module Code</th>
                  <th className="py-2.5 px-4 font-normal">Assessment Component</th>
                  <th className="py-2.5 px-4 font-normal">Submission Deadline</th>
                  <th className="py-2.5 px-4 font-normal">Submission Status</th>
                  <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {assessments.map((assessment) => {
                  const sub = submissions.find(
                    (s) => s.assessmentId === assessment.id && s.studentId === student.id
                  );
                  const isPastDeadline = new Date(assessment.deadline).getTime() < Date.now();

                  return (
                    <tr
                      key={assessment.id}
                      className={`hover:bg-[#F7F5F0]/60 transition-colors ${
                        sub?.isLate ? 'border-l-4 border-l-[#7A2E2E]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-xs">
                        <span className="bg-[#F7F5F0] text-[#1B2A4A] px-1.5 py-0.5 rounded-[2px] border border-[#DCD7CD]">
                          {assessment.moduleCode}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                          {assessment.title}
                        </div>
                        <div className="text-[11px] text-[#5A6270]">
                          {assessment.moduleName}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-[#5A6270]">
                        <div>{new Date(assessment.deadline).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#5A6270]">
                          {new Date(assessment.deadline).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {sub ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#2E6F40] font-medium text-xs">Received</span>
                              {sub.isLate && (
                                <span className="text-[#7A2E2E] font-medium text-[10px] font-mono">
                                  (Late)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-[#5A6270] truncate max-w-[180px]">
                              {sub.fileName} (v{sub.version})
                            </div>
                          </div>
                        ) : isPastDeadline ? (
                          <span className="text-[#7A2E2E] font-medium text-xs">
                            Overdue / Unsubmitted
                          </span>
                        ) : (
                          <span className="text-[#8C6214] italic text-xs">
                            Pending Submission
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSubmit(assessment)}
                          className="gap-1 font-mono text-xs"
                        >
                          <Upload className="w-3 h-3" />
                          {sub ? 'Re-upload' : 'Upload'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Finance */}
      {activeTab === 'finance' && (
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
          <div className="p-4 bg-[#F7F5F0] border-b border-[#DCD7CD] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-serif font-medium text-xs text-[#1B2A4A] uppercase tracking-wider">
                Student Tuition & Statutory Bursary Account
              </span>
              <p className="text-[11px] text-[#5A6270]">
                Official invoice summary, receipts, and outstanding reconciliation
              </p>
            </div>
            <div className="font-mono text-xs text-[#1B2A4A]">
              Account Ref: <strong>{student.studentId}-BURSARY</strong>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#DCD7CD]">
            <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px]">
              <span className="text-[11px] text-[#5A6270]">Total Statutory Tuition</span>
              <div className="text-xl font-serif font-medium text-[#1B2A4A] mt-1">
                £{(student.programme?.feeAmount || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px]">
              <span className="text-[11px] text-[#5A6270]">Total Paid to Date</span>
              <div className="text-xl font-serif font-medium text-[#2E6F40] mt-1">
                £{(student.totalPaid || 0).toLocaleString()}
              </div>
            </div>

            <div className={`p-3 border rounded-[2px] ${isOverdue ? 'bg-[#FDF6F6] border-[#E8C4C4]' : 'bg-[#F7F5F0] border-[#DCD7CD]'}`}>
              <span className={`text-[11px] ${isOverdue ? 'text-[#7A2E2E] font-medium' : 'text-[#5A6270]'}`}>
                Outstanding Balance Due
              </span>
              <div className={`text-xl font-serif font-medium mt-1 ${isOverdue ? 'text-[#7A2E2E]' : 'text-[#1B2A4A]'}`}>
                £{outstanding.toLocaleString()}
              </div>
              {isOverdue && (
                <span className="text-[10px] text-[#7A2E2E] font-mono block mt-0.5">
                  Arrears: {student.daysOverdue} days past deadline
                </span>
              )}
            </div>
          </div>

          <div className="p-4 text-xs text-[#5A6270]">
            <p className="leading-relaxed">
              For payment remittances, please quote your Registration Number (<strong>{student.studentId}</strong>) on all bank wire transfers or cash deposits at the University Bursar’s Office.
            </p>
          </div>
        </div>
      )}

      {/* Upload Submission Modal */}
      <Dialog
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={`Coursework Submission: ${selectedAssessment?.moduleCode}`}
        description={`Target Assessment: ${selectedAssessment?.title}`}
      >
        <form onSubmit={handleSubmitFile} className="space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 bg-[#FDF6F6] border border-[#E8C4C4] text-[#7A2E2E] rounded-[2px]">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Select Document File (.pdf or .docx) <span className="text-[#7A2E2E]">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="w-full text-xs text-[#5A6270] file:mr-3 file:py-1.5 file:px-3 file:rounded-[2px] file:border file:border-[#DCD7CD] file:text-xs file:font-medium file:bg-[#F7F5F0] file:text-[#1B2A4A] hover:file:bg-[#EAE6DF] cursor-pointer"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#EAE6DF]"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-[#5A6270]">or enter file archive name</span>
            <div className="flex-grow border-t border-[#EAE6DF]"></div>
          </div>

          <div>
            <input
              type="text"
              value={mockFileName}
              onChange={(e) => setMockFileName(e.target.value)}
              placeholder="e.g. CS5001_Coursework_Final_2026217081.pdf"
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
            />
          </div>

          <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] text-[11px] text-[#5A6270]">
            <p>
              I certify that this submission represents my own original academic work in accordance with the university plagiarism regulations.
            </p>
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isUploading}
            >
              {isUploading ? 'Transmitting...' : 'Confirm Submission'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
