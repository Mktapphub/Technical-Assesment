import { Student, Assessment, Submission, Grade, GradeClassification } from './types';

export function classifyGrade(score: number): GradeClassification {
  if (score >= 70) return 'Distinction';
  if (score >= 60) return 'Merit';
  if (score >= 40) return 'Pass';
  return 'Fail';
}

export interface MarksheetItem {
  assessment: Assessment;
  submission: Submission | null;
  grade: Grade | null;
  isPublished: boolean;
}

export interface Marksheet {
  student: Student | null;
  items: MarksheetItem[];
  totalGraded: number;
  publishedCount: number;
  averageScore: number | null;
  overallClassification: GradeClassification | null;
}

/**
 * Builds a per-student marksheet purely from data already fetched from the
 * real API (students, assessments, submissions, grades). No mock/local
 * storage involved — this only reshapes data that's already in memory.
 */
export function buildStudentMarksheet(
  studentId: string,
  students: Student[],
  assessments: Assessment[],
  submissions: Submission[],
  grades: Grade[]
): Marksheet {
  const student = students.find((s) => s.id === studentId) || null;

  const items: MarksheetItem[] = assessments.map((assessment) => {
    const submission =
      submissions.find((s) => s.assessmentId === assessment.id && s.studentId === studentId) ||
      null;
    const grade =
      grades.find((g) => g.assessmentId === assessment.id && g.studentId === studentId) || null;

    return {
      assessment,
      submission,
      grade,
      isPublished: grade?.isPublished ?? false,
    };
  });

  const gradedItems = items.filter((i) => i.grade !== null);
  const totalGraded = gradedItems.length;
  const publishedCount = items.filter((i) => i.isPublished).length;

  let averageScore: number | null = null;
  let overallClassification: GradeClassification | null = null;

  if (totalGraded > 0) {
    const sum = gradedItems.reduce((acc, curr) => acc + (curr.grade?.numericScore || 0), 0);
    averageScore = Math.round((sum / totalGraded) * 10) / 10;
    overallClassification = classifyGrade(averageScore);
  }

  return { student, items, totalGraded, publishedCount, averageScore, overallClassification };
}
