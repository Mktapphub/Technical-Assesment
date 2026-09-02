import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const programmes = await prisma.programme.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    return NextResponse.json(programmes);
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programmes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newProg = await prisma.programme.create({
      data: {
        code: data.code,
        name: data.name,
        department: data.department,
        feeAmount: Number(data.feeAmount),
        durationYears: Number(data.durationYears) || 3,
      },
    });
    return NextResponse.json(newProg, { status: 201 });
  } catch (error: any) {
    console.error('Error creating programme:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create programme' },
      { status: 400 }
    );
  }
}
