import React, { useState } from 'react';
import { Button, Dialog } from '../ui/primitives';
import { Student, Payment, Programme } from '../../lib/types';
import { createPaymentInDB } from '../../lib/api-sync';
import {
  CreditCard,
  PlusCircle,
  AlertTriangle,
  Receipt,
  Search,
  CheckCircle2
} from 'lucide-react';

interface FeesAndPaymentsProps {
  students: Student[];
  payments: Payment[];
  programmes: Programme[];
  onRefresh: () => void;
  onSelectStudentForDetails: (student: Student) => void;
}

export const FeesAndPayments: React.FC<FeesAndPaymentsProps> = ({
  students,
  payments,
  programmes,
  onRefresh,
  onSelectStudentForDetails,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'balances' | 'transactions'>('balances');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<string>('1000');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [customRef, setCustomRef] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time calculation for target student in modal
  const targetStudent = students.find((s) => s.id === selectedStudentId);
  const currentOutstanding = targetStudent?.outstandingBalance ?? 0;
  const numAmount = parseFloat(paymentAmount) || 0;
  const remainingAfterPayment = Math.max(0, currentOutstanding - numAmount);

  const handleOpenPaymentModal = (prefillStudentId?: string) => {
    if (prefillStudentId) {
      setSelectedStudentId(prefillStudentId);
      const s = students.find((st) => st.id === prefillStudentId);
      if (s && s.outstandingBalance && s.outstandingBalance > 0) {
        setPaymentAmount(s.outstandingBalance.toString());
      } else {
        setPaymentAmount('1000');
      }
    } else {
      setSelectedStudentId(students[0]?.id || '');
      setPaymentAmount('1000');
    }
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setCustomRef(`PAY-${new Date().getFullYear()}-${randNum}`);
    setPaymentNotes('');
    setErrorMessage(null);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (!selectedStudentId) {
        throw new Error('Please select a student.');
      }
      if (numAmount <= 0) {
        throw new Error('Payment amount must be greater than £0.00.');
      }

      const result = await createPaymentInDB({
        studentId: selectedStudentId,
        amount: numAmount,
        referenceNumber: customRef,
        paymentMethod,
        notes: paymentNotes || undefined,
      });

      if (!result) {
        throw new Error('Failed to save payment to the database.');
      }

      setIsPaymentModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record payment transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter student balances
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      searchTerm === '' ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.programme?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOverdue = filterOverdueOnly ? s.isOverdue : true;

    return matchesSearch && matchesOverdue;
  });

  // Filter transaction ledger
  const filteredPayments = payments.filter((p) => {
    const s = students.find((st) => st.id === p.studentId);
    return (
      searchTerm === '' ||
      p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s?.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Aggregates
  const totalBilled = students.reduce((sum, s) => sum + (s.programme?.feeAmount || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const overdueCount = students.filter((s) => s.isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header & Main Action */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-serif font-medium text-[#1B2A4A] tracking-tight">
                Tuition & Statutory Fees Ledger
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[#EAE6DF] text-[#1B2A4A] border border-[#DCD7CD]">
                Registry Bursary Audit
              </span>
            </div>
            <p className="text-xs text-[#5A6270] mt-1">
              Statutory tuition fee schedules, student accounts receivable, payment voucher logging, and arrears reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleOpenPaymentModal()}
              className="gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Record Payment Receipt
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Ledger Summary Strip */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] divide-y sm:divide-y-0 sm:divide-x divide-[#DCD7CD] grid grid-cols-1 sm:grid-cols-3">
        <div className="p-4 sm:p-5">
          <div className="text-xs text-[#5A6270]">Total Statutory Tuition Invoiced</div>
          <div className="text-2xl font-serif font-medium text-[#1B2A4A] mt-1.5">
            £{totalBilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#5A6270] mt-1 font-mono">
            {students.length} matriculated candidates
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-[#5A6270]">Total Receipts Reconciled</div>
          <div className="text-2xl font-serif font-medium text-[#1B2A4A] mt-1.5">
            £{totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#5A6270] mt-1 font-mono">
            {payments.length} verified vouchers
          </div>
        </div>

        <div className={`p-4 sm:p-5 ${totalOutstanding > 0 ? 'bg-[#FDF6F6]/50' : ''}`}>
          <div className="text-xs text-[#7A2E2E] font-medium flex items-center justify-between">
            <span>Outstanding Balance in Arrears</span>
            {overdueCount > 0 && (
              <span className="text-[10px] font-mono bg-[#7A2E2E] text-white px-1.5 py-0.2 rounded-[2px]">
                {overdueCount} Overdue
              </span>
            )}
          </div>
          <div className="text-2xl font-serif font-medium text-[#7A2E2E] mt-1.5">
            £{totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#5A6270] mt-1">
            Reconciliation threshold: Net 30 Days
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation and Filter Bar */}
      <div className="bg-white border border-[#DCD7CD] rounded-[2px] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE6DF] pb-3">
          {/* Sub-tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('balances')}
              className={`px-3 py-1 text-xs rounded-[2px] transition-colors border ${
                activeSubTab === 'balances'
                  ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                  : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
              }`}
            >
              Student Fee Schedules & Balances ({students.length})
            </button>
            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`px-3 py-1 text-xs rounded-[2px] transition-colors border ${
                activeSubTab === 'transactions'
                  ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-medium'
                  : 'bg-[#F7F5F0] text-[#1B2A4A] border-[#DCD7CD] hover:bg-[#EAE6DF]'
              }`}
            >
              Payment Voucher Ledger ({payments.length})
            </button>
          </div>

          {/* Overdue filter checkbox for balances tab */}
          {activeSubTab === 'balances' && (
            <label className="flex items-center gap-2 text-xs text-[#1B2A4A] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterOverdueOnly}
                onChange={(e) => setFilterOverdueOnly(e.target.checked)}
                className="rounded-[2px] border-[#DCD7CD] text-[#7A2E2E] focus:ring-0"
              />
              <span className={filterOverdueOnly ? 'font-medium text-[#7A2E2E]' : 'text-[#5A6270]'}>
                Show Arrears & Delinquent Accounts Only ({overdueCount})
              </span>
            </label>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#5A6270] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeSubTab === 'balances'
                ? 'Search student name, registration number, or degree programme...'
                : 'Search receipt voucher reference (e.g. PAY-2024-8841), student name, or ID...'
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-[#F7F5F0]/50"
          />
        </div>
      </div>

      {/* Sub-tab 1: Student Balances Table */}
      {activeSubTab === 'balances' && (
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1B2A4A]">
              <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Registration No</th>
                  <th className="py-2.5 px-4 font-normal">Candidate Name</th>
                  <th className="py-2.5 px-4 font-normal">Degree Programme</th>
                  <th className="py-2.5 px-4 font-normal text-right">Invoiced Fee</th>
                  <th className="py-2.5 px-4 font-normal text-right">Paid to Date</th>
                  <th className="py-2.5 px-4 font-normal text-right">Outstanding Balance</th>
                  <th className="py-2.5 px-4 font-normal">Due Date</th>
                  <th className="py-2.5 px-4 font-normal text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#5A6270]">
                      No student accounts match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const invoiced = student.programme?.feeAmount || 0;
                    const paid = student.totalPaid || 0;
                    const outstanding = student.outstandingBalance ?? 0;
                    const isFullyPaid = outstanding <= 0;

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-[#F7F5F0]/60 transition-colors ${
                          student.isOverdue ? 'border-l-4 border-l-[#7A2E2E] bg-[#FDF6F6]/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-medium">
                          <span className="bg-[#F7F5F0] text-[#1B2A4A] px-1.5 py-0.5 rounded-[2px] border border-[#DCD7CD]">
                            {student.studentId}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-serif font-medium text-sm text-[#1B2A4A]">
                            {student.fullName}
                          </div>
                          <div className="text-[11px] text-[#5A6270] font-mono">
                            {student.email}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-xs text-[#1B2A4A]">
                            {student.programme?.code} - {student.programme?.name}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-serif text-xs text-[#5A6270]">
                          £{invoiced.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right font-serif text-xs text-[#2E6F40] font-medium">
                          £{paid.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className={`font-serif font-medium text-sm ${student.isOverdue ? 'text-[#7A2E2E]' : isFullyPaid ? 'text-[#2E6F40]' : 'text-[#1B2A4A]'}`}>
                            £{outstanding.toLocaleString()}
                          </div>
                          {student.isOverdue && (
                            <span className="text-[10px] text-[#7A2E2E] font-medium font-mono">
                              {student.daysOverdue}d in Arrears
                            </span>
                          )}
                          {isFullyPaid && (
                            <span className="text-[10px] text-[#2E6F40] font-mono">
                              Settled
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-xs font-mono text-[#5A6270]">
                          {student.feeDueDate ? new Date(student.feeDueDate).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenPaymentModal(student.id)}
                              className="text-[#1B2A4A] hover:underline font-mono text-xs"
                              title="Record payment voucher for this student"
                            >
                              Receive
                            </button>
                            <span className="text-[#DCD7CD]">|</span>
                            <button
                              onClick={() => onSelectStudentForDetails(student)}
                              className="text-[#5A6270] hover:text-[#1B2A4A] hover:underline text-xs"
                            >
                              Ledger
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Payment Transactions Ledger Table */}
      {activeSubTab === 'transactions' && (
        <div className="bg-white border border-[#DCD7CD] rounded-[2px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1B2A4A]">
              <thead className="bg-[#F7F5F0] border-b border-[#DCD7CD] text-[11px] font-mono text-[#5A6270] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Voucher Reference</th>
                  <th className="py-2.5 px-4 font-normal">Candidate / Student</th>
                  <th className="py-2.5 px-4 font-normal">Date Recorded</th>
                  <th className="py-2.5 px-4 font-normal">Payment Method</th>
                  <th className="py-2.5 px-4 font-normal">Notes / Bank Memo</th>
                  <th className="py-2.5 px-4 font-normal text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#5A6270]">
                      No transaction records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const student = students.find((s) => s.id === p.studentId);
                    return (
                      <tr key={p.id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-xs">
                          <span className="bg-[#F7F5F0] text-[#1B2A4A] px-1.5 py-0.5 rounded-[2px] border border-[#DCD7CD]">
                            {p.referenceNumber}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-serif font-medium text-xs text-[#1B2A4A]">
                            {student?.fullName || 'Unknown Student'}
                          </div>
                          <div className="text-[11px] text-[#5A6270] font-mono">
                            {student?.studentId}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs text-[#5A6270]">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-xs text-[#1B2A4A]">
                          {p.paymentMethod}
                        </td>

                        <td className="py-3 px-4 text-xs text-[#5A6270]">
                          {p.notes || <span className="italic">Direct bursary credit</span>}
                        </td>

                        <td className="py-3 px-4 text-right font-serif font-medium text-sm text-[#2E6F40]">
                          £{p.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Voucher Modal */}
      <Dialog
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Official Payment Receipt Voucher"
        description="Issue an official bursary payment voucher and update student ledger balance."
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-[#FDF6F6] border border-[#E8C4C4] text-[#7A2E2E] rounded-[2px]">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-[#1B2A4A] font-medium mb-1">
              Select Candidate Student <span className="text-[#7A2E2E]">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const s = students.find((st) => st.id === e.target.value);
                if (s && s.outstandingBalance && s.outstandingBalance > 0) {
                  setPaymentAmount(s.outstandingBalance.toString());
                }
              }}
              className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white font-mono"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId}) &bull; Outstanding: £{s.outstandingBalance?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {targetStudent && (
            <div className="p-3 bg-[#F7F5F0] border border-[#DCD7CD] rounded-[2px] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#5A6270]">Current Balance Due:</span>
                <div className="font-serif font-medium text-sm text-[#7A2E2E]">
                  £{currentOutstanding.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-[#5A6270]">Balance After Receipt:</span>
                <div className="font-serif font-medium text-sm text-[#1B2A4A]">
                  £{remainingAfterPayment.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Receipt Amount (£) <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-serif font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Voucher Reference No <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                type="text"
                required
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Remittance Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A] bg-white"
              >
                <option value="Bank Transfer">Direct Bank Transfer / BEFTN</option>
                <option value="Credit Card">Credit / Debit Card</option>
                <option value="Cheque / Draft">Bank Draft / Cheque</option>
                <option value="Cash Deposit">Bursary Counter Cash Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-[#1B2A4A] font-medium mb-1">
                Bank Memo / Reference Notes
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g., Sonali Bank Br. Dhaka Ref 98124"
                className="w-full px-3 py-1.5 text-xs rounded-[2px] border border-[#DCD7CD] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE6DF] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Post Payment Voucher'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
