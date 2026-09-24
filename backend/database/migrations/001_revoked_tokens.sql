/*
===========================================================
Migration 001 — REVOKED TOKENS
Project: Fortune Teller
===========================================================

Server-side JWT revocation list.

Logging out inserts the JWT's `jti` here; `authenticate`
rejects any JWT whose `jti` is present, so a copied token
cannot be replayed before it expires.

Run this in the SQL editor of the Supabase project that
SUPABASE_URL in backend/.env points at.

It is idempotent and repairs a partially-created table, so
it is safe to re-run.

The final NOTIFY is required: creating a table makes it
visible to `SELECT` immediately, but the Supabase data API
(PostgREST) serves from a cached schema and returns
PGRST205 "Could not find the table ... in the schema cache"
until that cache is reloaded.
===========================================================
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.revoked_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    jti TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repair a table that was created by hand with missing columns.
ALTER TABLE public.revoked_tokens ADD COLUMN IF NOT EXISTS jti TEXT;
ALTER TABLE public.revoked_tokens ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.revoked_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.revoked_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- `jti` is compared as a string. A UUID column would make a lookup for a
-- non-UUID `jti` fail with 22P02 instead of simply returning no rows.
ALTER TABLE public.revoked_tokens ALTER COLUMN jti TYPE TEXT;

-- A duplicate `jti` would make the single-row revocation lookup fail, which
-- would lock the owner out of every protected route, so drop duplicates
-- before enforcing uniqueness.
DELETE FROM public.revoked_tokens a
    USING public.revoked_tokens b
    WHERE a.jti = b.jti
      AND a.ctid > b.ctid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.revoked_tokens'::regclass
          AND conname = 'revoked_tokens_jti_key'
    ) THEN
        ALTER TABLE public.revoked_tokens
            ADD CONSTRAINT revoked_tokens_jti_key UNIQUE (jti);
    END IF;
END $$;

-- Supports purging rows whose JWT has already expired.
CREATE INDEX IF NOT EXISTS revoked_tokens_expires_at_idx
    ON public.revoked_tokens (expires_at);

-- Matches the rest of the schema. The backend connects with the service role,
-- which bypasses RLS, so no policy is needed; leaving RLS on keeps the table
-- unreadable through the anon key.
ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.revoked_tokens TO service_role;

-- Make the new table visible to the Supabase data API.
NOTIFY pgrst, 'reload schema';
