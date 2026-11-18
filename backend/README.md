# ExamHub Backend (Express + PostgreSQL + Prisma)

## Local setup
1. `cd backend && npm install`
2. `cp .env.example .env` and set `DATABASE_URL`, a random `JWT_SECRET` (32+ chars), and the seed passwords.
3. `npx prisma migrate dev --name init` (creates and applies the first migration; commit `prisma/migrations`).
4. `npm run seed` (admin account, plus demo students/exams when `SEED_DEMO=true`).
5. `npm run dev` → http://localhost:4000 · health check: `GET /health`.
6. Frontend (from the repository root): `npm install && npm run dev`. The Vite dev server proxies `/api` to the backend at `http://localhost:4000`; set `VITE_API_URL` only when the API is hosted elsewhere.
7. Tests (server running): `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm test`.

## API (all JSON: `{success, data}` or `{success:false, message, errors?}`)
- `POST /api/auth/register|login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Admin (`Bearer` token, role admin): `GET /admin/dashboard`; `/admin/exams` (CRUD + `PATCH /:id/status`); `/admin/questions` (CRUD, `?examId=`);
  `/admin/students` (CRUD, `?search=&grade=`); `GET /admin/results` (`?examId=&studentId=`), `/results/exams/:examId`, `/results/students/:studentId`, `/results/:id`
- Student: `GET /student/dashboard[/profile|/stats]`; `GET /student/exams[?state=available|upcoming|completed]`; `POST /student/attempts {examId}` (start/resume),
  `GET /student/attempts/:id[/remaining]`, `PUT /student/attempts/:id/answers`, `POST /student/attempts/:id/submit`; `GET /student/results[/:id]`

## Exam integrity
Grading, eligibility and timing are server-side only. Correct options are never sent before submission; scores in request bodies are ignored.
One attempt per student per exam (DB unique constraint); submit/answer/expiry serialize on a row lock inside a transaction; a 30s sweeper plus lazy checks
finalize expired attempts (5s network grace).

## Deploy (Render / Railway / Fly)
1. Create a managed PostgreSQL; copy its connection string (add `?sslmode=require` if the host needs it) into `DATABASE_URL`.
2. Backend service: build `npm install && npx prisma migrate deploy`, start `npm start`. Set `NODE_ENV=production`, `JWT_SECRET`, `CORS_ORIGIN=https://your-frontend`, `TRUST_PROXY=1`.
3. One time: run `npm run seed` (with `SEED_DEMO=false` in production) to create the admin.
4. Frontend: set `VITE_API_URL=https://your-api/api`, `npm run build`, host `dist/` (SPA fallback to index.html).
