import React from 'react';
import { Dialog, Button } from '../ui/primitives';
import { Student, Assessment } from '../../lib/types';
import { buildStudentMarksheet } from '../../lib/marksheet';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  assessments: Assessment[];
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  assessments,
}) => {
  if (!student) return null;

  // Data is already embedded on the student record from GET /api/students
  // (Prisma include: payments, submissions, grades) - no fake store needed.
  const marksheet = buildStudentMarksheet(
    student.id,
    [student],
    assessments,
    student.submissions || [],
    student.grades || []
  );
  const studentPayments = student.payments || [];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Matriculation Dossier: ${student.fullName}`}
      description={`Official Registration Record: ${student.studentId} • Academic Session ${student.academicYear}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs">
        {/* Profile Card */}
        <div className="p-4 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[#5A6270] uppercase font-mono text-[10px]">Academic Email</span>
            <div className="font-mono text-[#1B2A4A] mt-0.5 truncate">{student.email}</div>
          </div>
          <div>
            <span className="text-[#5A6270] uppercase font-mono text-[10px]">Degree Programme</span>
            <div className="font-serif font-medium text-[#1B2A4A] mt-0.5">{student.programme?.name}</div>
          </div>
          <div>
            <span className="text-[#5A6270] uppercase font-mono text-[10px]">Academic Standing</span>
            <div className="text-[#2E6F40] font-medium mt-0.5">{student.enrolmentStatus}</div>
          </div>
          <div>
            <span className="text-[#5A6270] uppercase font-mono text-[10px]">Date of Birth</span>
            <div className="font-mono text-[#1B2A4A] mt-0.5">{student.dateOfBirth}</div>
          </div>
          <div>
            <span className="text-[#5A6270] uppercase font-mono text-[10px]">Tuition Outstanding</span>
            <div className={`font-serif font-medium mt-0.5 ${student.isOverdue ? 'text-[#7A2E2E]' : 'text-[#1B2A4A]'}`}>
              £{student.outstandingBalance?.toLocaleString()} {student.isOverdue && '(Arrears)'}
            </div>
          </div>
          <div>
            <span className="text-[#5A6270] uppercase font-mono text-[10px]">Overall Mark</span>
            <div className="font-serif font-medium text-[#1B2A4A] mt-0.5">
              {marksheet.averageScore !== null ? `${marksheet.averageScore}%` : 'Pending'}
            </div>
          </div>
        </div>

        {/* Coursework & Grades Summary */}
        <div>
          <h4 className="font-serif font-medium text-[#1B2A4A] text-xs uppercase tracking-wider mb-2">
            Module Assessments & Examination Record ({marksheet.items.length})
          </h4>
          <div className="border border-[#DCD7CD] rounded-[2px] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[#5A6270] font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3 font-normal">Module</th>
                  <th className="py-2 px-3 font-normal">Submission</th>
                  <th className="py-2 px-3 font-normal text-center">Score</th>
                  <th className="py-2 px-3 font-normal">Classification</th>
                  <th className="py-2 px-3 font-normal text-center">Release</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {marksheet.items.map((item) => (
                  <tr key={item.assessment.id} className="hover:bg-[#F7F5F0]/60">
                    <td className="py-2 px-3 font-serif font-medium text-[#1B2A4A]">
                      {item.assessment.moduleCode} - {item.assessment.title}
                    </td>
                    <td className="py-2 px-3 text-[#5A6270] font-mono">
                      {item.submission ? item.submission.fileName : <span className="italic">No file</span>}
                    </td>
                    <td className="py-2 px-3 text-center font-serif font-medium text-[#1B2A4A]">
                      {item.grade ? `${item.grade.numericScore}%` : '-'}
                    </td>
                    <td className="py-2 px-3">
                      {item.grade ? (
                        <span className="font-medium text-[#1B2A4A]">{item.grade.classification}</span>
                      ) : (
                        <span className="text-[#5A6270] italic">Ungraded</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.isPublished ? (
                        <span className="text-[#2E6F40] font-mono text-[11px]">Released</span>
                      ) : (
                        <span className="text-[#8C6214] font-mono text-[11px]">Withheld</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h4 className="font-serif font-medium text-[#1B2A4A] text-xs uppercase tracking-wider mb-2">
            Tuition Payment Vouchers & Receipts ({studentPayments.length})
          </h4>
          {studentPayments.length === 0 ? (
            <p className="text-xs text-[#5A6270] italic">No payment receipts logged in bursary ledger.</p>
          ) : (
            <div className="border border-[#DCD7CD] rounded-[2px] overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[#5A6270] font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3 font-normal">Reference No</th>
                    <th className="py-2 px-3 font-normal">Date</th>
                    <th className="py-2 px-3 font-normal">Method</th>
                    <th className="py-2 px-3 font-normal text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {studentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F7F5F0]/60">
                      <td className="py-2 px-3 font-mono font-medium text-[#1B2A4A]">{p.referenceNumber}</td>
                      <td className="py-2 px-3 font-mono text-[#5A6270]">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-2 px-3 text-[#1B2A4A]">{p.paymentMethod}</td>
                      <td className="py-2 px-3 text-right font-serif font-medium text-[#2E6F40]">£{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#EAE6DF] flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close Dossier
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
