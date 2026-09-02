import React, { useState, useMemo } from 'react';
import { Assessment, AuthUser, Grade, GradeClassification, Programme, Student, Submission } from '../../lib/types';
import { buildStudentMarksheet } from '../../lib/marksheet';
import { recordGradeInDB, createAssessmentInDB } from '../../lib/api-sync';
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Plus, 
  Search, 
  Users, 
  Layers,
  Award
} from 'lucide-react';
import { Button, Dialog } from '../ui/primitives';

interface TeacherPortalProps {
  currentUser: AuthUser;
  students: Student[];
  assessments: Assessment[];
  submissions: Submission[];
  grades: Grade[];
  programmes: Programme[];
  onRefresh: () => void;
  onSelectStudentForDetails: (student: Student) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  students,
  assessments,
  submissions,
  grades,
  programmes,
  onRefresh,
  onSelectStudentForDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'assessments' | 'gradebook' | 'students'>('submissions');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Grading Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [gradingSubmission, setGradingSubmission] = useState<{
    submission: Submission;
    student: Student;
    assessment: Assessment;
    existingGrade?: Grade;
  } | null>(null);

  const [numericScore, setNumericScore] = useState<number>(75);
  const [classification, setClassification] = useState<GradeClassification>('Merit');
  const [feedback, setFeedback] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);

  // New Assessment Modal State
  const [isNewAssessmentModalOpen, setIsNewAssessmentModalOpen] = useState<boolean>(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    moduleName: 'Algorithms & Data Structures',
    moduleCode: 'CS-401',
    academicYear: '2024/25',
    deadline: '2026-10-30T23:59',
    weighting: 40,
    maxScore: 100,
    description: '',
  });

  // Automatically adjust classification based on score
  const handleScoreChange = (score: number) => {
    setNumericScore(score);
    if (score >= 70) {
      setClassification('Distinction');
    } else if (score >= 60) {
      setClassification('Merit');
    } else if (score >= 40) {
      setClassification('Pass');
    } else {
      setClassification('Fail');
    }
  };

  // Open Grading Modal for a specific submission
  const handleOpenGradeModal = (sub: Submission) => {
    const student = students.find((s) => s.id === sub.studentId);
    const assessment = assessments.find((a) => a.id === sub.assessmentId);
    const existingGrade = grades.find(
      (g) => g.assessmentId === sub.assessmentId && g.studentId === sub.studentId
    );

    if (student && assessment) {
      setGradingSubmission({ submission: sub, student, assessment, existingGrade });
      if (existingGrade) {
        setNumericScore(existingGrade.numericScore);
        setClassification(existingGrade.classification);
        setFeedback(existingGrade.feedback || '');
        setIsPublished(existingGrade.isPublished);
      } else {
        handleScoreChange(75);
        setFeedback('Comprehensive work demonstrating solid understanding of concepts.');
        setIsPublished(true);
      }
      setIsGradeModalOpen(true);
    }
  };

  // Save Grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    await recordGradeInDB({
      assessmentId: gradingSubmission.assessment.id,
      studentId: gradingSubmission.student.id,
      numericScore: Number(numericScore),
      feedback,
      isPublished,
      gradedBy: currentUser.name,
    });

    setIsGradeModalOpen(false);
    await onRefresh();
  };

  // Handle Create Assessment
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssessment.title.trim()) return;

    await createAssessmentInDB({
      title: newAssessment.title,
      moduleName: newAssessment.moduleName,
      moduleCode: newAssessment.moduleCode,
      academicYear: newAssessment.academicYear,
      deadline: new Date(newAssessment.deadline).toISOString(),
      weighting: Number(newAssessment.weighting),
      maxScore: Number(newAssessment.maxScore),
      description: newAssessment.description,
    });

    setIsNewAssessmentModalOpen(false);
    onRefresh();
  };

  // Quick stats calculation
  const stats = useMemo(() => {
    const totalSubs = submissions.length;
    const gradedCount = grades.length;
    const pendingGrading = Math.max(0, totalSubs - gradedCount);
    const avgScore = grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.numericScore, 0) / grades.length).toFixed(1)
      : '0.0';

    return {
      totalAssessments: assessments.length,
      totalSubmissions: totalSubs,
      pendingGrading,
      gradedCount,
      avgScore,
      totalStudents: students.length,
    };
  }, [assessments, submissions, grades, students]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const student = students.find((s) => s.id === sub.studentId);
      const assessment = assessments.find((a) => a.id === sub.assessmentId);

      const matchesAssessment = selectedAssessmentId === 'all' || sub.assessmentId === selectedAssessmentId;
      const matchesSearch = !searchTerm || (
        student?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student?.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment?.moduleCode.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return matchesAssessment && matchesSearch;
    });
  }, [submissions, students, assessments, selectedAssessmentId, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Faculty Profile Header */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-serif font-medium text-[#1B2A4A] tracking-tight">
                {currentUser.name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                Faculty Member
              </span>
            </div>
            <p className="text-xs text-[#5A6270] mt-1 font-mono">
              {currentUser.department || 'Department of Computer Science & Engineering'} &bull; {currentUser.email}
            </p>
            <p className="text-[11px] text-[#5A6270] mt-0.5">
              Assigned Modules: {currentUser.assignedCourses?.join(', ') || 'CS-401 Algorithms, CS-201 Data Structures, DA-301 Machine Learning'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsNewAssessmentModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Publish Assessment
            </Button>
          </div>
        </div>

        {/* Faculty Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DCD7CD] border-t border-[#DCD7CD] mt-4 pt-4">
          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-[#5A6270] block">Active Modules</span>
            <span className="text-xl font-serif font-medium text-[#1B2A4A] mt-0.5 block">
              {stats.totalAssessments}
            </span>
          </div>

          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-[#5A6270] block">Coursework Received</span>
            <span className="text-xl font-serif font-medium text-[#1B2A4A] mt-0.5 block">
              {stats.totalSubmissions}
            </span>
          </div>

          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-[#7A2E2E] block font-medium">Pending Moderation</span>
            <span className="text-xl font-serif font-medium text-[#7A2E2E] mt-0.5 block">
              {stats.pendingGrading}
            </span>
          </div>

          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-[#5A6270] block">Cohort Mean Score</span>
            <span className="text-xl font-serif font-medium text-[#1B2A4A] mt-0.5 block">
              {stats.avgScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-2">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-1.5 px-3 text-xs rounded-[2px] border transition-colors flex items-center gap-1.5 ${
              activeTab === 'submissions'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Coursework Submissions & Marking</span>
            {stats.pendingGrading > 0 && (
              <span className="px-1 py-0.2 rounded-[2px] text-[10px] font-mono bg-[#7A2E2E] text-white">
                {stats.pendingGrading}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-1.5 px-3 text-xs rounded-[2px] border transition-colors flex items-center gap-1.5 ${
              activeTab === 'assessments'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Assigned Module Papers ({assessments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gradebook')}
            className={`py-1.5 px-3 text-xs rounded-[2px] border transition-colors flex items-center gap-1.5 ${
              activeTab === 'gradebook'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Faculty Gradebook</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-1.5 px-3 text-xs rounded-[2px] border transition-colors flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Cohort Directory ({students.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Submissions & Grading */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5A6270]">Filter by Assessment:</span>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="py-1 px-2 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white font-mono"
              >
                <option value="all">All Modules ({assessments.length})</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.moduleCode} - {a.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5A6270] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate name or ID..."
                className="pl-8 pr-3 py-1 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-[#F7F5F0]/50"
              />
            </div>
          </div>

          <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1B2A4A]">
                <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-normal">Candidate / Student</th>
                    <th className="py-2.5 px-4 font-normal">Assessment Module</th>
                    <th className="py-2.5 px-4 font-normal">Submitted Document</th>
                    <th className="py-2.5 px-4 font-normal">Submission Timestamp</th>
                    <th className="py-2.5 px-4 font-normal text-center">Evaluated Mark</th>
                    <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#5A6270]">
                        No coursework submissions found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const student = students.find((s) => s.id === sub.studentId);
                      const assessment = assessments.find((a) => a.id === sub.assessmentId);
                      const grade = grades.find(
                        (g) => g.assessmentId === sub.assessmentId && g.studentId === sub.studentId
                      );

                      return (
                        <tr
                          key={sub.id}
                          className={`hover:bg-[#F7F5F0]/60 transition-colors ${
                            sub.isLate ? 'border-l-4 border-l-[#7A2E2E] bg-[#FDF6F6]/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                              {student?.fullName || 'Unknown'}
                            </div>
                            <div className="text-[11px] text-[#5A6270] font-mono">
                              {student?.studentId}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono text-xs text-[#5A6270]">
                              {assessment?.moduleCode}
                            </div>
                            <div className="font-medium text-xs text-[#1B2A4A]">
                              {assessment?.title}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-xs text-[#1B2A4A]">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#5A6270]" />
                              <span className="truncate max-w-[170px]">{sub.fileName}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-xs font-mono text-[#5A6270]">
                            <div>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                            {sub.isLate && (
                              <span className="text-[#7A2E2E] font-medium text-[10px]">
                                Late Submission
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {grade ? (
                              <div>
                                <span className="font-serif font-medium text-sm text-[#1B2A4A]">
                                  {grade.numericScore}%
                                </span>
                                <div className="text-[10px] text-[#5A6270] font-serif">
                                  {grade.classification}
                                </div>
                                <span className={`inline-block mt-1 text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] border ${
                                  grade.isPublished
                                    ? 'bg-[#F2F7F3] text-[#2E6F40] border-[#C8E0CD]'
                                    : 'bg-[#FDF9F0] text-[#8C6214] border-[#ECDAB0]'
                                }`}>
                                  {grade.isPublished ? 'Published' : 'Withheld'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#8C6214] italic text-xs font-mono">
                                Ungraded
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenGradeModal(sub)}
                              className="text-[#1B2A4A] hover:underline font-mono text-xs"
                            >
                              {grade ? 'Edit Mark' : 'Evaluate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Assessments */}
      {activeTab === 'assessments' && (
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1B2A4A]">
              <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Module Code</th>
                  <th className="py-2.5 px-4 font-normal">Assessment Title</th>
                  <th className="py-2.5 px-4 font-normal">Academic Session</th>
                  <th className="py-2.5 px-4 font-normal">Submission Deadline</th>
                  <th className="py-2.5 px-4 font-normal text-center">Submissions</th>
                  <th className="py-2.5 px-4 font-normal text-right">Max Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {assessments.map((a) => {
                  const subCount = submissions.filter((s) => s.assessmentId === a.id).length;
                  return (
                    <tr key={a.id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-xs">
                        <span className="bg-[#F7F5F0] text-[#1B2A4A] px-1.5 py-0.5 rounded-[2px] border border-[#DCD7CD]">
                          {a.moduleCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-serif font-medium text-xs text-[#1B2A4A]">{a.title}</div>
                        <div className="text-[11px] text-[#5A6270]">{a.moduleName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#5A6270]">{a.academicYear || '2024/25'}</td>
                      <td className="py-3 px-4 font-mono text-[#5A6270]">{new Date(a.deadline).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-center font-mono">{subCount} of {students.length}</td>
                      <td className="py-3 px-4 text-right font-serif font-medium">{a.maxScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Gradebook */}
      {activeTab === 'gradebook' && (
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
          <div className="p-4 bg-[#F7F5F0] border-b border-[#DCD7CD] flex items-center justify-between">
            <span className="font-serif font-medium text-xs text-[#1B2A4A] uppercase tracking-wider">
              Consolidated Academic Gradebook
            </span>
            <span className="text-[11px] font-mono text-[#5A6270]">
              Official Moderation Ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1B2A4A]">
              <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Candidate / Student</th>
                  <th className="py-2.5 px-4 font-normal">Programme</th>
                  <th className="py-2.5 px-4 font-normal text-center">Assessments Graded</th>
                  <th className="py-2.5 px-4 font-normal text-center">Mean Score</th>
                  <th className="py-2.5 px-4 font-normal">Classification</th>
                  <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {students.map((student) => {
                  const ms = buildStudentMarksheet(student.id, students, assessments, submissions, grades);
                  return (
                    <tr key={student.id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                          {student.fullName}
                        </div>
                        <div className="text-[11px] text-[#5A6270] font-mono">
                          {student.studentId}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-[#5A6270]">
                        {student.programme?.code}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        {ms.totalGraded} / {ms.items.length}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {ms.averageScore !== null ? (
                          <span className="font-serif font-medium text-sm text-[#1B2A4A]">
                            {ms.averageScore}%
                          </span>
                        ) : (
                          <span className="text-[#5A6270] font-mono">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-serif text-xs">
                        {ms.overallClassification || <span className="text-[#5A6270] italic">Incomplete</span>}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectStudentForDetails(student)}
                          className="text-[#1B2A4A] hover:underline font-mono text-xs"
                        >
                          Inspect Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Students */}
      {activeTab === 'students' && (
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1B2A4A]">
              <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Registration No</th>
                  <th className="py-2.5 px-4 font-normal">Candidate Name & Email</th>
                  <th className="py-2.5 px-4 font-normal">Programme</th>
                  <th className="py-2.5 px-4 font-normal">Standing</th>
                  <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium">
                      <span className="bg-[#F7F5F0] text-[#1B2A4A] px-1.5 py-0.5 rounded-[2px] border border-[#DCD7CD]">
                        {student.studentId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-serif font-medium text-xs text-[#1B2A4A]">{student.fullName}</div>
                      <div className="text-[11px] text-[#5A6270] font-mono">{student.email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">{student.programme?.name}</td>
                    <td className="py-3 px-4 text-xs font-medium text-[#2E6F40]">{student.enrolmentStatus}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectStudentForDetails(student)}
                        className="text-[#1B2A4A] hover:underline font-mono text-xs"
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Evaluation Dialog */}
      <Dialog
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={`Evaluate Coursework: ${gradingSubmission?.assessment.moduleCode}`}
        description={`Candidate: ${gradingSubmission?.student.fullName} (${gradingSubmission?.student.studentId})`}
      >
        <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
          <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] grid grid-cols-2 gap-2">
            <div>
              <span className="text-[#5A6270]">Module:</span>
              <div className="font-medium text-[#1B2A4A] mt-0.5">
                {gradingSubmission?.assessment.title}
              </div>
            </div>
            <div>
              <span className="text-[#5A6270]">Document:</span>
              <div className="font-mono text-[#1B2A4A] mt-0.5 truncate">
                {gradingSubmission?.submission.fileName}
              </div>
            </div>
          </div>

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
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-serif text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Honours Classification
              </label>
              <div className="p-2 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] font-serif font-medium text-[#1B2A4A]">
                {classification}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Faculty Evaluative Comments
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Qualitative feedback on academic rigour and analysis..."
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded-[2px] border-[#DCD7CD] text-[#1B2A4A]"
              />
              <span className="text-[#1B2A4A]">Publish score to student academic portal immediately</span>
            </label>
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGradeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Record Evaluation
            </Button>
          </div>
        </form>
      </Dialog>

      {/* New Assessment Modal */}
      <Dialog
        isOpen={isNewAssessmentModalOpen}
        onClose={() => setIsNewAssessmentModalOpen(false)}
        title="Publish Module Assessment"
        description="Register a new coursework assessment component for student submissions."
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Module Code <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="text"
                required
                value={newAssessment.moduleCode}
                onChange={(e) => setNewAssessment({ ...newAssessment, moduleCode: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Module Name <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="text"
                required
                value={newAssessment.moduleName}
                onChange={(e) => setNewAssessment({ ...newAssessment, moduleName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Assessment Title <span className="text-[#7A2E2E]">*</span>
            </label>
            <input
              type="text"
              required
              value={newAssessment.title}
              onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
              placeholder="e.g. Mid-Term Coursework: Distributed Systems"
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Deadline <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={newAssessment.deadline}
                onChange={(e) => setNewAssessment({ ...newAssessment, deadline: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Max Marks
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newAssessment.maxScore}
                onChange={(e) => setNewAssessment({ ...newAssessment, maxScore: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Brief & Rubrics
            </label>
            <textarea
              rows={3}
              value={newAssessment.description}
              onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewAssessmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Publish
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
