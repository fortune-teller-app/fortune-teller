# fortune-teller
<p align="center">
  <img src="docs/logo.png" alt="Fortune Teller Logo" width="180"/>
</p>

<h1 align="center">Fortune Teller</h1>

<p align="center">
An AI-powered fortune telling platform that combines Tarot Reading, Palm Reading, Dream Interpretation, and Astrology into a personalized spiritual guidance experience.
</p>

---

# Overview

Fortune Teller is a full-stack web application that provides users with personalized AI-assisted spiritual readings. The platform allows users to explore different forms of fortune telling while tracking their history, subscriptions, and personalized insights.

---

# Features

- AI Tarot Card Readings
- AI Palm Reading
- Dream Interpretation
- Astrology Profile & Readings
- User Authentication
- Subscription Plans
- Reading History
- Saved Readings
- Feedback System
- User Analytics Dashboard

---

# Technology Stack

## Frontend

- Next.js
- React
- Tailwind CSS

## Backend

- Node.js
- Express.js
- REST API

## Database

- PostgreSQL (Supabase)

## AI

- OpenAI
- OCR / Image Processing
- Future AI Integrations

---

# Project Structure

```text
fortune-teller/
│
├── backend/
│
├── frontend/
│
├── docs/
│   └── logo.png
│
└── README.md
```

---

# Entity Relationship Diagram (ERD)

<p align="center">
  <img src="docs/Database/Fortune_Teller_ERD.png" alt="ERD" width="1000"/>
</p>

---

# Installation

Clone the repository.

```bash
git clone https://github.com/fortune-teller-app/fortune-teller.git
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on:

```
http://localhost:3000
```

---

## Backend

```bash
cd backend
npm install
npm run dev
```

Runs on:

```
http://localhost:5001
```

## Automated Tests

Run the login and session tests from each application directory:

```bash
cd backend
npm test

cd ../frontend
npm test
```

The suite covers successful and failed login, registration persistence and rollback,
JWT validation, frontend cookie creation/removal, remembered sessions, logout behavior,
and authenticated-user data isolation.

## CI/CD

`.github/workflows/ci-cd.yml` runs the backend tests, frontend tests, and a production
frontend build for pull requests and pushes to `main`.

After those checks pass on `main`, the workflow deploys the frontend to Vercel when
these GitHub Actions repository secrets are configured:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If the secrets are not present, CI still runs and the deployment step is safely skipped.
The backend deployment target is intentionally left unconfigured until a backend host is selected.

Pushes to `main` and manually triggered workflows also run the live backend integration
suite when these dedicated test-project secrets are configured:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

The live suite creates uniquely named QA records and removes them before exiting.

---

# Environment Variables

Create a `.env` file inside the **backend** folder.

```env
PORT=5001

SUPABASE_URL=

SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

JWT_SECRET=
```

---

# Database

The project uses **Supabase PostgreSQL**.

Database schema:

```
backend/database/schema.sql
```

---

# Test Users

| User | Email | Password | Plan |
|------|-------|----------|------|
| Liora Vance | liora@example.com | seeker123 | Free |
| Fiora Vance | fiora@example.com | oracle123 | Oracle |

Log in with either account to compare the free and premium experiences.

The current implementation stores the user session in an **httpOnly cookie (`mock_user_id`)** that persists throughout the browser session.

Registered users are stored in memory during development and will reset when the server restarts.

---

# Contributors

| Team Member | Responsibility |
|-------------|----------------|
| **SM Tausif** | Database Design, Backend Development |
| **Bora Dag** | Frontend Development, Deployment |
| **Berke Balibasa** | AI & Machine Learning |
| **Mustafa Abidi** | Backend Development & Testing |

---

# Documentation

- Backend documentation: `backend/README.md`
- Database schema: `backend/database/schema.sql`
- Entity Relationship Diagram: `backend/database/Fortune_Teller_ERD.png`

---

# License

This project was developed as part of an academic software engineering project.
