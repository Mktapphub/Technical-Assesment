# Student Management System - Registry Module

A focused web application covering the core Registry workflows of a Student Management System: **Student Enrolment**, **Fees & Payments**, **Assessment Submission**, and **Marksheet & Results**.

Built for the PEN Global technical assessment.

## Tech Stack

- **Next.js 14+ (App Router)** — frontend and API routes in a single project
- **PostgreSQL** — real relational database (no mocked data)
- **Prisma ORM** — schema, migrations, and typed queries (`prisma/schema.prisma`)
- **Tailwind CSS** — styling

## Setup & Running Locally

1. **Clone the repo and install dependencies**
   ```bash
   npm install
   ```

2. **Set up your database connection**

   Copy `.env.example` to `.env` and fill in your PostgreSQL connection strings (see [Environment Variables](#environment-variables) below):
   ```bash
   cp .env.example .env
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database** with demo data (programmes, students, payments, assessments, submissions, grades)
   ```bash
   npx prisma db seed
   ```

5. **Start the dev server**
   ```bash
   npm run dev
   ```

   The app runs at [http://localhost:3000](http://localhost:3000).

### Resetting demo data

The dashboard has a "Reset to seed data" action (admin role) that re-runs the seed script against the live database via `POST /api/seed`, in case you want to restore the original demo state after testing.

## Environment Variables

See `.env.example` for the full list. In short:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string, used by the app at runtime |
| `DIRECT_URL` | Direct (non-pooled) Postgres connection string, used only for running migrations |

If you're using a provider without connection pooling (e.g. a local Postgres instance), `DATABASE_URL` and `DIRECT_URL` can point to the same connection string.

## Logging In (Demo)

Authentication is intentionally simplified per the assessment's allowance for "a simple role toggle." There's no password hashing or session tokens — just a lightweight role-detection login against the real `Student` table:

- **As a student**: enter a seeded student's email (e.g. `minhajul.khan@university.edu.bd`) or Student ID (e.g. `SMS-2025-0001`). Default password: `student123`.
- **As Registry staff/admin**: enter any email containing a keyword like `admin`, `registry`, or `staff` (e.g. `admin@university.edu`) — no password required.

## Key Product Decisions

- **Overdue balance rule**: a student is flagged overdue when `outstandingBalance > 0 AND now > feeDueDate AND enrolmentStatus !== Withdrawn`. Withdrawn students are excluded since they're no longer expected to pay.
- **Resubmission**: submissions use a database-level unique constraint on `(assessmentId, studentId)`. Re-uploading before the deadline overwrites the existing row (via `upsert`) rather than creating a duplicate; `isLate` is recalculated server-side against the assessment deadline on every submission.
- **Publish/withhold enforcement**: `Grade.isPublished` defaults to `false`. The Student Portal always fetches full data but only renders published items - students never see marks or classifications for withheld grades, and see an explicit "not yet published" state instead of a blank row.
- **Grade classification**: derived server-side from `numericScore` (Fail < 40, Pass ≥ 40, Merit ≥ 60, Distinction ≥ 70), never trusted from client input.

## How I Used AI

This project was built with Google AI Studio for initial scaffolding (Next.js App Router structure, Prisma schema, UI components) and Claude for architectural review, correcting schema/logic against the assessment's exact requirements, and fixing structural issues.

Specifically:
- AI Studio's first pass mixed a Vite + Express implementation with an unused, partially-built Next.js `app/` directory left over from an earlier iteration. I identified this during review (the live `npm run dev` script was running Vite, not Next.js, in violation of the stack requirement) and consolidated the project down to a single, working Next.js App Router implementation, porting the more complete logic (e.g. server-side late-submission detection) from the abandoned Express routes into proper Next.js route handlers.
- AI Studio's initial enum values (`PROVISIONAL/CONFIRMED/WITHDRAWN`, UK honours classifications) didn't match the assessment's exact spec (`Enrolled/Deferred/Withdrawn/Completed`, `Fail/Pass/Merit/Distinction`) — corrected across the schema, seed data, and every component that referenced them.
- Removed a redundant client-side localStorage "mock database" layer that AI Studio had generated as a fallback alongside the real Prisma-backed API calls. Every module was calling both the real API and the mock store on every write; the mock path added no functionality and risked masking real DB failures, so it was removed and replaced with an explicit connection-error state instead of a silent fallback.
- Manually reviewed and fixed the overdue-balance calculation, publish/withhold enforcement, and one-submission-per-student-with-resubmission logic against the assessment's exact edge-case requirements.

## Deliverables Checklist

- [x] Next.js App Router project with working API routes for all four modules
- [x] `prisma/schema.prisma` with Student, Programme, Payment, Assessment, Submission, Grade models
- [x] Seed script with 5+ students, 2+ programmes, fees, sample grades (including an overdue student, a late submission, and a withheld grade)
- [x] Staff view (Registry admin dashboard) and Student view (self-service portal)
- [x] `.env.example` with no committed credentials
