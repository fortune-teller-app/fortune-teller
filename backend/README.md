# Fortune Teller — Backend

## Purpose

This is the backend API server for the Fortune Teller application. It is a
standalone Express.js service, separate from the `frontend/` Next.js app,
responsible for business logic, data persistence, and authentication that
the frontend currently simulates with an in-memory mock layer
(`frontend/lib/mock-backend/`).

The backend will be backed by [Supabase](https://supabase.com) (PostgreSQL)
for data storage and authentication.

> **Status:** This is a scaffold. Application middleware is wired up, but no
> routes, controllers, models, or Supabase connection exist yet — that is
> the next development phase.

## Folder Structure

```text
backend/
├── database/
│   └── schema.sql       # Supabase (PostgreSQL) schema — to be filled in
├── src/
│   ├── config/           # Environment/service configuration (e.g. Supabase client setup)
│   ├── controllers/       # Request handlers — receive req/res, delegate to services
│   ├── middleware/        # Express middleware (auth guards, error handling, validation)
│   ├── models/             # Data models / schema types
│   ├── routes/              # Express route definitions, mounted onto the app
│   ├── services/             # Business logic, external API/database calls
│   ├── utils/                 # Shared helper functions
│   ├── app.js                  # Express app setup: middleware, route mounting
│   └── server.js                # Entry point — starts the HTTP server
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Installation

From the `backend/` directory:

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                    | Description                                              |
|------------------------------|------------------------------------------------------------|
| `PORT`                       | Port the Express server listens on (defaults to `5000`).   |
| `SUPABASE_URL`                | URL of the Supabase project.                                |
| `SUPABASE_ANON_KEY`            | Supabase anonymous/public API key.                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-side only — keep secret).   |
| `JWT_SECRET`                     | Secret used to sign/verify JSON Web Tokens.                     |

`.env` is git-ignored and must never be committed.

## Starting the Server

Development (auto-restarts on file changes via `nodemon`):

```bash
npm run dev
```

Production:

```bash
npm start
```

The server starts on `http://localhost:<PORT>` (default `5000`).
