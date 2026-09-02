import React, { useState } from 'react';
import { Button, Dialog } from '../ui/primitives';
import { KeyRound, Eye, EyeOff, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import { updateStudentPasswordInDB } from '../../lib/api-sync';
import { AuthUser } from '../../lib/types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  targetStudentId?: string; // If specified, Registry team is changing password for this student
  targetStudentName?: string;
  onPasswordChanged?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetStudentId,
  targetStudentName,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Determine who we are changing password for
  const isTargetingStudent = Boolean(targetStudentId);
  const studentIdentifier = targetStudentId || currentUser?.studentId || currentUser?.studentRecordId || currentUser?.email;
  const displayName = targetStudentName || currentUser?.name || 'Account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify and try again.');
      return;
    }

    if (!studentIdentifier) {
      setError('No valid student or account identifier found.');
      return;
    }

    setIsLoading(true);

    try {
      await updateStudentPasswordInDB(studentIdentifier, newPassword.trim());
      setSuccessMessage(
        isTargetingStudent
          ? `Successfully updated password for student ${displayName} (${targetStudentId}) in PostgreSQL database!`
          : `Password updated successfully in database! Please use your new password for future sign-ins.`
      );
      setNewPassword('');
      setConfirmPassword('');
      
      if (onPasswordChanged) {
        onPasswordChanged();
      }

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password in database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setError(null);
    setSuccessMessage(null);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={isTargetingStudent ? `Reset Student Password - ${displayName}` : 'Change Account Password'}
      description={
        isTargetingStudent
          ? `Updating credential access for ${displayName} (${targetStudentId}) in the PostgreSQL database.`
          : 'Update your portal security credential stored in the PostgreSQL database.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Info Badge */}
        <div className="bg-[#F7F5F0] p-3 rounded-[2px] border border-[#DCD7CD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#1B2A4A]" />
            <div>
              <p className="text-xs font-serif font-medium text-[#1B2A4A]">{displayName}</p>
              <p className="text-[11px] font-mono text-[#5A6270]">
                Target: {studentIdentifier}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded-[2px] border border-[#DCD7CD] text-[#1B2A4A]">
            PostgreSQL Auth
          </span>
        </div>

        {error && (
          <div className="p-3 bg-[#7A2E2E]/10 border border-[#7A2E2E]/30 rounded-[2px] flex items-start gap-2 text-xs text-[#7A2E2E]">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[2px] flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* New Password Field */}
        <div>
          <label className="block text-xs font-medium text-[#1B2A4A] mb-1">
            New Password <span className="text-[#7A2E2E]">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter at least 4 characters..."
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] pr-9 bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6270] hover:text-[#1B2A4A]"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password Field */}
        <div>
          <label className="block text-xs font-medium text-[#1B2A4A] mb-1">
            Confirm New Password <span className="text-[#7A2E2E]">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password..."
            className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#DCD7CD] flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseModal}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {isLoading ? 'Updating Database...' : 'Save New Password'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
