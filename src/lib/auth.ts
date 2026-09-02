import { AuthUser, RoleDetectionResult, Student, UserRole } from './types';

export const DEMO_PRESET_USERS: AuthUser[] = [
  // 1. The Registry Team (Staff)
  {
    id: 'user_registry_1',
    email: 'registry@university.edu',
    name: 'Academic Registry & Admissions Team',
    role: 'admin',
    department: 'Central Academic Registry & Examination Board',
    designation: 'Registry Officer & Academic Controller',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_registry_2',
    email: 'admin@university.edu',
    name: 'Office of the Registrar',
    role: 'admin',
    department: 'Division of Academic Records & Student Finance',
    designation: 'University Registrar',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  // 2. Students
  {
    id: 'user_student_1',
    email: 'minhajul.khan@university.edu',
    name: 'Minhajul Khan',
    role: 'student',
    studentId: 'SMS-2025-0001',
    studentRecordId: 'stud_1',
    department: 'BSc (Hons) Computer Science',
    designation: 'Enrolled Student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_student_2',
    email: 'nusrat.jahan@university.edu',
    name: 'Nusrat Jahan',
    role: 'student',
    studentId: 'SMS-2025-0002',
    studentRecordId: 'stud_2',
    department: 'BSc (Hons) Computer Science',
    designation: 'Enrolled Student (Arrears Notice)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  }
];

const AUTH_STORAGE_KEY = 'sms_auth_user_session_v2025';

/**
 * Automatically determines user role and matching profile from an email address or student ID
 */
export function detectRoleFromEmail(emailInput: string, students: Student[] = []): RoleDetectionResult {
  const email = (emailInput || '').trim().toLowerCase();

  if (!email) {
    return {
      role: 'admin',
      confidence: 'default',
      reason: 'Enter your institutional email or Student ID (e.g. SMS-2025-0001) to sign in.',
    };
  }

  // 1. Direct match with registered students in the database (by email or Student ID like SMS-2025-0001)
  const matchingStudent = students.find((s) => {
    if (!s.email && !s.studentId) return false;
    const sEmail = (s.email || '').trim().toLowerCase();
    const sId = (s.studentId || '').trim().toLowerCase();
    
    if (sEmail && sEmail === email) return true;
    if (sId && sId === email) return true;
    
    // Check local part e.g. minhajul.khan
    const inputLocal = email.split('@')[0];
    const studentLocal = sEmail.split('@')[0];
    if (inputLocal && studentLocal && inputLocal === studentLocal) return true;

    // Check student ID inside input (e.g. sms-2025-0001@... or sms-2025-0001)
    if (sId && (email.includes(sId) || inputLocal === sId)) {
      return true;
    }
    return false;
  });

  if (matchingStudent) {
    return {
      role: 'student',
      confidence: 'exact',
      reason: `Matched enrolled student: ${matchingStudent.fullName} (${matchingStudent.studentId})`,
      matchedStudent: matchingStudent,
      matchedUser: {
        id: `user_${matchingStudent.id}`,
        email: matchingStudent.email,
        name: matchingStudent.fullName,
        role: 'student',
        studentId: matchingStudent.studentId,
        studentRecordId: matchingStudent.id,
        department: matchingStudent.programme?.name || 'Degree Programme',
        designation: `Student (${matchingStudent.academicYear})`,
      }
    };
  }

  // 2. Direct match with preset admin/registry accounts
  const presetAdmin = DEMO_PRESET_USERS.find(
    (u) => u.role === 'admin' && u.email.toLowerCase() === email
  );
  if (presetAdmin) {
    return {
      role: 'admin',
      confidence: 'exact',
      reason: `Verified Registry Staff: ${presetAdmin.name}`,
      matchedUser: presetAdmin,
    };
  }

  // 3. Keyword Detection for Registry Team / Staff
  const registryKeywords = [
    'admin', 'registry', 'registrar', 'staff', 'faculty', 'controller', 
    'officer', 'bursar', 'exam', 'management', 'dean', 'prof', 'teacher'
  ];
  const isRegistryMatch = registryKeywords.some((kw) => email.includes(kw));
  if (isRegistryMatch) {
    const localPart = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = localPart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      role: 'admin',
      confidence: 'rule-based',
      reason: 'Registry / Academic Staff credentials detected',
      matchedUser: {
        id: `user_reg_${Date.now()}`,
        email: email,
        name: formattedName || 'The Registry Team',
        role: 'admin',
        department: 'Central Academic Registry',
        designation: 'Registry Officer & Examination Staff',
      }
    };
  }

  // 4. Keyword Detection for Student
  const studentKeywords = ['student', 'sms-', '2025', '2026', '2024', 'stud', 'ug-'];
  const isStudentMatch = studentKeywords.some((kw) => email.includes(kw));
  if (isStudentMatch) {
    const fallbackStudent = students[0];
    return {
      role: 'student',
      confidence: 'rule-based',
      reason: 'Student identification format detected',
      matchedStudent: fallbackStudent,
      matchedUser: {
        id: `user_stud_${Date.now()}`,
        email: email,
        name: 'Student Account',
        role: 'student',
        studentId: fallbackStudent?.studentId || 'SMS-2025-0001',
        studentRecordId: fallbackStudent?.id || 'stud_1',
        department: fallbackStudent?.programme?.name || 'Undergraduate Programme',
        designation: 'Enrolled Student',
      }
    };
  }

  // Default to Student role if regular email is entered
  return {
    role: 'student',
    confidence: 'default',
    reason: 'Standard student login detected',
    matchedUser: {
      id: `user_stud_${Date.now()}`,
      email: email,
      name: email.split('@')[0].replace(/[._-]/g, ' '),
      role: 'student',
      studentId: students[0]?.studentId || 'SMS-2025-0001',
      studentRecordId: students[0]?.id || 'stud_1',
    }
  };
}

/**
 * Authentication Session Management
 */
export function getSavedSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(user: AuthUser): void {
  try {
    const sessionUser = {
      ...user,
      lastLogin: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
  } catch (err) {
    console.error('Failed to save session to localStorage', err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session', err);
  }
}
