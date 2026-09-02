import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        submissions: true,
        grades: true,
        _count: {
          select: {
            submissions: true,
            grades: true,
          },
        },
      },
      orderBy: { deadline: 'asc' },
    });
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newAssessment = await prisma.assessment.create({
      data: {
        title: data.title,
        moduleName: data.moduleName,
        moduleCode: data.moduleCode,
        academicYear: data.academicYear || '2024-2025',
        deadline: new Date(data.deadline),
        weighting: Number(data.weighting) || 100,
        maxScore: Number(data.maxScore) || 100,
        description: data.description || null,
      },
    });
    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create assessment' },
      { status: 400 }
    );
  }
}
