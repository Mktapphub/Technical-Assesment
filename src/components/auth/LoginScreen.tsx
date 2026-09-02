import React, { useState, useMemo } from 'react';
import { AuthUser, Student, UserRole } from '../../lib/types';
import { detectRoleFromEmail, saveSession } from '../../lib/auth';
import { loginViaDB, createStudentInDB } from '../../lib/api-sync';
import { Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  students: Student[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ students, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically detect role from email in real-time for sign in
  const detectionResult = useMemo(() => {
    return detectRoleFromEmail(email, students);
  }, [email, students]);

  // Active determined role (auto-detected or manually selected via text link)
  const activeRole: UserRole = isSignUp ? selectedRole : (overrideRole || detectionResult.role);

  // Reset override if user modifies email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    setOverrideRole(null);
    setError(null);
  };

  const handleSelectDemoAccount = (presetEmail: string, forcedRole?: UserRole) => {
    setIsSignUp(false);
    setEmail(presetEmail);
    setPassword('student123');
    setOverrideRole(forcedRole || null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide your university email or Student ID.');
      return;
    }

    if (!password.trim()) {
      setError('Please provide a secure password.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Please provide your full legal name for registration.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        if (activeRole === 'student') {
          const newStudent = await createStudentInDB({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: password.trim(),
            dateOfBirth: '2004-01-15',
            enrolmentStatus: 'Enrolled',
            academicYear: '2024/25',
          });

          const createdUser: AuthUser = {
            id: `user_${newStudent.id}`,
            email: newStudent.email,
            name: newStudent.fullName,
            role: 'student',
            studentId: newStudent.studentId,
            studentRecordId: newStudent.id,
            department: newStudent.programme?.name || 'School of Computing & Mathematical Sciences',
            designation: 'Enrolled Student',
          };

          saveSession(createdUser);
          onLoginSuccess(createdUser);
        } else {
          const capName = fullName.trim();
          const staffUser: AuthUser = {
            id: `user_${Date.now()}`,
            email: email.trim(),
            name: activeRole === 'teacher' ? `Prof. ${capName}` : capName,
            role: activeRole,
            department: 'Central Academic Registry & Examination Board',
            designation: activeRole === 'admin' ? 'Institutional Registry Officer' : 'Academic Course Examiner',
          };
          saveSession(staffUser);
          onLoginSuccess(staffUser);
        }
      } else {
        const res = await loginViaDB({
          identifier: email.trim(),
          password: password.trim(),
          role: activeRole,
        });

        if (res && res.success && res.user) {
          saveSession(res.user);
          onLoginSuccess(res.user);
        } else {
          throw new Error('Authentication failed. Invalid credentials.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleName = activeRole === 'admin' 
    ? 'Administrator' 
    : activeRole === 'teacher' 
    ? 'Faculty instructor' 
    : 'Enrolled student';

  const personInfo = useMemo(() => {
    if (isSignUp) {
      return {
        name: fullName || 'New institutional account',
        subtext: selectedRole === 'student' ? 'Student Enrolment' : selectedRole === 'teacher' ? 'Faculty Member' : 'Registry Administration',
      };
    }
    if (detectionResult.matchedStudent) {
      return {
        name: detectionResult.matchedStudent.fullName,
        subtext: `Registration: ${detectionResult.matchedStudent.studentId} · ${detectionResult.matchedStudent.programme?.name || 'Degree programme'}`,
      };
    }
    if (detectionResult.matchedUser) {
      return {
        name: detectionResult.matchedUser.name,
        subtext: detectionResult.matchedUser.designation || detectionResult.matchedUser.department || 'University personnel',
      };
    }
    if (activeRole === 'teacher') {
      return {
        name: 'Faculty member',
        subtext: 'Department of Computer Science & Engineering',
      };
    }
    if (activeRole === 'student') {
      return {
        name: 'Enrolled student',
        subtext: 'Academic coursework and marksheet records',
      };
    }
    return {
      name: 'Registry officer',
      subtext: 'Central Academic Registry & Examination Board',
    };
  }, [detectionResult, activeRole, isSignUp, fullName, selectedRole]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-center items-center py-12 px-4 sm:px-6 font-sans text-[#1B2A4A]">
      <div className="w-full max-w-[460px]">
        {/* Single-column Institutional Card */}
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-8 sm:p-10 shadow-sm">
          
          {/* 1. Institution Wordmark & Maroon Accent Rule */}
          <div className="mb-6">
            <div className="text-xs font-serif tracking-normal text-[#1B2A4A] uppercase">
              Office of the Registrar &bull; University Academic Registry
            </div>
            {/* Single Accent: thin maroon/oxblood divider rule */}
            <div className="h-[1px] bg-[#7A2E2E] w-full mt-3 mb-4" />
            
            {/* 2. Screen Title & Description */}
            <h1 id="auth-heading" className="text-2xl font-serif font-normal text-[#1B2A4A] tracking-tight text-center">
              Login or Sign Up
            </h1>
            <p className="text-xs text-[#5A6270] mt-1 leading-relaxed text-center">
              {isSignUp 
                ? 'Register your official university profile to access portal services.' 
                : 'Access student enrolment, fees, coursework submissions, and marksheets.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 border border-[#7A2E2E] bg-[#FDF9F9] text-[#7A2E2E] text-xs rounded-[2px]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field for Sign Up */}
            {isSignUp && (
              <div>
                <label 
                  htmlFor="full-name" 
                  className="block text-xs font-medium text-[#1B2A4A] mb-1.5"
                >
                  Full legal name
                </label>
                <input
                  id="full-name"
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Sabrina Rahman"
                  className="w-full px-3 py-2 bg-white border border-[#C5BFB5] rounded-[2px] text-sm text-[#1B2A4A] placeholder:text-[#9A9388] focus:outline-none focus:border-[#1B2A4A] transition-colors font-sans"
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label 
                htmlFor="university-email" 
                className="block text-xs font-medium text-[#1B2A4A] mb-1.5"
              >
                University email address
              </label>
              <input
                id="university-email"
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="name@university.edu.bd"
                className="w-full px-3 py-2 bg-white border border-[#C5BFB5] rounded-[2px] text-sm text-[#1B2A4A] placeholder:text-[#9A9388] focus:outline-none focus:border-[#1B2A4A] transition-colors font-sans"
              />
            </div>

            {/* Role Selection for Sign Up */}
            {isSignUp && (
              <div>
                <label 
                  htmlFor="account-role" 
                  className="block text-xs font-medium text-[#1B2A4A] mb-1.5"
                >
                  Institutional role
                </label>
                <select
                  id="account-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-[#C5BFB5] rounded-[2px] text-sm text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] transition-colors font-sans"
                >
                  <option value="student">Enrolled Student</option>
                  <option value="teacher">Faculty Instructor</option>
                  <option value="admin">Administrator / Registrar</option>
                </select>
              </div>
            )}


            {/* Password Input */}
            <div>
              <div className="mb-1.5">
                <label 
                  htmlFor="user-password" 
                  className="block text-xs font-medium text-[#1B2A4A]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 pr-10 bg-white border border-[#C5BFB5] rounded-[2px] text-sm text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6270] hover:text-[#1B2A4A] cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#15223C] active:bg-[#0F192E] text-[#F7F5F0] text-sm font-serif font-medium rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 mt-2"
            >
              {isLoading ? 'Processing…' : isSignUp ? 'Complete registration' : 'Sign in'}
            </button>
          </form>

          {/* Natural Sign In / Sign Up Toggle Switch */}
          <div className="mt-6 pt-5 border-t border-[#EAE6DF] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5A6270] gap-2">
            <span>
              {isSignUp ? 'Already have an account?' : 'No account yet?'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-[#1B2A4A] font-medium underline hover:text-[#0F192E] cursor-pointer bg-transparent border-none p-0"
              >
                {isSignUp ? 'Sign in instead' : 'Sign up for access'}
              </button>

              {!isSignUp && (
                null
              )}
            </div>
          </div>

          {/* Quiet Footer Line */}
          <div className="mt-6 pt-4 border-t border-[#EAE6DF] text-center text-[11px] text-[#7A8290] font-sans">
            Academic session 2024–2025 &bull; Central Academic Registry
          </div>

        </div>
      </div>
    </div>
  );
};
