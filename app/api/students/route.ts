import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        programme: true,
        payments: true,
        submissions: true,
        grades: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const formatted = students.map((s) => {
      const feeAmount = s.programme?.feeAmount || 0;
      const totalPaid = (s.payments || []).reduce((acc, p) => acc + p.amount, 0);
      const outstandingBalance = Math.max(0, feeAmount - totalPaid);
      const dueDate = s.feeDueDate ? new Date(s.feeDueDate) : new Date(s.createdAt.getTime() + 60 * 24 * 60 * 60 * 1000);
      const isOverdue = outstandingBalance > 0 && now > dueDate;
      const daysOverdue = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)) : 0;

      return {
        ...s,
        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '2004-01-15',
        feeDueDate: s.feeDueDate ? new Date(s.feeDueDate).toISOString() : null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        totalPaid,
        outstandingBalance,
        isOverdue,
        daysOverdue,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching students from Prisma:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students from database' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.fullName || !data.email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // 1. Resolve valid programme ID
    let validProgrammeId = data.programmeId;
    let progExists = validProgrammeId ? await prisma.programme.findUnique({ where: { id: validProgrammeId } }) : null;

    if (!progExists && validProgrammeId) {
      // Map legacy IDs like 'prog_cs' to codes like 'BSC-CS'
      let targetCode = validProgrammeId;
      if (validProgrammeId === 'prog_cs') targetCode = 'BSC-CS';
      if (validProgrammeId === 'prog_da') targetCode = 'MSC-DA';
      if (validProgrammeId === 'prog_bm') targetCode = 'BA-BM';

      progExists = await prisma.programme.findFirst({
        where: {
          OR: [
            { code: { equals: targetCode, mode: 'insensitive' } },
            { id: { contains: validProgrammeId } },
          ],
        },
      });
    }

    if (!progExists) {
      progExists = await prisma.programme.findFirst();
    }

    if (!progExists) {
      // Seed default programme if none exists
      progExists = await prisma.programme.create({
        data: {
          code: 'BSC-CS',
          name: 'BSc (Hons) Computer Science',
          department: 'School of Computing & Mathematical Sciences',
          feeAmount: 9250.0,
          durationYears: 3,
        },
      });
    }

    validProgrammeId = progExists.id;

    // 2. Resolve unique studentId
    let studentIdToUse = data.studentId;
    if (!studentIdToUse) {
      const count = await prisma.student.count();
      studentIdToUse = `SMS-2025-${String(count + 1).padStart(4, '0')}`;
    }

    let existingStudent = await prisma.student.findUnique({ where: { studentId: studentIdToUse } });
    let counter = 1;
    while (existingStudent) {
      const totalCount = (await prisma.student.count()) + counter;
      studentIdToUse = `SMS-2025-${String(totalCount).padStart(4, '0')}`;
      existingStudent = await prisma.student.findUnique({ where: { studentId: studentIdToUse } });
      counter++;
    }

    // 3. Date handling
    let dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      dob = new Date('2004-01-15');
    }

    let dueDate = data.feeDueDate ? new Date(data.feeDueDate) : null;
    if (!dueDate) {
      dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    }

    const newStudent = await prisma.student.create({
      data: {
        studentId: studentIdToUse,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        dateOfBirth: dob,
        academicYear: data.academicYear || '2024/25',
        enrolmentStatus: data.enrolmentStatus || 'Enrolled',
        feeDueDate: dueDate,
        programmeId: validProgrammeId,
        password: data.password ? data.password.trim() : 'student123',
      },
      include: {
        programme: true,
        payments: true,
        submissions: true,
        grades: true,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    console.error('Error creating student in Prisma:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create student in database' },
      { status: 400 }
    );
  }
}
