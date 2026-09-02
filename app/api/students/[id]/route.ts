import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        programme: true,
        payments: true,
        submissions: {
          include: { assessment: true },
        },
        grades: {
          include: { assessment: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.email && { email: data.email }),
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.academicYear && { academicYear: data.academicYear }),
        ...(data.enrolmentStatus && { enrolmentStatus: data.enrolmentStatus }),
        ...(data.feeDueDate !== undefined && {
          feeDueDate: data.feeDueDate ? new Date(data.feeDueDate) : null,
        }),
        ...(data.programmeId && { programmeId: data.programmeId }),
      },
      include: {
        programme: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update student' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.student.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete student' },
      { status: 400 }
    );
  }
}
