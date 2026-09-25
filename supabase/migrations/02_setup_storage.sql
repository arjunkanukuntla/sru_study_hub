-- ============================================================
-- SRU Study Hub — Storage Buckets Setup
-- Run this SEPARATELY in Supabase SQL Editor if schema.sql
-- has already been applied (gives "policy already exists" errors).
-- ============================================================

-- ── 1. Create Storage Buckets (safe upsert) ──────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'papers', 'papers', true, 52428800,
    array[
      'application/pdf',
      'image/jpeg','image/png','image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'resources', 'resources', true, 52428800,
    array[
      'application/pdf',
      'image/jpeg','image/png','image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'labs', 'labs', true, 52428800,
    array['application/pdf','image/jpeg','image/png','image/webp']
  )
on conflict (id) do update
  set public           = true,
      file_size_limit  = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── 2. Storage RLS — Drop if exists then recreate (idempotent) ──

-- Public read
drop policy if exists "Public read papers storage"    on storage.objects;
drop policy if exists "Public read resources storage" on storage.objects;
drop policy if exists "Public read labs storage"      on storage.objects;

create policy "Public read papers storage"
  on storage.objects for select
  using (bucket_id = 'papers');

create policy "Public read resources storage"
  on storage.objects for select
  using (bucket_id = 'resources');

create policy "Public read labs storage"
  on storage.objects for select
  using (bucket_id = 'labs');

-- Anonymous upload
drop policy if exists "Anyone upload papers"    on storage.objects;
drop policy if exists "Anyone upload resources" on storage.objects;
drop policy if exists "Anyone upload labs"      on storage.objects;

create policy "Anyone upload papers"
  on storage.objects for insert
  with check (bucket_id = 'papers');

create policy "Anyone upload resources"
  on storage.objects for insert
  with check (bucket_id = 'resources');

create policy "Anyone upload labs"
  on storage.objects for insert
  with check (bucket_id = 'labs');

-- Anonymous update (needed for upsert)
drop policy if exists "Anyone update papers"    on storage.objects;
drop policy if exists "Anyone update resources" on storage.objects;

create policy "Anyone update papers"
  on storage.objects for update
  using (bucket_id = 'papers');

create policy "Anyone update resources"
  on storage.objects for update
  using (bucket_id = 'resources');

-- ── 3. Also add upsert policy on papers & resources tables ───
-- (Needed so syncPaperToCloud / syncResourceToCloud can upsert rows)

drop policy if exists "Anyone upsert paper"    on papers;
drop policy if exists "Anyone upsert resource" on resources;

create policy "Anyone upsert paper"
  on papers for update
  with check (true);

create policy "Anyone upsert resource"
  on resources for update
  with check (true);

-- Done! Storage buckets are now public and accept anonymous uploads.
