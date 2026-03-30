-- ============================================================
-- LEAR MARKET — Job Applications Schema
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- ============================================================
-- LOCATION UPDATE (run this if you already have the base schema)
-- ============================================================

-- Add location column to job_positions
ALTER TABLE public.job_positions
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'LEAR MARKET 1' 
  CHECK (location IN ('LEAR MARKET 1', 'LEAR MARKET 2'));

-- Add location column to job_applications
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'LEAR MARKET 1'
  CHECK (location IN ('LEAR MARKET 1', 'LEAR MARKET 2'));

-- Fix unique constraint: title must be unique per location, not globally
ALTER TABLE public.job_positions DROP CONSTRAINT IF EXISTS job_positions_title_key;
ALTER TABLE public.job_positions ADD CONSTRAINT job_positions_title_location_key UNIQUE (title, location);

-- Add label column to job_applications
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS label TEXT DEFAULT NULL
  CHECK (label IS NULL OR label IN ('Prioritet i Lartë', 'Kandidat i Mundshëm', 'Në Pritje të Dokumenteve', 'Shënuar'));

-- ============================================================
-- NEW TABLES (run these if you already have the base schema)
-- ============================================================

-- application_notes: timestamped private notes per application
CREATE TABLE IF NOT EXISTS public.application_notes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID        NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  content        TEXT        NOT NULL,
  created_by     TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage notes" ON public.application_notes;
CREATE POLICY "Admin can manage notes"
  ON public.application_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- admin_profiles: roles for admin users (editor = full access, viewer = read-only)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read profiles" ON public.admin_profiles;
CREATE POLICY "Admins can read profiles"
  ON public.admin_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.admin_profiles;
CREATE POLICY "Admins can manage profiles"
  ON public.admin_profiles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================

-- 0. Create the job_positions table (managed by admin)
CREATE TABLE IF NOT EXISTS public.job_positions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (title, location)
);

ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;

-- Anyone can read positions (needed for the public form)
DROP POLICY IF EXISTS "Public can read positions" ON public.job_positions;
CREATE POLICY "Public can read positions"
  ON public.job_positions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admin can add positions
DROP POLICY IF EXISTS "Admin can insert positions" ON public.job_positions;
CREATE POLICY "Admin can insert positions"
  ON public.job_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admin can delete positions
DROP POLICY IF EXISTS "Admin can delete positions" ON public.job_positions;
CREATE POLICY "Admin can delete positions"
  ON public.job_positions
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================

-- 1. Create the job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT        NOT NULL,
  phone             TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  city              TEXT,
  position          TEXT        NOT NULL,
  experience        TEXT,
  cover_letter      TEXT,
  availability      TEXT,
  profile_image_url TEXT        NOT NULL,
  cv_file_url       TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'Pending'
                                CHECK (status IN ('Pending', 'Reviewing', 'Accepted', 'Rejected')),
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Public users (anon) can INSERT only
DROP POLICY IF EXISTS "Public can submit applications" ON public.job_applications;
CREATE POLICY "Public can submit applications"
  ON public.job_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admin can SELECT
DROP POLICY IF EXISTS "Admin can view all applications" ON public.job_applications;
CREATE POLICY "Admin can view all applications"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated admin can UPDATE
DROP POLICY IF EXISTS "Admin can update applications" ON public.job_applications;
CREATE POLICY "Admin can update applications"
  ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated admin can DELETE
DROP POLICY IF EXISTS "Admin can delete applications" ON public.job_applications;
CREATE POLICY "Admin can delete applications"
  ON public.job_applications
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 4. Storage Buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-files', 'cv-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: profile-images
DROP POLICY IF EXISTS "Anyone can upload profile images" ON storage.objects;
CREATE POLICY "Anyone can upload profile images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Profile images are publicly readable" ON storage.objects;
CREATE POLICY "Profile images are publicly readable"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Admin can delete profile images" ON storage.objects;
CREATE POLICY "Admin can delete profile images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-images');

-- Storage policies: cv-files
DROP POLICY IF EXISTS "Anyone can upload CV files" ON storage.objects;
CREATE POLICY "Anyone can upload CV files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'cv-files');

DROP POLICY IF EXISTS "CV files are publicly readable" ON storage.objects;
CREATE POLICY "CV files are publicly readable"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'cv-files');

DROP POLICY IF EXISTS "Admin can delete CV files" ON storage.objects;
CREATE POLICY "Admin can delete CV files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cv-files');
