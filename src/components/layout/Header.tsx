import React, { useState } from 'react';
import { AuthUser, Student, UserRole } from '../../lib/types';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { 
  Building2, 
  RotateCcw, 
  Shield, 
  User, 
  BookOpen, 
  LogOut, 
  ChevronDown,
  KeyRound
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: UserRole;
  currentUser: AuthUser | null;
  onLogout: () => void;
  students: Student[];
  currentStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onResetSeed: () => void;
  overdueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  role,
  currentUser,
  onLogout,
  students,
  currentStudentId,
  onSelectStudent,
  onResetSeed,
  overdueCount,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1B2A4A] text-[#F7F5F0] border-b border-[#0F192E]">
      {/* Top Academic Registry Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Institution Crest & Registry Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] border border-[#394B6E] bg-[#15223C] flex items-center justify-center text-[#F7F5F0]">
              <Building2 className="w-4 h-4 text-[#C5BFB5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-medium text-base tracking-normal text-[#F7F5F0]">
                  Student Management System
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-[2px] text-[10px] font-mono uppercase tracking-wider bg-[#15223C] text-[#C5BFB5] border border-[#2B3C5E]">
                  {role === 'admin' ? 'Administrative Registry' : role === 'teacher' ? 'Faculty Member' : 'Student Portal'}
                </span>
              </div>
              <p className="text-[11px] text-[#A6B2C8]">
                Office of the Registrar & Controller of Examinations
              </p>
            </div>
          </div>

          {/* Right Action Bar: Account */}
          <div className="flex items-center gap-3">
            {/* Active Student Badge in Student Mode (strictly locked to authenticated student) */}
            {role === 'student' && (
              <div className="flex items-center gap-2 border border-[#2B3C5E] bg-[#15223C] rounded-[2px] px-2.5 py-1">
                <span className="text-[10px] text-[#A6B2C8] uppercase tracking-wider font-mono">Student ID:</span>
                <span className="font-mono text-xs font-semibold text-[#F7F5F0]">
                  {students.find((s) => s.id === currentStudentId)?.studentId || 'SMS-2025-0001'}
                </span>
                <span className="text-[10px] bg-[#0F192E] text-[#C5BFB5] px-1.5 py-0.5 rounded-[2px] font-mono border border-[#2B3C5E]">
                  {students.find((s) => s.id === currentStudentId)?.programme?.code || 'STUDENT'}
                </span>
              </div>
            )}

            {/* User Profile & Actions Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-[2px] border border-[#2B3C5E] bg-[#15223C] hover:bg-[#253759] transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-[2px] bg-[#253759] border border-[#394B6E] flex items-center justify-center text-xs font-serif text-[#F7F5F0] shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-[#F7F5F0] leading-tight truncate max-w-[140px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#A6B2C8] font-mono capitalize">
                      {role === 'admin' ? 'Registry Admin' : role === 'teacher' ? 'Faculty Member' : 'Student Record'}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#A6B2C8]" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-1 w-64 rounded-[2px] bg-[#15223C] border border-[#2B3C5E] py-1.5 z-50 text-[#F7F5F0] divide-y divide-[#253759]"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2">
                      <p className="text-xs font-medium text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-[#A6B2C8] font-mono truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0F192E] text-[#C5BFB5] border border-[#2B3C5E]">
                          {role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Faculty Member' : 'Student'}
                        </span>
                        {currentUser.studentId && (
                          <span className="text-[10px] font-mono text-[#A6B2C8]">
                            Reg: {currentUser.studentId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-left text-[#F7F5F0] hover:bg-[#253759] flex items-center gap-2 font-medium"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#C5BFB5]" />
                        Change Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onResetSeed();
                        }}
                        className="w-full px-3 py-1.5 text-xs text-left text-[#A6B2C8] hover:text-white hover:bg-[#253759] flex items-center gap-2"
                      >
                        <RotateCcw className="w-3 h-3 text-[#A6B2C8]" />
                        Reset Registry Records
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-1.5 text-xs text-left text-[#D89E9E] hover:text-white hover:bg-[#7A2E2E]/30 flex items-center gap-2"
                      >
                        <LogOut className="w-3 h-3 text-[#D89E9E]" />
                        Sign Out / Switch User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Navigation Tabs (Admin Role) */}
      {role === 'admin' && (
        <nav className="bg-[#15223C] border-t border-[#253759] px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-[2px] text-xs transition-colors whitespace-nowrap border-b-2 ${
                currentTab === 'dashboard'
                  ? 'border-[#F7F5F0] text-white font-medium bg-[#1B2A4A]'
                  : 'border-transparent text-[#A6B2C8] hover:text-[#F7F5F0] hover:bg-[#1B2A4A]/50'
              }`}
            >
              Registry Overview
            </button>

            <button
              onClick={() => onSelectTab('enrolment')}
              className={`px-3 py-1.5 rounded-[2px] text-xs transition-colors whitespace-nowrap border-b-2 ${
                currentTab === 'enrolment'
                  ? 'border-[#F7F5F0] text-white font-medium bg-[#1B2A4A]'
                  : 'border-transparent text-[#A6B2C8] hover:text-[#F7F5F0] hover:bg-[#1B2A4A]/50'
              }`}
            >
              1. Student Enrolment
            </button>

            <button
              onClick={() => onSelectTab('fees')}
              className={`px-3 py-1.5 rounded-[2px] text-xs transition-colors whitespace-nowrap border-b-2 flex items-center gap-1.5 ${
                currentTab === 'fees'
                  ? 'border-[#F7F5F0] text-white font-medium bg-[#1B2A4A]'
                  : 'border-transparent text-[#A6B2C8] hover:text-[#F7F5F0] hover:bg-[#1B2A4A]/50'
              }`}
            >
              <span>2. Fees & Payments</span>
              {overdueCount > 0 && (
                <span className="px-1 py-0.2 rounded-[2px] bg-[#7A2E2E] text-white text-[10px] font-mono">
                  {overdueCount} Overdue
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('assessments')}
              className={`px-3 py-1.5 rounded-[2px] text-xs transition-colors whitespace-nowrap border-b-2 ${
                currentTab === 'assessments'
                  ? 'border-[#F7F5F0] text-white font-medium bg-[#1B2A4A]'
                  : 'border-transparent text-[#A6B2C8] hover:text-[#F7F5F0] hover:bg-[#1B2A4A]/50'
              }`}
            >
              3. Assessment Submission
            </button>

            <button
              onClick={() => onSelectTab('marksheet')}
              className={`px-3 py-1.5 rounded-[2px] text-xs transition-colors whitespace-nowrap border-b-2 ${
                currentTab === 'marksheet'
                  ? 'border-[#F7F5F0] text-white font-medium bg-[#1B2A4A]'
                  : 'border-transparent text-[#A6B2C8] hover:text-[#F7F5F0] hover:bg-[#1B2A4A]/50'
              }`}
            >
              4. Marksheet & Results
            </button>
          </div>
        </nav>
      )}

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
      />
    </header>
  );
};
