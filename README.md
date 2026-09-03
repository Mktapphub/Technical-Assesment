# Student Management System - Registry Module

A focused web application covering the four core Registry workflows from the PEN Global technical assessment: **Student Enrolment**, **Fees & Payments**, **Assessment Submission**, and **Marksheet & Results**.

Built for the PEN Global technical assessment (Student Management System - Registry Module).

## Tech Stack

- **Next.js (App Router)** — frontend and API routes in a single project
- **PostgreSQL** — real relational database (no mocked data in `useState`)
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

3. **Push the schema to your database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the database** with demo data (programmes, students, payments, assessments, submissions, grades, and the Registry login)
   ```bash
   npx prisma db seed
   ```

5. **Start the dev server**
   ```bash
   npm run dev
   ```

   The app runs at [http://localhost:3000](http://localhost:3000).

## Deliverables Checklist

- [x] Next.js App Router project with working API routes for all four modules
- [x] `prisma/schema.prisma` with Student, Programme, Payment, Assessment, Submission, Grade, StaffUser models
- [x] **Seed script with 6 students, 3 programmes, fees, sample payments and grades** (exceeding the assessment's minimum of 5 students / 2 programmes) — including an overdue student, a late submission, and a withheld grade
- [x] Staff view (Registry dashboard) and Student view (self-service portal)
- [x] `.env.example` with no committed credentials

## Environment Variables

See `.env.example` for the full list. In short:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string, used by the app at runtime |
| `DIRECT_URL` | Direct (non-pooled) Postgres connection string, used only for running migrations |
| `DEV_ORIGIN` | Optional. Only needed if you access the dev server from a non-localhost address (cloud IDE, VM, LAN device) — Next.js prints the exact value to use if it blocks you |

If you're using a provider without connection pooling (e.g. a local Postgres instance), `DATABASE_URL` and `DIRECT_URL` can point to the same connection string.

No credentials are committed anywhere in this repo — `.env` is git-ignored, and the database client throws a clear error at startup if `DATABASE_URL` is missing rather than silently falling back to anything.

**Hosted on Supabase.** The demo/live database runs on Supabase-hosted PostgreSQL rather than a local instance — `DATABASE_URL` points at Supabase's pooled connection for normal app queries, and `DIRECT_URL` points at Supabase's direct connection for Prisma migrations. Because every module reads and writes through the same Prisma client against this one hosted database, all data — enrolments, payments, submissions, grades — stays in sync in real time across the Staff dashboard and the Student portal; there's no local cache or per-tab state to fall out of date.

## Logging In (Demo)

Authentication is intentionally simplified per the assessment's allowance for "a simple role toggle" — there's no password hashing or session tokens. But every login is checked against a real database record: there is no keyword guessing (e.g. "any email containing 'admin'") and no hardcoded accounts. A `Student` row or a `StaffUser` row must actually exist with that exact email/ID and password, or the login is rejected with a 401/404.

- **As a student**: enter a seeded student's email (e.g. `minhajul.khan@university.edu.bd`) or Student ID (e.g. `SMS-2025-0001`), with their password (default: `student123`, unless the Registry has changed it for that student via the enrolment screen).
- **As Registry staff**: enter the seeded `StaffUser` email `admin@university.edu.bd` with password `admin123`.

There is a single Registry/staff role (no separate faculty/teacher role) — the assessment only asks for "a Staff view and a Student view," so the data model reflects that directly instead of an unrequested three-way split.

## 📊 Sample Demo Data

> **✅ Assessment requirement met and exceeded:** *"A seed script that loads demo data: at least 5 students, 2 programmes, fees, and sample grades."*
> This project ships with **6 students** (1 more than required), **3 programmes** (1 more than required), fees assigned to every programme with real payments recorded against them, and **3 sample grades** — including a published and a withheld one to demonstrate the publish/withhold rule in action.

So a reviewer doesn't have to go digging through `seed.ts`, here's exactly what's sitting in the database after seeding — 3 programmes, 6 students, and a spread of edge cases built in on purpose:

| Student ID | Name | Programme | Status | Fee Situation |
|---|---|---|---|---|
| `SMS-2025-0001` | Minhajul Khan | BSc (Hons) Computer Science | Enrolled | Fully paid |
| `SMS-2025-0002` | Nusrat Jahan | BSc (Hons) Computer Science | Enrolled | **Overdue** (partial payment, deadline passed) |
| `SMS-2025-0003` | Tanvir Ahmed | MSc Data Analytics & AI | Enrolled | Partial payment, not yet due |
| `SMS-2025-0004` | Sadia Rahman | BA (Hons) Business Management & Economics | Deferred | Not yet due |
| `SMS-2025-0005` | Farhan Chowdhury | BSc (Hons) Computer Science | Withdrawn | Unpaid, but correctly **not** flagged overdue |
| `SMS-2025-0006` | Anika Tabassum | MSc Data Analytics & AI | Completed | Historic fee, past due |

Login with any student's email (e.g. `minhajul.khan@university.edu.bd`) and password `student123` to see their portal, or `admin@university.edu.bd` / `admin123` for the Registry dashboard.

Also seeded, so reviewers can see every edge case working end-to-end without setting anything up:
- **A published, top grade** — Minhajul: 82 → Distinction, visible to the student.
- **A withheld grade** — Nusrat: 64 → Merit, visible to staff only; her portal shows "not yet published" instead of the mark.
- **A late submission** — flagged automatically since it was uploaded after the assessment deadline.

### 🔍 Proof This Is Real Data, Not Mocked

It's easy to *claim* "no mocked data" — here's how to actually verify it, in under a minute each:

1. **Open your browser's Network tab** while using the app. Every screen — Student Enrolment, Fees, Submissions, Grades — fires a real `fetch` to a Next.js API route (`/api/students`, `/api/payments`, `/api/submissions`, `/api/grades`) and renders whatever JSON comes back. There's no local array being read instead.
2. **Run `npx prisma studio`** against the same `DATABASE_URL` in your `.env`. It opens a browser GUI straight onto the Supabase database — you'll see the exact same students, payments, and grades that the app is showing, because it's the same table.
3. **Edit a record directly in Prisma Studio** (e.g. change a student's fee due date) and refresh the app — the change appears immediately, because the app has nowhere else to read from.
4. **Unset `DATABASE_URL`** and start the app. It won't quietly fall back to demo data — `src/lib/prisma.ts` throws immediately (`DATABASE_URL is not set...`) and the dev server refuses to serve requests. A mock-data app would keep working fine with no database at all; this one can't.
5. **Search the codebase** for a hardcoded student list — there isn't one. Every component fetches from `src/lib/api-sync.ts`, which only ever talks to `/api/*` routes; there's no `useState` array pre-loaded with student objects anywhere in `src/components/`.
6. **Kill your database connection** while the app is running and refresh. Instead of silently showing stale or fake data, a visible red banner appears ("Could not reach the database API...") — proof the UI has no fallback data to quietly substitute in.

## Key Product Decisions

- **Overdue balance rule**: a student should be flagged overdue when `outstandingBalance > 0 AND now > feeDueDate AND enrolmentStatus !== Withdrawn` — Withdrawn students are no longer expected to pay, so they shouldn't be chased for arrears.
- **Resubmission**: submissions use a database-level unique constraint on `(assessmentId, studentId)`. Re-uploading before the deadline overwrites the existing row (via `upsert`) rather than creating a duplicate; `isLate` is recalculated server-side against the assessment deadline on every submission.
- **Publish/withhold enforcement**: `Grade.isPublished` defaults to `false`. The Student Portal always fetches full data but only renders published items — students never see marks or classifications for withheld grades, and see an explicit "not yet published" state instead of a blank row.
- **Grade classification**: derived server-side from `numericScore` (Fail < 40, Pass ≥ 40, Merit ≥ 60, Distinction ≥ 70), never trusted from client input.

## How I Used AI

I took suggestions from AI tools like ChatGPT and Claude AI throughout the build. Using their input, I designed my workflow around the Agile method of software engineering, breaking the work into iterations across the four Registry modules and taking suggestions from AI at each stage to review and refine the implementation.

## ✨ Features

Beyond the four required Registry workflows, a few things were built in deliberately to make the app feel less like a checklist and more like something a Registry team would actually enjoy using.

### 🔐 A Real Login System (Optional, But Worth Doing Right)

**No toggle. No shortcuts.** I built a real, fully responsive, database-backed login system:

- Every login checks a real `Student` or `StaffUser` row — no keyword guessing, no hardcoded accounts, no bypassing the check.
- Students can log in with either their email or their Student ID.
- Passwords are per-record and changeable — Registry staff can update a student's password from the enrolment screen, and students can change their own via the Change Password modal.
- Wrong credentials fail loudly with a clear 401/404, instead of silently falling through to a demo account.

**Why it matters:** it makes the demo feel like a real product instead of a prototype — the Staff view and Student view are genuinely gated, not just two tabs sitting side by side. It also meant every other module (fees, submissions, grades) could be built against a real, authenticated user identity from day one, instead of being retrofitted for auth later.

### 🎨 A Colorful, Considered UI

Rather than reaching for a generic admin-dashboard template, the interface uses a warm, intentional palette (soft parchment backgrounds, deep navy text, accent colors per module) built on top of Tailwind, with a dedicated `primitives.tsx` so buttons, cards, badges, and modals stay visually consistent across all four workflows. Status is always color-coded at a glance — enrolment status, overdue balances, late submissions, published vs. withheld grades — so a Registry officer scanning the dashboard doesn't have to read every row to spot what needs attention.

### 🧹 Clean, Understandable Code

- One typed data model (`prisma/schema.prisma`) is the single source of truth — no duplicated shapes between frontend and backend.
- API routes are organized one-per-resource (`/api/students`, `/api/payments`, `/api/submissions`, `/api/grades`, ...), each with focused, readable handlers rather than one catch-all endpoint.
- Business rules that matter (overdue logic, grade classification, late-submission detection) are computed server-side, in one place, rather than scattered across components — so the UI is always just rendering, never deciding.
- Naming follows the assessment's own vocabulary (`enrolmentStatus`, `outstandingBalance`, `isPublished`) so the schema reads like the spec, not like a translation of it.

### 📋 How to Use It

1. **Log in** as Registry staff (`admin@university.edu.bd` / `admin123`) to see the full dashboard, or as a seeded student to see the self-service portal.
2. **Enrol a student** — search, filter, and manage records from the Student Enrolment tab.
3. **Record a payment** — outstanding balances and overdue flags update immediately across the dashboard.
4. **Create an assessment and submit work** — as staff, set a deadline; as a student, upload a PDF/DOCX before or after it to see the late flag in action.
5. **Enter and publish grades** — grades stay invisible to students until explicitly published, so you can toggle publish/withhold and watch the Student Portal respond in real time.


📸 Screenshots :

<img width="1366" height="545" alt="image" src="https://github.com/user-attachments/assets/568a94df-b509-4f40-92f3-26ac352fe6b5" />
<img width="567" height="485" alt="image" src="https://github.com/user-attachments/assets/dac4b042-6c79-411f-9ab5-6bd175ec295d" />



