import React, { useState } from 'react';
import { Button, Dialog } from '../ui/primitives';
import { Student, Programme, EnrolmentStatus } from '../../lib/types';
import { createStudentInDB, updateStudentInDB } from '../../lib/api-sync';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import {
  UserPlus,
  Search,
  Users,
  Mail,
  Download,
  Key,
  KeyRound
} from 'lucide-react';

interface StudentEnrolmentProps {
  students: Student[];
  programmes: Programme[];
  onRefresh: () => void;
  onSelectStudentForDetails: (student: Student) => void;
}

export const StudentEnrolment: React.FC<StudentEnrolmentProps> = ({
  students,
  programmes,
  onRefresh,
  onSelectStudentForDetails,
}) => {
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Enrolment Modal State
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);
  const [previewStudentId, setPreviewStudentId] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '2004-01-15',
    programmeId: programmes[0]?.id || '',
    academicYear: '2024/25',
    enrolmentStatus: 'Enrolled' as EnrolmentStatus,
    password: 'student123',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Change Dialog
  const [statusModalStudent, setStatusModalStudent] = useState<Student | null>(null);
  const [newStatus, setNewStatus] = useState<EnrolmentStatus>('Enrolled');

  // Password Change Dialog for Registry Team
  const [passwordTargetStudent, setPasswordTargetStudent] = useState<Student | null>(null);

  // Filter logic
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgramme =
      selectedProgramme === 'all' || student.programmeId === selectedProgramme;

    const matchesStatus =
      selectedStatus === 'all' || student.enrolmentStatus === selectedStatus;

    return matchesSearch && matchesProgramme && matchesStatus;
  });

  const handleOpenEnrolModal = () => {
    // Cosmetic preview only - the server always assigns the authoritative,
    // collision-checked Student ID when the record is actually created.
    const nextId = `SMS-2025-${String(students.length + 1).padStart(4, '0')}`;
    setPreviewStudentId(nextId);
    setFormData({
      fullName: '',
      email: '',
      dateOfBirth: '2004-01-15',
      programmeId: programmes[0]?.id || '',
      academicYear: '2024/25',
      enrolmentStatus: 'Enrolled',
      password: 'student123',
    });
    setErrorMessage(null);
    setIsEnrolModalOpen(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (!formData.fullName.trim()) {
        throw new Error('Please enter the student’s full name.');
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        throw new Error('Please enter a valid academic email address.');
      }
      if (!formData.dateOfBirth) {
        throw new Error('Please specify date of birth.');
      }
      if (!formData.programmeId) {
        throw new Error('Please select an academic degree programme.');
      }
      if (!formData.password || formData.password.trim().length < 4) {
        throw new Error('Please specify a student portal password (at least 4 characters).');
      }

      // Save student directly to PostgreSQL database via API route.
      // studentId is intentionally omitted - the server generates and
      // collision-checks the authoritative Student ID.
      const saved = await createStudentInDB({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        dateOfBirth: formData.dateOfBirth,
        programmeId: formData.programmeId,
        academicYear: formData.academicYear,
        enrolmentStatus: formData.enrolmentStatus,
        password: formData.password.trim(),
      });

      if (!saved) {
        throw new Error('Failed to save student to the database.');
      }

      setIsEnrolModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during enrolment registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusModalStudent) return;
    try {
      const result = await updateStudentInDB(statusModalStudent.id, { enrolmentStatus: newStatus });
      if (!result) {
        throw new Error('Failed to update student status in the database.');
      }
      setStatusModalStudent(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update student status');
    }
  };

  const getStatusDisplay = (status: EnrolmentStatus) => {
    switch (status) {
      case 'Enrolled':
        return <span className="text-[#2E6F40] font-medium text-xs">Enrolled</span>;
      case 'Deferred':
        return <span className="text-[#8C6214] font-medium text-xs">Deferred</span>;
      case 'Withdrawn':
        return <span className="text-[#7A2E2E] font-medium text-xs">Withdrawn</span>;
      case 'Completed':
        return <span className="text-[#4A2B68] font-medium text-xs">Completed / Graduated</span>;
      default:
        return <span className="text-[#5A6270] text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action Bar */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-serif font-medium text-[#1B2A4A] tracking-tight">
                Student Enrolment Register
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                {students.length} Student Records
              </span>
            </div>
            <p className="text-xs text-[#5A6270] mt-1">
              Official university student enrolment register, academic progression status, and student records archive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              id="add-new-student-btn"
              onClick={handleOpenEnrolModal}
              className="gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Add New Student
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-[#5A6270] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, Student ID (e.g. SMS-2025-0001), or email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-[#F7F5F0]/50"
            />
          </div>

          {/* Programme Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
            >
              <option value="all">All Programmes ({programmes.length})</option>
              {programmes.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.code} - {prog.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
            >
              <option value="all">All Enrolment Statuses</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Deferred">Deferred</option>
              <option value="Withdrawn">Withdrawn</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1B2A4A]">
            <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-normal">Student ID</th>
                <th className="py-2.5 px-4 font-normal">Student Name & Email</th>
                <th className="py-2.5 px-4 font-normal">Programme</th>
                <th className="py-2.5 px-4 font-normal">Academic Year</th>
                <th className="py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4 font-normal text-right">Outstanding Fee</th>
                <th className="py-2.5 px-4 font-normal text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#5A6270]">
                    <Users className="w-6 h-6 mx-auto mb-2 text-[#C5BFB5]" />
                    No matriculation records match the specified search parameters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-[#F7F5F0]/60 transition-colors ${
                      student.isOverdue ? 'border-l-4 border-l-[#7A2E2E]' : ''
                    }`}
                  >
                    {/* Student ID */}
                    <td className="py-3 px-4 font-mono font-medium text-xs">
                      <span className="bg-[#F7F5F0] text-[#1B2A4A] px-1.5 py-0.5 rounded-[2px] border border-[#DCD7CD]">
                        {student.studentId}
                      </span>
                    </td>

                    {/* Name & Email */}
                    <td className="py-3 px-4">
                      <div className="font-serif font-medium text-sm text-[#1B2A4A]">{student.fullName}</div>
                      <div className="text-[11px] text-[#5A6270] flex items-center gap-1 mt-0.5 font-mono">
                        <Mail className="w-3 h-3 text-[#5A6270]" />
                        {student.email}
                      </div>
                    </td>

                    {/* Programme */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-xs text-[#1B2A4A]">
                        {student.programme?.name || 'Unassigned'}
                      </div>
                      <div className="text-[11px] text-[#5A6270]">
                        {student.programme?.department}
                      </div>
                    </td>

                    {/* Academic Year */}
                    <td className="py-3 px-4 font-mono text-[#5A6270]">
                      {student.academicYear}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusDisplay(student.enrolmentStatus)}
                    </td>

                    {/* Outstanding Balance */}
                    <td className="py-3 px-4 text-right">
                      <div className={`font-serif font-medium text-xs ${student.isOverdue ? 'text-[#7A2E2E]' : 'text-[#1B2A4A]'}`}>
                        £{student.outstandingBalance?.toLocaleString()}
                      </div>
                      {student.isOverdue && (
                        <span className="text-[10px] text-[#7A2E2E] font-medium">
                          {student.daysOverdue}d Arrears
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectStudentForDetails(student)}
                          className="text-[#1B2A4A] hover:underline font-mono text-xs"
                          title="Open matriculation dossier"
                        >
                          Dossier
                        </button>
                        <span className="text-[#DCD7CD]">|</span>
                        <button
                          onClick={() => {
                            setStatusModalStudent(student);
                            setNewStatus(student.enrolmentStatus);
                          }}
                          className="text-[#5A6270] hover:text-[#1B2A4A] hover:underline text-xs"
                          title="Change academic progression status"
                        >
                          Standing
                        </button>
                        <span className="text-[#DCD7CD]">|</span>
                        <button
                          onClick={() => setPasswordTargetStudent(student)}
                          className="text-[#1B2A4A] hover:text-[#7A2E2E] hover:underline text-xs flex items-center gap-0.5"
                          title="Change or reset student portal password"
                        >
                          <KeyRound className="w-3 h-3 text-[#1B2A4A]" />
                          Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrol New Student Modal */}
      <Dialog
        isOpen={isEnrolModalOpen}
        onClose={() => setIsEnrolModalOpen(false)}
        title="Add New Student Record"
        description="Register a new student into the university student records database."
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-[#FDF6F6] border border-[#E8C4C4] text-[#7A2E2E] rounded-[2px]">
              {errorMessage}
            </div>
          )}

          <div className="bg-[#F7F5F0] p-3 border border-[#DCD7CD] rounded-[2px] flex items-center justify-between">
            <span className="text-[#5A6270]">Auto-Generated Student ID:</span>
            <span className="font-mono font-medium text-sm text-[#1B2A4A] bg-white px-2 py-0.5 rounded-[2px] border border-[#DCD7CD]">
              {previewStudentId || 'SMS-2025-0006'}
            </span>
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Full Legal Name <span className="text-[#7A2E2E]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g., Kazi Farhan Ahmed"
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Academic Email Address <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kazi.ahmed@univ.edu.bd"
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Date of Birth <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Degree Programme of Study <span className="text-[#7A2E2E]">*</span>
            </label>
            <select
              value={formData.programmeId}
              onChange={(e) => {
                const progId = e.target.value;
                setFormData({ ...formData, programmeId: progId });
                setPreviewStudentId(`SMS-2025-${String(students.length + 1).padStart(4, '0')}`);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
            >
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name} ({p.department}) &bull; Statutory Fee: £{p.feeAmount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Initial Standing
              </label>
              <select
                value={formData.enrolmentStatus}
                onChange={(e) =>
                  setFormData({ ...formData, enrolmentStatus: e.target.value as EnrolmentStatus })
                }
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
              >
                <option value="Enrolled">Active Enrolled</option>
                <option value="Deferred">Deferred Entry</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#F0F4F8] border border-[#C5D5E6] rounded-[2px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#1B2A4A] font-medium text-xs">
              <Key className="w-3.5 h-3.5 text-[#1B2A4A]" />
              <span>Student Portal Login Password <span className="text-[#7A2E2E]">*</span></span>
            </div>
            <p className="text-[11px] text-[#5A6270]">
              This password will allow the student to log in to the Student Portal using their email address or Student ID.
            </p>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="e.g., student123 or custom password"
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] bg-white focus:outline-none focus:border-[#1B2A4A] font-mono"
            />
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEnrolModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog
        isOpen={statusModalStudent !== null}
        onClose={() => setStatusModalStudent(null)}
        title="Update Enrolment Status"
        description={`Modify enrolment status for ${statusModalStudent?.fullName} (${statusModalStudent?.studentId}).`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Enrolment Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EnrolmentStatus)}
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
            >
              <option value="Enrolled">Enrolled</option>
              <option value="Deferred">Deferred</option>
              <option value="Withdrawn">Withdrawn</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] text-[#5A6270]">
            <p>
              Status updates take immediate effect across all registry marksheets, exam board rosters, and fee billing schedules.
            </p>
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalStudent(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUpdateStatus}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Change Password Modal for Registry Team */}
      <ChangePasswordModal
        isOpen={Boolean(passwordTargetStudent)}
        onClose={() => setPasswordTargetStudent(null)}
        targetStudentId={passwordTargetStudent?.studentId}
        targetStudentName={passwordTargetStudent?.fullName}
        onPasswordChanged={onRefresh}
      />
    </div>
  );
};
