import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (assessmentId) where.assessmentId = assessmentId;
    if (studentId) where.studentId = studentId;

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        assessment: true,
        student: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Check if assessment deadline is passed to determine late status
    const assessment = await prisma.assessment.findUnique({
      where: { id: data.assessmentId },
    });

    const now = new Date();
    const isLate = assessment ? now > new Date(assessment.deadline) : false;

    // Upsert submission
    const existing = await prisma.submission.findUnique({
      where: {
        assessmentId_studentId: {
          assessmentId: data.assessmentId,
          studentId: data.studentId,
        },
      },
    });

    const submission = await prisma.submission.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId: data.assessmentId,
          studentId: data.studentId,
        },
      },
      update: {
        fileName: data.fileName,
        fileType: data.fileType || 'application/pdf',
        fileSize: data.fileSize || null,
        fileContentBase64: data.fileContentBase64 || null,
        submittedAt: now,
        isLate,
        version: existing ? existing.version + 1 : 1,
      },
      create: {
        assessmentId: data.assessmentId,
        studentId: data.studentId,
        fileName: data.fileName,
        fileType: data.fileType || 'application/pdf',
        fileSize: data.fileSize || null,
        fileContentBase64: data.fileContentBase64 || null,
        submittedAt: now,
        isLate,
        version: 1,
      },
      include: {
        assessment: true,
        student: true,
      },
    });

    return NextResponse.json(submission, { status: 200 });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit assessment' },
      { status: 400 }
    );
  }
}
