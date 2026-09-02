import React, { useState } from 'react';
import { Button, Dialog } from '../ui/primitives';
import { Assessment, Submission, Student } from '../../lib/types';
import { submitAssessmentInDB, createAssessmentInDB } from '../../lib/api-sync';
import {
  FileText,
  Upload,
  PlusCircle,
  Clock,
  CheckCircle2,
  FileCheck,
  Calendar,
  Layers,
  History,
  Download
} from 'lucide-react';

interface AssessmentSubmissionProps {
  assessments: Assessment[];
  submissions: Submission[];
  students: Student[];
  currentStudentId: string;
  role: 'staff' | 'student';
  onRefresh: () => void;
}

export const AssessmentSubmission: React.FC<AssessmentSubmissionProps> = ({
  assessments,
  submissions,
  students,
  currentStudentId,
  role,
  onRefresh,
}) => {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );

  // Staff: Create Assessment Modal
  const [isCreateAssessmentModalOpen, setIsCreateAssessmentModalOpen] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    moduleCode: 'CS5001',
    moduleName: 'Advanced Software Engineering',
    description: '',
    deadlineDate: '2026-10-15',
    deadlineTime: '23:59',
    maxScore: 100,
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // File Submission Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitTargetAssessment, setSubmitTargetAssessment] = useState<Assessment | null>(null);
  const [selectedStudentForStaffUpload, setSelectedStudentForStaffUpload] = useState<string>(
    currentStudentId || students[0]?.id || ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mockFileNameInput, setMockFileNameInput] = useState('');

  const currentAssessment =
    assessments.find((a) => a.id === selectedAssessmentId) || assessments[0];

  // Check submissions for current assessment
  const assessmentSubmissions = submissions.filter(
    (sub) => sub.assessmentId === currentAssessment?.id
  );

  // Compute student matrix for current assessment
  const studentSubmissionMatrix = students.map((student) => {
    const existingSub = submissions.find(
      (sub) =>
        sub.assessmentId === currentAssessment?.id && sub.studentId === student.id
    );
    return {
      student,
      submission: existingSub || null,
    };
  });

  const handleOpenSubmitModal = (assessment: Assessment, preselectedStudentId?: string) => {
    setSubmitTargetAssessment(assessment);
    setSelectedStudentForStaffUpload(preselectedStudentId || currentStudentId || students[0]?.id || '');
    setSelectedFile(null);
    setMockFileNameInput('');
    setUploadError(null);
    setIsSubmitModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate Extension (.pdf or .docx)
    const validExtensions = ['.pdf', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setUploadError(
        `Invalid file format "${ext}". The registry submission gateway accepts only PDF (.pdf) and Word documents (.docx).`
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File exceeds maximum upload limit of 25MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setMockFileNameInput(file.name);
  };

  const handleSimulatedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTargetAssessment) return;
    setUploadError(null);

    const fileNameToUse =
      selectedFile?.name ||
      (mockFileNameInput.trim() ? mockFileNameInput.trim() : null);

    if (!fileNameToUse) {
      setUploadError('Please select or upload a valid coursework file.');
      return;
    }

    const ext = fileNameToUse.substring(fileNameToUse.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      setUploadError('File extension must be strictly .pdf or .docx');
      return;
    }

    const studentIdToUse =
      role === 'student' ? currentStudentId : selectedStudentForStaffUpload;

    if (!studentIdToUse) {
      setUploadError('Please select a student record.');
      return;
    }

    setUploadProgress(true);

    try {
      const result = await submitAssessmentInDB({
        assessmentId: submitTargetAssessment.id,
        studentId: studentIdToUse,
        fileName: fileNameToUse,
        fileSize: selectedFile?.size || 2450000,
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
      setUploadError(err.message || 'Submission failed.');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleCreateAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    try {
      if (!assessmentForm.title.trim()) {
        throw new Error('Please enter assessment coursework title.');
      }

      const isoDeadline = `${assessmentForm.deadlineDate}T${assessmentForm.deadlineTime}:00Z`;

      await createAssessmentInDB({
        title: assessmentForm.title.trim(),
        moduleCode: assessmentForm.moduleCode.trim().toUpperCase(),
        moduleName: assessmentForm.moduleName.trim(),
        description: assessmentForm.description.trim(),
        deadline: isoDeadline,
        maxScore: Number(assessmentForm.maxScore) || 100,
      });

      setIsCreateAssessmentModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create assessment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-serif font-medium text-[#1B2A4A] tracking-tight">
                Coursework & Examination Submissions
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                {assessments.length} Active Modules
              </span>
            </div>
            <p className="text-xs text-[#5A6270] mt-1">
              Official assessment mandates, coursework document reception gateway, version archive, and submission timestamp audit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateAssessmentModalOpen(true)}
              className="gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Publish Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Assessment Directory & Submission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assessment Module Directory */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="p-3 bg-[#F7F5F0] border-b border-[#DCD7CD] flex items-center justify-between">
              <span className="font-serif font-medium text-xs text-[#1B2A4A] uppercase tracking-wider">
                Module Assessment Registry
              </span>
              <span className="text-[11px] font-mono text-[#5A6270]">
                {assessments.length} Available
              </span>
            </div>

            <div className="divide-y divide-[#EAE6DF]">
              {assessments.map((a) => {
                const isSelected = a.id === currentAssessment?.id;
                const deadline = new Date(a.deadline);
                const subCount = submissions.filter((s) => s.assessmentId === a.id).length;

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssessmentId(a.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#F7F5F0] border-l-4 border-l-[#1B2A4A]'
                        : 'hover:bg-[#F7F5F0]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-[#1B2A4A]">
                        {a.moduleCode}
                      </span>
                      <span className="text-[11px] font-mono text-[#5A6270]">
                        {subCount}/{students.length} Received
                      </span>
                    </div>

                    <div className="font-serif font-medium text-xs text-[#1B2A4A] mt-1">
                      {a.title}
                    </div>

                    <div className="text-[11px] text-[#5A6270] mt-1 flex items-center justify-between">
                      <span className="truncate max-w-[170px]">{a.moduleName}</span>
                      <span className="font-mono text-[10px]">
                        Due: {deadline.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Assessment Details & Student Submission Ledger */}
        <div className="lg:col-span-8 space-y-6">
          {currentAssessment && (
            <>
              {/* Assessment Specification Dossier */}
              <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#EAE6DF] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                        {currentAssessment.moduleCode}
                      </span>
                      <h2 className="text-base font-serif font-medium text-[#1B2A4A]">
                        {currentAssessment.title}
                      </h2>
                    </div>
                    <p className="text-xs text-[#5A6270] mt-1 font-medium">
                      Module: {currentAssessment.moduleName}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenSubmitModal(currentAssessment)}
                    className="gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Submission Document
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px]">
                    <span className="text-[#5A6270]">Submission Deadline:</span>
                    <div className="font-mono font-medium text-[#1B2A4A] mt-0.5">
                      {new Date(currentAssessment.deadline).toLocaleDateString()} at{' '}
                      {new Date(currentAssessment.deadline).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px]">
                    <span className="text-[#5A6270]">Maximum Marks:</span>
                    <div className="font-serif font-medium text-[#1B2A4A] mt-0.5">
                      {currentAssessment.maxScore} Marks (100% Component)
                    </div>
                  </div>

                  <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px]">
                    <span className="text-[#5A6270]">Accepted Document Formats:</span>
                    <div className="font-mono text-[#1B2A4A] mt-0.5">
                      PDF (.pdf), MS Word (.docx)
                    </div>
                  </div>
                </div>

                {currentAssessment.description && (
                  <div className="mt-4 text-xs text-[#5A6270] leading-relaxed border-t border-[#EAE6DF] pt-3">
                    <span className="font-serif font-medium text-[#1B2A4A] block mb-1">
                      Assessment Brief & Instructions:
                    </span>
                    {currentAssessment.description}
                  </div>
                )}
              </div>

              {/* Student Submission Roster Table */}
              <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
                <div className="p-3.5 bg-[#F7F5F0] border-b border-[#DCD7CD] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-serif font-medium text-[#1B2A4A] uppercase tracking-wider">
                      Cohort Submission & Verification Roster
                    </h3>
                    <p className="text-[11px] text-[#5A6270]">
                      Document receipts, version history, and timestamp validation
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[#5A6270]">
                    {assessmentSubmissions.length} of {students.length} received
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#1B2A4A]">
                    <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 font-normal">Candidate / Student</th>
                        <th className="py-2.5 px-4 font-normal">Status & Timestamp</th>
                        <th className="py-2.5 px-4 font-normal">Submitted Document</th>
                        <th className="py-2.5 px-4 font-normal">Ver.</th>
                        <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE6DF]">
                      {studentSubmissionMatrix.map(({ student, submission }) => {
                        return (
                          <tr
                            key={student.id}
                            className={`hover:bg-[#F7F5F0]/60 transition-colors ${
                              submission?.isLate ? 'border-l-4 border-l-[#7A2E2E] bg-[#FDF6F6]/30' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                                {student.fullName}
                              </div>
                              <div className="text-[11px] text-[#5A6270] font-mono">
                                {student.studentId}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {submission ? (
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[#2E6F40] font-medium text-xs">Received</span>
                                    {submission.isLate && (
                                      <span className="text-[#7A2E2E] font-medium text-[10px] font-mono">
                                        (Late Submission)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#5A6270] font-mono mt-0.5">
                                    {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                                    {new Date(submission.submittedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[#8C6214] italic text-xs">
                                  Pending Submission
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {submission ? (
                                <div className="font-mono text-xs text-[#1B2A4A] flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-[#5A6270]" />
                                  <span className="truncate max-w-[190px]">{submission.fileName}</span>
                                </div>
                              ) : (
                                <span className="text-[#5A6270] font-mono text-[11px]">-</span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono text-xs text-[#5A6270]">
                              {submission ? `v${submission.version}` : '-'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenSubmitModal(currentAssessment, student.id)}
                                className="text-[#1B2A4A] hover:underline font-mono text-xs"
                              >
                                {submission ? 'Re-upload' : 'Upload'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Publish New Assessment Modal */}
      <Dialog
        isOpen={isCreateAssessmentModalOpen}
        onClose={() => setIsCreateAssessmentModalOpen(false)}
        title="Publish Examination / Coursework Assessment"
        description="Register a new academic assessment component in the university registry."
      >
        <form onSubmit={handleCreateAssessmentSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 bg-[#FDF6F6] border border-[#E8C4C4] text-[#7A2E2E] rounded-[2px]">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Module Code <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="text"
                required
                value={assessmentForm.moduleCode}
                onChange={(e) =>
                  setAssessmentForm({ ...assessmentForm, moduleCode: e.target.value })
                }
                placeholder="e.g. CS5001"
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Module Title <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="text"
                required
                value={assessmentForm.moduleName}
                onChange={(e) =>
                  setAssessmentForm({ ...assessmentForm, moduleName: e.target.value })
                }
                placeholder="e.g. Advanced Software Architecture"
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Assessment Component Title <span className="text-[#7A2E2E]">*</span>
            </label>
            <input
              type="text"
              required
              value={assessmentForm.title}
              onChange={(e) =>
                setAssessmentForm({ ...assessmentForm, title: e.target.value })
              }
              placeholder="e.g. Coursework 1: Distributed Systems Specification"
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Assessment Specification & Rubric Brief
            </label>
            <textarea
              rows={3}
              value={assessmentForm.description}
              onChange={(e) =>
                setAssessmentForm({ ...assessmentForm, description: e.target.value })
              }
              placeholder="Describe requirements, deliverables, page limits, and citation guidelines..."
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Final Submission Deadline <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="date"
                required
                value={assessmentForm.deadlineDate}
                onChange={(e) =>
                  setAssessmentForm({ ...assessmentForm, deadlineDate: e.target.value })
                }
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Maximum Score (Weight)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={assessmentForm.maxScore}
                onChange={(e) =>
                  setAssessmentForm({ ...assessmentForm, maxScore: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateAssessmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Publish Assessment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Upload Coursework Document Modal */}
      <Dialog
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={`Coursework Submission: ${submitTargetAssessment?.moduleCode}`}
        description={`Target Assessment: ${submitTargetAssessment?.title}`}
      >
        <form onSubmit={handleSimulatedSubmit} className="space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 bg-[#FDF6F6] border border-[#E8C4C4] text-[#7A2E2E] rounded-[2px]">
              {uploadError}
            </div>
          )}

          {role === 'staff' && (
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Submitting for Student Record:
              </label>
              <select
                value={selectedStudentForStaffUpload}
                onChange={(e) => setSelectedStudentForStaffUpload(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white font-mono"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentId})
                  </option>
                ))}
              </select>
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
              value={mockFileNameInput}
              onChange={(e) => setMockFileNameInput(e.target.value)}
              placeholder="e.g. CS5001_Coursework_Final_2026217081.pdf"
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
            />
          </div>

          <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] text-[11px] text-[#5A6270]">
            <p>
              By uploading this document, an official verification timestamp and version hash will be logged in the examination archive.
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
              disabled={uploadProgress}
            >
              {uploadProgress ? 'Transmitting...' : 'Confirm Submission'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
