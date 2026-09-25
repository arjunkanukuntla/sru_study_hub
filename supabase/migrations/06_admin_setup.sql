-- ============================================================
-- SRU Study Hub — Admin Setup SQL
-- Run this in Supabase SQL Editor after main schema is applied.
-- ============================================================

-- 1. Reports table
CREATE TABLE IF NOT EXISTS reports (
  id           uuid primary key default gen_random_uuid(),
  paper_id     text,
  resource_id  text,
  reason       text not null,
  message      text,
  anon_id      text,
  reported_at  timestamptz default now(),
  status       text default 'open'   -- open | reviewed | dismissed
);

-- 2. Add report_count to papers and resources (if not exists)
ALTER TABLE papers    ADD COLUMN IF NOT EXISTS report_count integer default 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS report_count integer default 0;

-- 3. Site settings table (maintenance mode, announcements, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  key   text primary key,
  value text
);

INSERT INTO site_settings (key, value) VALUES
  ('maintenance_mode',    'false'),
  ('maintenance_message', 'We are performing scheduled maintenance. Please check back shortly.'),
  ('announcement',        '')
ON CONFLICT (key) DO NOTHING;

-- 4. RLS policies for reports (anyone can insert, only service role reads all)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can report" ON reports;
CREATE POLICY "Anyone can report" ON reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read reports" ON reports;
CREATE POLICY "Anyone can read reports" ON reports
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can update reports" ON reports;
CREATE POLICY "Anyone can update reports" ON reports
  FOR UPDATE TO anon, authenticated USING (true);

-- 5. RLS policies for site_settings (public read)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON site_settings;
CREATE POLICY "Public read settings" ON site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can update settings" ON site_settings;
CREATE POLICY "Anyone can update settings" ON site_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Allow delete on papers and resources (for admin)
DROP POLICY IF EXISTS "Allow delete papers" ON papers;
CREATE POLICY "Allow delete papers" ON papers
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete resources" ON resources;
CREATE POLICY "Allow delete resources" ON resources
  FOR DELETE TO anon, authenticated USING (true);

-- 7. Allow update report_count on papers/resources
DROP POLICY IF EXISTS "Allow update paper report_count" ON papers;
CREATE POLICY "Allow update paper report_count" ON papers
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update resource report_count" ON resources;
CREATE POLICY "Allow update resource report_count" ON resources
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
