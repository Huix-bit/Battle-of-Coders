-- Migration: add email verification columns to existing profiles table
-- Run this in Supabase Dashboard > SQL Editor if profiles table already exists

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified          BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token      TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
