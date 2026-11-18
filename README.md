# ExamHub Online Examination System

ExamHub contains a React/Vite frontend in the repository root and an Express, Prisma, and PostgreSQL backend in `backend/`. When the API is available, accounts and exam data use PostgreSQL and exam answers are graded on the server. When the API is unavailable, the frontend falls back to its local demo data and stores changes in this browser's `localStorage`.

## Local setup

1. Create a PostgreSQL database for the project.
2. In `backend/`, copy `.env.example` to `.env` and set `DATABASE_URL`, a unique `JWT_SECRET` with at least 32 characters, and seed account passwords.
3. Install backend dependencies and initialize the database:

   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npm run seed
   npm run dev
   ```

4. In a second terminal, from the repository root, install and start the frontend:

   ```bash
   npm install
   npm run dev
   ```

The frontend development server proxies `/api` and `/health` to `http://localhost:4000`. Open the URL printed by Vite (normally `http://localhost:5173`). For a separately hosted API, set `VITE_API_URL` to its API base URL, such as `https://your-api.example.com/api`.

The seeded administrator and demonstration student emails are `admin@school.edu` and `sara@school.edu`. Their passwords are the values of `SEED_ADMIN_PASSWORD` and `SEED_DEMO_PASSWORD` in the backend environment. In local storage fallback mode, use `admin@school.edu` / `admin123` or `sara@school.edu` / `student123`. Change backend example passwords before seeding a shared or production database.

More backend configuration, API routes, and deployment notes are in [backend/README.md](backend/README.md).
