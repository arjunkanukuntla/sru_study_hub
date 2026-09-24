-- ============================================================
-- SRU Study Hub — Fix ALL Table RLS Policies (Safe / Idempotent)
-- Run this if schema.sql failed mid-way with "policy already exists".
-- Uses DROP IF EXISTS before each CREATE — safe to run multiple times.
-- ============================================================

-- ── Public READ policies ──────────────────────────────────────

drop policy if exists "Public read subjects"     on subjects;
drop policy if exists "Public read units"        on units;
drop policy if exists "Public read topics"       on topics;
drop policy if exists "Public read branches"     on branches;
drop policy if exists "Public read departments"  on departments;
drop policy if exists "Public read years"        on academic_years;
drop policy if exists "Public read labs"         on labs;
drop policy if exists "Public read experiments"  on lab_experiments;
drop policy if exists "Public read viva"         on viva_questions;
drop policy if exists "Public read papers"       on papers;
drop policy if exists "Public read resources"    on resources;
drop policy if exists "Public read files"        on files;
drop policy if exists "Public read analytics"    on analytics_cache;

create policy "Public read subjects"     on subjects       for select using (true);
create policy "Public read units"        on units          for select using (true);
create policy "Public read topics"       on topics         for select using (true);
create policy "Public read branches"     on branches       for select using (true);
create policy "Public read departments"  on departments    for select using (true);
create policy "Public read years"        on academic_years for select using (true);
create policy "Public read labs"         on labs           for select using (true);
create policy "Public read experiments"  on lab_experiments for select using (true);
create policy "Public read viva"         on viva_questions for select using (true);
create policy "Public read papers"       on papers         for select using (true);
create policy "Public read resources"    on resources      for select using (true);
create policy "Public read files"        on files          for select using (true);
create policy "Public read analytics"    on analytics_cache for select using (true);

-- ── Anyone can INSERT ────────────────────────────────────────

drop policy if exists "Anyone insert subject"  on subjects;
drop policy if exists "Anyone insert unit"     on units;
drop policy if exists "Anyone insert topic"    on topics;
drop policy if exists "Anyone insert paper"    on papers;
drop policy if exists "Anyone insert resource" on resources;
drop policy if exists "Anyone insert file"     on files;
drop policy if exists "Anyone insert upload"   on uploads;
drop policy if exists "Anyone insert report"   on reports;

create policy "Anyone insert subject"  on subjects  for insert with check (true);
create policy "Anyone insert unit"     on units     for insert with check (true);
create policy "Anyone insert topic"    on topics    for insert with check (true);
create policy "Anyone insert paper"    on papers    for insert with check (true);
create policy "Anyone insert resource" on resources for insert with check (true);
create policy "Anyone insert file"     on files     for insert with check (true);
create policy "Anyone insert upload"   on uploads   for insert with check (true);
create policy "Anyone insert report"   on reports   for insert with check (true);

-- ── Anyone can UPDATE (needed for upsert) ────────────────────

drop policy if exists "Anyone upsert paper"    on papers;
drop policy if exists "Anyone upsert resource" on resources;

create policy "Anyone upsert paper"    on papers    for update with check (true);
create policy "Anyone upsert resource" on resources for update with check (true);

-- ── Favorites / Progress (anon-based) ───────────────────────

drop policy if exists "Own favorites" on favorites;
drop policy if exists "Own progress"  on study_progress;

create policy "Own favorites" on favorites     for all using (true);
create policy "Own progress"  on study_progress for all using (true);

-- ── Verify — check which policies now exist ──────────────────
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('papers', 'resources', 'subjects', 'files')
order by tablename, cmd;
