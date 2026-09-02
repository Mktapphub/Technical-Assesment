// Next.js App Router API integration client
// Interacts directly with /api/* routes connected to PostgreSQL + Prisma

export async function loginViaDB(data: { email?: string; identifier?: string; password?: string; role?: string }) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Authentication failed');
    }
    return result;
  } catch (err: any) {
    console.error('Error logging in via DB:', err);
    throw err;
  }
}

export async function updateStudentPasswordInDB(idOrStudentId: string, newPassword: string) {
  try {
    const res = await fetch(`/api/students/${idOrStudentId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update password in database');
    }
    return data;
  } catch (err: any) {
    console.error('Error in updateStudentPasswordInDB:', err);
    throw err;
  }
}

export async function fetchStudentsFromDB() {
  try {
    const res = await fetch('/api/students');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchProgrammesFromDB() {
  try {
    const res = await fetch('/api/programmes');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPaymentsFromDB() {
  try {
    const res = await fetch('/api/payments');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAssessmentsFromDB() {
  try {
    const res = await fetch('/api/assessments');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSubmissionsFromDB() {
  try {
    const res = await fetch('/api/submissions');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchGradesFromDB() {
  try {
    const res = await fetch('/api/grades');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchStatsFromDB() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createStudentInDB(data: any) {
  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to save student to database');
    }
    return result;
  } catch (err: any) {
    console.error('Error saving student to database:', err);
    throw err;
  }
}

export async function updateStudentInDB(id: string, data: any) {
  try {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteStudentInDB(id: string) {
  try {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function toggleGradePublishInDB(id: string, isPublished: boolean) {
  try {
    const res = await fetch('/api/grades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublished }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createPaymentInDB(data: any) {
  try {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function submitAssessmentInDB(data: any) {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createAssessmentInDB(data: any) {
  try {
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to save assessment to database');
    }
    return result;
  } catch (err: any) {
    console.error('Error saving assessment to database:', err);
    throw err;
  }
}

export async function recordGradeInDB(data: any) {
  try {
    const res = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function seedDB() {
  try {
    const res = await fetch('/api/seed', { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
