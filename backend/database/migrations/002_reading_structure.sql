/*
===========================================================
Migration 002 — READING STRUCTURE
Project: Fortune Teller
===========================================================

Shared structure for readings of every practice.

reading_session is the one row every reading has, whatever
its practice; the practice-specific detail lives in
tarot_reading, palm_reading, astrology_reading, or
dream_interpretation.

This migration:
- adds title and summary, so a reading list can be shown
  without joining every practice's detail table;
- indexes a user's readings newest-first;
- restricts session_type and status to the values the
  backend defines in backend/src/models/readingTypes.js.

Run this in the SQL editor of the Supabase project that
SUPABASE_URL in backend/.env points at.

It is idempotent, so it is safe to re-run.

The constraints are added NOT VALID, so they apply to every
new or updated row straight away without failing on rows
written before them. Existing rows are then validated; if any
do not match, the migration still completes and raises a
WARNING naming the constraint. Fix those rows and re-run to
validate it.

The final NOTIFY is required: the Supabase data API
(PostgREST) serves a cached schema and will not see the new
columns until that cache is reloaded.
===========================================================
*/

ALTER TABLE public.reading_session ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.reading_session ADD COLUMN IF NOT EXISTS summary TEXT;

-- Matches the reading-list query: one user's sessions, newest first.
CREATE INDEX IF NOT EXISTS reading_session_user_created_at_idx
    ON public.reading_session (user_id, created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.reading_session'::regclass
          AND conname = 'reading_session_session_type_check'
    ) THEN
        ALTER TABLE public.reading_session
            ADD CONSTRAINT reading_session_session_type_check
            CHECK (session_type IN ('tarot', 'palmistry', 'astrology', 'dream', 'daily'))
            NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.reading_session'::regclass
          AND conname = 'reading_session_status_check'
    ) THEN
        ALTER TABLE public.reading_session
            ADD CONSTRAINT reading_session_status_check
            CHECK (status IN ('completed'))
            NOT VALID;
    END IF;
END $$;

DO $$
BEGIN
    ALTER TABLE public.reading_session VALIDATE CONSTRAINT reading_session_session_type_check;
EXCEPTION WHEN check_violation THEN
    RAISE WARNING 'reading_session has rows with an unsupported session_type; reading_session_session_type_check stays NOT VALID until they are fixed.';
END $$;

DO $$
BEGIN
    ALTER TABLE public.reading_session VALIDATE CONSTRAINT reading_session_status_check;
EXCEPTION WHEN check_violation THEN
    RAISE WARNING 'reading_session has rows with an unsupported status; reading_session_status_check stays NOT VALID until they are fixed.';
END $$;

-- Make the new columns visible to the Supabase data API.
NOTIFY pgrst, 'reload schema';
