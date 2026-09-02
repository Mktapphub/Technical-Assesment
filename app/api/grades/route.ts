import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { GradeClassification } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (assessmentId) where.assessmentId = assessmentId;
    if (studentId) where.studentId = studentId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        assessment: true,
        student: true,
      },
      orderBy: { gradedAt: 'desc' },
    });
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const score = Number(data.numericScore || data.marksAwarded || 0);
    let classification: GradeClassification = GradeClassification.Fail;
    if (score >= 70) classification = GradeClassification.Distinction;
    else if (score >= 60) classification = GradeClassification.Merit;
    else if (score >= 40) classification = GradeClassification.Pass;

    const isPublished = data.isPublished !== undefined ? Boolean(data.isPublished) : (data.published !== undefined ? Boolean(data.published) : false);

    const grade = await prisma.grade.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId: data.assessmentId,
          studentId: data.studentId,
        },
      },
      update: {
        numericScore: score,
        classification,
        isPublished,
        feedback: data.feedback || null,
        gradedBy: data.gradedBy || 'Registry Examination Board',
        gradedAt: new Date(),
      },
      create: {
        assessmentId: data.assessmentId,
        studentId: data.studentId,
        numericScore: score,
        classification,
        isPublished,
        feedback: data.feedback || null,
        gradedBy: data.gradedBy || 'Registry Examination Board',
        gradedAt: new Date(),
      },
      include: {
        assessment: true,
        student: true,
      },
    });

    return NextResponse.json(grade, { status: 200 });
  } catch (error: any) {
    console.error('Error recording grade:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record grade' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { studentId, assessmentId, id, isPublished, published } = data;

    const publishState = isPublished !== undefined ? Boolean(isPublished) : Boolean(published);

    let updatedGrade;
    if (id) {
      updatedGrade = await prisma.grade.update({
        where: { id },
        data: {
          isPublished: publishState,
        },
        include: {
          assessment: true,
          student: true,
        },
      });
    } else if (studentId && assessmentId) {
      updatedGrade = await prisma.grade.update({
        where: {
          assessmentId_studentId: {
            assessmentId,
            studentId,
          },
        },
        data: {
          isPublished: publishState,
        },
        include: {
          assessment: true,
          student: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Missing grade id or studentId + assessmentId' },
        { status: 400 }
      );
    }

    return NextResponse.json(updatedGrade, { status: 200 });
  } catch (error: any) {
    console.error('Error updating grade publish status:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update grade publish status' },
      { status: 400 }
    );
  }
}
