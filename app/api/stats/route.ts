import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { EnrolmentStatus } from '@prisma/client';

export async function GET() {
  try {
    const [
      totalStudents,
      enrolledStudents,
      deferredStudents,
      withdrawnStudents,
      completedStudents,
      totalProgrammes,
      totalAssessments,
      students,
      payments,
      submissions,
      grades,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { enrolmentStatus: EnrolmentStatus.Enrolled } }),
      prisma.student.count({ where: { enrolmentStatus: EnrolmentStatus.Deferred } }),
      prisma.student.count({ where: { enrolmentStatus: EnrolmentStatus.Withdrawn } }),
      prisma.student.count({ where: { enrolmentStatus: EnrolmentStatus.Completed } }),
      prisma.programme.count(),
      prisma.assessment.count(),
      prisma.student.findMany({ include: { programme: true, payments: true } }),
      prisma.payment.findMany(),
      prisma.submission.findMany(),
      prisma.grade.findMany(),
    ]);

    const totalFeesBilled = students.reduce(
      (sum: number, s) => sum + (s.programme?.feeAmount || 0),
      0
    );

    const totalFeesCollected = payments.reduce((sum: number, p) => sum + p.amount, 0);
    const totalOutstandingBalance = Math.max(0, totalFeesBilled - totalFeesCollected);

    const now = new Date();
    const overdueStudentsCount = students.filter((s) => {
      const paid = s.payments.reduce((sum: number, p) => sum + p.amount, 0);
      const total = s.programme?.feeAmount || 0;
      const isOverdue =
        s.enrolmentStatus === EnrolmentStatus.Enrolled &&
        paid < total &&
        s.feeDueDate &&
        new Date(s.feeDueDate) < now;
      return isOverdue;
    }).length;

    const gradesPublishedCount = grades.filter((g) => g.isPublished).length;
    const gradesWithheldCount = grades.filter((g) => !g.isPublished).length;
    const pendingSubmissionsCount = submissions.length;

    return NextResponse.json({
      totalStudents,
      enrolledStudents,
      deferredStudents,
      withdrawnStudents,
      completedStudents,
      totalProgrammes,
      totalAssessments,
      totalFeesBilled,
      totalFeesCollected,
      totalOutstandingBalance,
      overdueStudentsCount,
      pendingSubmissionsCount,
      gradesPublishedCount,
      gradesWithheldCount,
    });
  } catch (error) {
    console.error('Error calculating registry stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}
