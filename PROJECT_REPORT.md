# ExamHub: Online Examination System

## 1. Introduction

ExamHub is a web-based examination system for schools and other learning organizations. It provides separate workspaces for administrators and students. Administrators can manage exams, questions, student records, and results. Students can view scheduled exams, complete timed multiple-choice assessments, and review their scores. The React frontend communicates with an Express API, and PostgreSQL stores the application data.

## 2. Project Objectives

- Provide an easy-to-use interface for organizing online exams.
- Let administrators create exams, define schedules and passing marks, and maintain question banks.
- Give students a dashboard showing available, upcoming, and completed exams.
- Support timed exam attempts and automatic scoring of multiple-choice answers.
- Present results to students and administrators in searchable tables and summary dashboards.

## 3. Scope

The application implements the main user flows of an online examination platform: sign-in and student registration, role-based navigation, exam and question management, exam-taking, automatic grading, and results review. A backend seed script can supply example users, exams, and questions. Essay grading and exam proctoring are outside the current scope.

## 4. Technology Stack

- **React 18** for the user interface and reusable components.
- **Vite** for local development and production builds.
- **React Router** for page navigation and protected role-based routes.
- **Tailwind CSS** for styling.
- **Recharts** for dashboard charts.
- **Lucide React** for interface icons.
- **Browser `localStorage`** for the signed-in JWT token and offline demo data.
- **PostgreSQL** for persistent application records.
- **Prisma** for database access and schema migrations.
- **Express** for API routes, validation, authentication, and server-side grading.

## 5. System Design

The project is organized as a React single-page application and a separate Express API. `src/main.jsx` mounts the frontend and its providers. `src/App.jsx` defines routes for authentication, administrator pages, and student pages. `src/context/AppContext.jsx` loads and updates data through the API client in `src/utils/api.js`. The backend routes requests through controllers and services, validates request bodies, authenticates users with JWTs, and uses Prisma to access PostgreSQL. The backend seed script creates an administrator and optional sample students and exams.

Protected routes check the signed-in user's role before displaying administrator or student pages. Shared components provide the dashboard layout, forms, dialogs, badges, and result tables.

## 6. Main Features

### Administrator

- Dashboard summaries for student counts, exams, activity, and completion.
- Charts showing average scores by exam and pass/fail counts.
- Create, edit, search, activate, deactivate, and delete exams.
- Add and manage multiple-choice questions, answer options, correct answers, and marks.
- Maintain student names, email addresses, and class or year labels.
- Review student results, marks, percentages, pass status, dates, and answer details.

### Student

- Register for a student account or sign in with an existing account.
- View available, upcoming, and completed exams with schedule and duration details.
- Take an exam using a countdown timer, question navigation, and answer selection.
- Submit answers manually or have the attempt submitted when time expires.
- Review scores and see selected answers alongside correct answers.

### Grading and Exam Rules

Each question has a mark value. The grading helper adds marks for correct selected answers, calculates the percentage, and compares the score with the exam's passing mark. The application prevents a second recorded attempt for the same student and exam. Exam availability depends on its active setting, start and end times, and whether the student has already submitted an attempt.

## 7. Data and Persistence

Application records normally live in PostgreSQL. The frontend keeps the API JWT in `localStorage` under `oes-token`. If the API is unavailable, the app switches to its browser-local demonstration store under `oes`, where accounts, exams, questions, and results persist on that browser. The backend seed script initializes server-side demonstration accounts and exams when configured to do so.

The seed accounts use these email addresses. Set their passwords in `backend/.env` before running the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@school.edu` | `SEED_ADMIN_PASSWORD` |
| Student | `sara@school.edu` | `SEED_DEMO_PASSWORD` |

Additional demonstration student accounts use the same `SEED_DEMO_PASSWORD` value.

## 8. Running the Project

Create a PostgreSQL database, configure `backend/.env` using `backend/.env.example`, then run these backend commands:

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

In a second terminal, start the frontend from the repository root:

```bash
npm install
npm run dev
```

To create a production build, run:

```bash
npm run build
```

The project can also be served locally with `npm run preview` after building.

## 9. Limitations and Future Improvements

The application now uses server-side authentication and database persistence, but a production deployment still needs secure environment configuration, HTTPS, a managed database, and appropriate operational monitoring. A production version could add:

- Exportable reports and stronger filtering for exam results.
- Accessibility review, automated test coverage, and deployment configuration.
- Additional question types and support for manually graded responses.

## 10. Conclusion

ExamHub demonstrates an end-to-end online assessment workflow through its role-specific dashboards, exam management tools, timed attempts, server-side grading, and result review. The frontend and API are connected, with PostgreSQL providing shared persistence for continued development toward a production school system.
