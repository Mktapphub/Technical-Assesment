import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const newPassword = (body?.password || '').trim();

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    // Accept either the internal id or the human-readable studentId
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id }, { studentId: { equals: id, mode: 'insensitive' } }],
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: { password: newPassword },
    });

    return NextResponse.json({ success: true, studentId: updated.studentId });
  } catch (error: any) {
    console.error('Error updating student password:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update password' },
      { status: 400 }
    );
  }
}
