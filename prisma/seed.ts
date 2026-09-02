import { PrismaClient, EnrolmentStatus, GradeClassification } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Seeding Student Management System database...');

  // 1. Clean existing records in dependency order
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programme.deleteMany();

  // 2. Seed Programmes
  const cs = await prisma.programme.create({
    data: {
      code: 'BSC-CS',
      name: 'BSc (Hons) Computer Science',
      department: 'School of Computing & Mathematical Sciences',
      feeAmount: 9250.0,
      durationYears: 3,
    },
  });

  const da = await prisma.programme.create({
    data: {
      code: 'MSC-DA',
      name: 'MSc Data Analytics & Artificial Intelligence',
      department: 'School of Computing & Mathematical Sciences',
      feeAmount: 11500.0,
      durationYears: 1,
    },
  });

  const bm = await prisma.programme.create({
    data: {
      code: 'BA-BM',
      name: 'BA (Hons) Business Management & Economics',
      department: 'School of Business & Governance',
      feeAmount: 8750.0,
      durationYears: 3,
    },
  });

  console.log('✅ Programmes seeded');

  // Helper date generators
  const now = new Date();
  const pastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const futureDate = (daysAhead: number) => new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // 3. Seed Students (6 students with various statuses and fee conditions)
  // Student 1: Enrolled, fully paid
  const s1 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0001',
      fullName: 'Minhajul Khan',
      email: 'minhajul.khan@university.edu.bd',
      dateOfBirth: new Date('2003-04-14'),
      academicYear: '2024-2025',
      enrolmentStatus: EnrolmentStatus.Enrolled,
      feeDueDate: pastDate(45),
      programmeId: cs.id,
    },
  });

  // Student 2: Enrolled, OVERDUE balance (paid £2,500 of £9,250, fee was due 30 days ago)
  const s2 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0002',
      fullName: 'Nusrat Jahan',
      email: 'nusrat.jahan@university.edu.bd',
      dateOfBirth: new Date('2002-11-20'),
      academicYear: '2024-2025',
      enrolmentStatus: EnrolmentStatus.Enrolled,
      feeDueDate: pastDate(30), // Fee due in past => OVERDUE!
      programmeId: cs.id,
    },
  });

  // Student 3: Enrolled, partial paid, fee not yet due (due in 60 days)
  const s3 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0003',
      fullName: 'Tanvir Ahmed',
      email: 'tanvir.ahmed@university.edu.bd',
      dateOfBirth: new Date('2001-08-05'),
      academicYear: '2024-2025',
      enrolmentStatus: EnrolmentStatus.Enrolled,
      feeDueDate: futureDate(60),
      programmeId: da.id,
    },
  });

  // Student 4: Deferred student
  const s4 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0004',
      fullName: 'Sadia Rahman',
      email: 'sadia.rahman@university.edu.bd',
      dateOfBirth: new Date('2003-02-18'),
      academicYear: '2024-2025',
      enrolmentStatus: EnrolmentStatus.Deferred,
      feeDueDate: futureDate(120),
      programmeId: bm.id,
    },
  });

  // Student 5: Withdrawn student (distinguished visually)
  const s5 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0005',
      fullName: 'Farhan Chowdhury',
      email: 'farhan.chowdhury@university.edu.bd',
      dateOfBirth: new Date('2004-09-30'),
      academicYear: '2024-2025',
      enrolmentStatus: EnrolmentStatus.Withdrawn,
      feeDueDate: pastDate(60),
      programmeId: cs.id,
    },
  });

  // Student 6: Completed student (distinguished visually)
  const s6 = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0006',
      fullName: 'Anika Tabassum',
      email: 'anika.tabassum@university.edu.bd',
      dateOfBirth: new Date('2000-06-12'),
      academicYear: '2023-2024',
      enrolmentStatus: EnrolmentStatus.Completed,
      feeDueDate: pastDate(200),
      programmeId: da.id,
    },
  });

  console.log('✅ Students seeded');

  // 4. Seed Payments
  // Minhajul (s1): Fully paid £9,250 in 2 installments
  await prisma.payment.createMany({
    data: [
      {
        studentId: s1.id,
        amount: 5000.0,
        paymentDate: pastDate(60),
        referenceNumber: 'PAY-2024-0911',
        paymentMethod: 'Bank Transfer',
        notes: 'Term 1 Tuition payment confirmed',
      },
      {
        studentId: s1.id,
        amount: 4250.0,
        paymentDate: pastDate(50),
        referenceNumber: 'PAY-2024-0988',
        paymentMethod: 'Debit Card',
        notes: 'Term 2 Tuition settlement in full',
      },
    ],
  });

  // Nusrat (s2): Paid £2,500 of £9,250 (Outstanding: £6,750 — OVERDUE!)
  await prisma.payment.create({
    data: {
      studentId: s2.id,
      amount: 2500.0,
      paymentDate: pastDate(40),
      referenceNumber: 'PAY-2024-1044',
      paymentMethod: 'Credit Card',
      notes: 'Initial deposit payment',
    },
  });

  // Tanvir (s3): Paid £6,000 of £11,500 (Outstanding: £5,500 — Not Overdue, due in 60 days)
  await prisma.payment.create({
    data: {
      studentId: s3.id,
      amount: 6000.0,
      paymentDate: pastDate(20),
      referenceNumber: 'PAY-2025-0102',
      paymentMethod: 'Bank Transfer',
      notes: 'First installment postgraduate fee',
    },
  });

  // Anika (s6): Completed student - fully paid £11,500
  await prisma.payment.create({
    data: {
      studentId: s6.id,
      amount: 11500.0,
      paymentDate: pastDate(210),
      referenceNumber: 'PAY-2023-8821',
      paymentMethod: 'Scholarship / Sponsorship',
      notes: 'Full Dean Merit Scholarship',
    },
  });

  console.log('✅ Payments seeded');

  // 5. Seed Assessments
  const a1 = await prisma.assessment.create({
    data: {
      title: 'Coursework 1: Data Structures & Algorithms Benchmark',
      moduleName: 'Data Structures and Algorithms',
      moduleCode: 'CS102',
      academicYear: '2024-2025',
      deadline: pastDate(10), // Deadline was 10 days ago (Closed for new, has late submission)
      weighting: 50,
      maxScore: 100,
      description: 'Implement AVL tree and benchmark memory complexity against Red-Black Trees in C++/Java/TypeScript.',
    },
  });

  const a2 = await prisma.assessment.create({
    data: {
      title: 'Project: Distributed Microservices Architecture',
      moduleName: 'Advanced Web Engineering',
      moduleCode: 'CS105',
      academicYear: '2024-2025',
      deadline: futureDate(14), // Open assessment with deadline in 2 weeks
      weighting: 50,
      maxScore: 100,
      description: 'Design and deploy an event-driven microservices architecture using Docker and gRPC.',
    },
  });

  const a3 = await prisma.assessment.create({
    data: {
      title: 'Dissertation Proposal: Deep Reinforcement Learning',
      moduleName: 'Applied Machine Learning',
      moduleCode: 'DA501',
      academicYear: '2024-2025',
      deadline: pastDate(5), // Past deadline
      weighting: 100,
      maxScore: 100,
      description: 'Submit an 8-page academic research proposal formatted according to IEEE guidelines.',
    },
  });

  console.log('✅ Assessments seeded');

  // 6. Seed Submissions
  // Minhajul submitted on time to a1
  await prisma.submission.create({
    data: {
      assessmentId: a1.id,
      studentId: s1.id,
      fileName: 'Minhajul_Khan_CS102_CW1.pdf',
      fileType: 'application/pdf',
      fileSize: 1420500,
      submittedAt: pastDate(12), // 2 days before deadline => on time
      isLate: false,
      version: 1,
    },
  });

  // Nusrat submitted LATE to a1 (submitted 2 days after deadline)
  await prisma.submission.create({
    data: {
      assessmentId: a1.id,
      studentId: s2.id,
      fileName: 'Nusrat_Jahan_CS102_CW1_Submission.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 845200,
      submittedAt: pastDate(8), // 2 days after deadline (deadline was pastDate(10)) => LATE!
      isLate: true,
      version: 1,
    },
  });

  // Tanvir submitted on time to a3
  await prisma.submission.create({
    data: {
      assessmentId: a3.id,
      studentId: s3.id,
      fileName: 'Tanvir_Ahmed_DA501_Proposal.pdf',
      fileType: 'application/pdf',
      fileSize: 2198000,
      submittedAt: pastDate(6), // 1 day before deadline => on time
      isLate: false,
      version: 1,
    },
  });

  // Note: Student 4 (Sadia), Student 5 (Farhan), Student 6 (Anika) have NOT submitted to a1 (testing unsubmitted edge case)

  console.log('✅ Submissions seeded');

  // 7. Seed Grades
  // Minhajul (s1): Score 82 => Distinction (>= 70), PUBLISHED
  await prisma.grade.create({
    data: {
      assessmentId: a1.id,
      studentId: s1.id,
      numericScore: 82.0,
      classification: GradeClassification.Distinction,
      isPublished: true, // PUBLISHED! Minhajul can see this
      feedback: 'Outstanding implementation of self-balancing tree rotations with empirical memory profiling.',
      gradedBy: 'Prof. Dr. Mohammad Rafiqul Islam',
      gradedAt: pastDate(4),
    },
  });

  // Nusrat (s2): Score 64 => Merit (60-69), WITHHELD (isPublished = false)
  // Edge Case: When Nusrat logs in as student, she MUST NOT see this grade (query-level filtered)
  await prisma.grade.create({
    data: {
      assessmentId: a1.id,
      studentId: s2.id,
      numericScore: 64.0,
      classification: GradeClassification.Merit,
      isPublished: false, // WITHHELD! Staff sees it, student does not
      feedback: 'Good theoretical analysis. 5% penalty applied due to late submission. Moderation pending.',
      gradedBy: 'Dr. Tanjina Sharmin',
      gradedAt: pastDate(2),
    },
  });

  // Tanvir (s3): Score 52 => Pass (40-59), PUBLISHED
  await prisma.grade.create({
    data: {
      assessmentId: a3.id,
      studentId: s3.id,
      numericScore: 52.0,
      classification: GradeClassification.Pass,
      isPublished: true, // PUBLISHED
      feedback: 'Competent proposal. Literature review could have incorporated more 2024 benchmarks.',
      gradedBy: 'Prof. Dr. Mahbubur Rahman',
      gradedAt: pastDate(1),
    },
  });

  console.log('🎉 Seeding completed successfully!');
}

if (process.env.NODE_ENV !== 'test') {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Error during seeding:', e);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
