/*
===========================================================
Fortune Teller Database Schema
Database: PostgreSQL (Supabase)
Author: SM Tausif
Project: Fortune Teller
===========================================================

Description:
This file contains the complete database schema for the
Fortune Teller application.

It includes:
- Extensions
- Tables
- Primary Keys
- Foreign Keys
- Constraints
- Default Values
- Row Level Security (RLS)

===========================================================
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    profile_image_url TEXT,

    account_status VARCHAR(20) DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUBSCRIPTION PLAN
-- =====================================================

CREATE TABLE subscription_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,

    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),

    max_palm_readings INT,
    max_astrology_readings INT,
    max_dream_entries INT,
    max_tarot_readings INT,

    includes_detailed_reports BOOLEAN DEFAULT FALSE,
    includes_ad_free_access BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_plan ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER SUBSCRIPTION
-- =====================================================

CREATE TABLE user_subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plan(id),

    status VARCHAR(20) NOT NULL DEFAULT 'active',
    billing_cycle VARCHAR(20) NOT NULL,

    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    gateway_subscription_id VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_subscription ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ASTROLOGY PROFILE
-- =====================================================

CREATE TABLE astrology_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    birth_date DATE NOT NULL,
    birth_time TIME,
    birth_city VARCHAR(100),
    birth_country VARCHAR(100),

    zodiac_sign VARCHAR(50),
    moon_sign VARCHAR(50),
    rising_sign VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

ALTER TABLE astrology_profile ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DREAM ENTRY
-- =====================================================

CREATE TABLE dream_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(255),
    dream_text TEXT NOT NULL,

    mood_before VARCHAR(50),
    mood_after VARCHAR(50),

    is_favorite BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dream_entry ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PALM SCAN
-- =====================================================

CREATE TABLE palm_scan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    hand_type VARCHAR(20),

    uploaded_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE palm_scan ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- READING SESSION
-- =====================================================

CREATE TABLE reading_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    session_type VARCHAR(50) NOT NULL,

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    status VARCHAR(20) DEFAULT 'completed',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reading_session ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TAROT READING
-- =====================================================

CREATE TABLE tarot_reading (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES reading_session(id) ON DELETE CASCADE,

    spread_type VARCHAR(100),
    cards JSONB NOT NULL,

    interpretation TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tarot_reading ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PALM READING
-- =====================================================

CREATE TABLE palm_reading (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES reading_session(id) ON DELETE CASCADE,
    palm_scan_id UUID NOT NULL REFERENCES palm_scan(id) ON DELETE CASCADE,

    hand_shape VARCHAR(100),
    life_line TEXT,
    heart_line TEXT,
    head_line TEXT,
    fate_line TEXT,

    interpretation TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE palm_reading ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ASTROLOGY READING
-- =====================================================

CREATE TABLE astrology_reading (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES reading_session(id) ON DELETE CASCADE,
    astrology_profile_id UUID NOT NULL REFERENCES astrology_profile(id) ON DELETE CASCADE,

    reading_type VARCHAR(100),

    sun_sign VARCHAR(50),
    moon_sign VARCHAR(50),
    rising_sign VARCHAR(50),

    interpretation TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE astrology_reading ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DREAM INTERPRETATION
-- =====================================================

CREATE TABLE dream_interpretation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES reading_session(id) ON DELETE CASCADE,
    dream_entry_id UUID NOT NULL REFERENCES dream_entry(id) ON DELETE CASCADE,

    symbols JSONB,

    interpretation TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dream_interpretation ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FEEDBACK
-- =====================================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES reading_session(id) ON DELETE SET NULL,

    rating INT CHECK (rating BETWEEN 1 AND 5),

    comment TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SAVED READING
-- =====================================================

CREATE TABLE saved_reading (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES reading_session(id) ON DELETE CASCADE,

    saved_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, session_id)
);

ALTER TABLE saved_reading ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER ACTIVITY METRIC
-- =====================================================

CREATE TABLE user_activity_metric (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    total_readings INT DEFAULT 0,
    tarot_readings INT DEFAULT 0,
    palm_readings INT DEFAULT 0,
    astrology_readings INT DEFAULT 0,
    dream_interpretations INT DEFAULT 0,

    last_active_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id)
);

ALTER TABLE user_activity_metric ENABLE ROW LEVEL SECURITY;