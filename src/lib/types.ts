export type EnrolmentStatus = 'Enrolled' | 'Deferred' | 'Withdrawn' | 'Completed';
export type GradeClassification = 'Distinction' | 'Merit' | 'Pass' | 'Fail';
export type UserRole = 'admin' | 'student' | 'teacher';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  designation?: string;
  avatar?: string;
  studentId?: string; // Auto-generated Student ID e.g. SMS-2025-0001
  studentRecordId?: string; // Internal student record id e.g. stud_1
  assignedCourses?: string[];
  lastLogin?: string;
}

export interface RoleDetectionResult {
  role: UserRole;
  confidence: 'exact' | 'high' | 'rule-based' | 'default';
  reason: string;
  matchedUser?: Partial<AuthUser>;
  matchedStudent?: Student;
}

export interface Programme {
  id: string;
  code: string;
  name: string;
  department: string;
  feeAmount: number;
  durationYears: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
  };
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
}

export interface Grade {
  id: string;
  assessmentId: string;
  studentId: string;
  numericScore: number;
  classification: GradeClassification;
  isPublished: boolean;
  feedback?: string | null;
  gradedBy: string;
  gradedAt: string;
  createdAt: string;
  updatedAt: string;
  assessment?: Assessment;
  student?: Student;
}

export interface Submission {
  id: string;
  assessmentId: string;
  studentId: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  fileContentBase64?: string | null;
  submittedAt: string;
  isLate: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  assessment?: Assessment;
  student?: Student;
}

export interface Assessment {
  id: string;
  title: string;
  moduleName: string;
  moduleCode: string;
  academicYear: string;
  deadline: string;
  weighting: number;
  maxScore: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  submissions?: Submission[];
  grades?: Grade[];
  _count?: {
    submissions: number;
    grades: number;
  };
}

export interface Student {
  id: string;
  studentId: string; // Registration No format: Year (4) + Dept Code (3) + Roll No (3), e.g. 2026217081
  fullName: string;
  email: string;
  dateOfBirth: string;
  academicYear: string;
  enrolmentStatus: EnrolmentStatus;
  feeDueDate?: string | null;
  programmeId: string;
  password?: string;
  programme?: Programme;
  payments?: Payment[];
  submissions?: Submission[];
  grades?: Grade[];
  createdAt: string;
  updatedAt: string;
  // Computed registry metadata
  totalPaid?: number;
  outstandingBalance?: number;
  isOverdue?: boolean;
  daysOverdue?: number;
}

export interface RegistryStats {
  totalStudents: number;
  enrolledStudents: number;
  deferredStudents: number;
  withdrawnStudents: number;
  completedStudents: number;
  totalProgrammes: number;
  totalAssessments: number;
  totalFeesBilled: number;
  totalFeesCollected: number;
  totalOutstandingBalance: number;
  overdueStudentsCount: number;
  pendingSubmissionsCount: number;
  gradesPublishedCount: number;
  gradesWithheldCount: number;
}
