import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const referenceNumber =
      data.referenceNumber ||
      `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: Number(data.amount),
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        referenceNumber,
        paymentMethod: data.paymentMethod || 'Bank Transfer',
        notes: data.notes || null,
      },
      include: {
        student: true,
      },
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}
