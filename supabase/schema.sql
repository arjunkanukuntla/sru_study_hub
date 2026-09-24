-- ============================================================
-- SRU Study Hub — Supabase Database Schema
-- Run this in your Supabase project → SQL Editor → New Query
-- ============================================================

-- ── Profiles (extends auth.users) ──
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  email         text,
  role          text not null default 'student' check (role in ('student', 'admin')),
  branch        text,
  study_year    text,
  semester      text,
  anon_id       text,  -- optional anonymous ID link
  created_at    timestamptz default now()
);

-- ── Academic Structure ──
create table if not exists departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  created_at  timestamptz default now()
);

create table if not exists branches (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id),
  name          text not null,
  code          text not null unique,
  created_at    timestamptz default now()
);

create table if not exists academic_years (
  id          uuid primary key default gen_random_uuid(),
  label       text not null unique,   -- e.g. '2025-26'
  is_current  boolean default false,
  created_at  timestamptz default now()
);

create table if not exists subjects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  code          text not null unique,
  branch_id     uuid references branches(id),
  semester_num  int  not null,
  credits       int  not null default 4,
  subject_type  text not null default 'theory' check (subject_type in ('theory', 'lab', 'both')),
  units_count   int  not null default 5,
  is_demo       boolean default false,
  created_at    timestamptz default now()
);
create index if not exists idx_subjects_branch on subjects(branch_id);

create table if not exists units (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  unit_number int  not null,
  title       text not null,
  description text,
  created_at  timestamptz default now(),
  unique (subject_id, unit_number)
);

create table if not exists topics (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  unit_id     uuid references units(id),
  name        text not null,
  created_at  timestamptz default now()
);
create index if not exists idx_topics_subject on topics(subject_id);

-- ── File Storage ──
-- Separates file binary info from resource metadata
-- Allows multiple uploads to reference the same physical file (deduplication)
create table if not exists files (
  id                uuid primary key default gen_random_uuid(),
  original_filename text not null,
  stored_filename   text not null,
  mime_type         text not null,
  original_size     bigint,
  optimized_size    bigint,
  sha256            text not null unique,     -- SHA-256 for exact dedup
  page_count        int,
  storage_bucket    text not null,
  storage_path      text not null,
  quality_score     int default 50,          -- 0-100 quality score
  created_at        timestamptz default now()
);
create index if not exists idx_files_sha256 on files(sha256);

-- ── Papers ──
create table if not exists papers (
  id                  uuid primary key default gen_random_uuid(),
  subject_id          uuid not null references subjects(id),
  file_id             uuid references files(id),
  exam_type           text not null check (exam_type in ('mid1','mid2','endterm','lab_mid','lab_end','supplementary')),
  exam_label          text,
  academic_year_id    uuid references academic_years(id),
  exam_date           date,
  title               text,
  verification_status text not null default 'verified' check (verification_status in ('pending','verified','rejected')),
  verified_by         uuid references profiles(id),
  verified_at         timestamptz default now(),
  is_demo             boolean default false,
  contributor_count   int default 1,
  created_at          timestamptz default now()
);
create index if not exists idx_papers_subject on papers(subject_id);
create index if not exists idx_papers_status  on papers(verification_status);

-- ── Resources ──
create table if not exists resources (
  id                  uuid primary key default gen_random_uuid(),
  subject_id          uuid not null references subjects(id),
  file_id             uuid references files(id),
  resource_type       text not null check (resource_type in ('syllabus','notes','question_bank','reference','lab_manual','other')),
  title               text not null,
  description         text,
  academic_year_id    uuid references academic_years(id),
  verification_status text not null default 'verified' check (verification_status in ('pending','verified','rejected')),
  is_demo             boolean default false,
  created_at          timestamptz default now()
);
create index if not exists idx_resources_subject on resources(subject_id);

-- ── Uploads (contributor tracking) ──
-- Tracks who uploaded what — decoupled from papers/resources
-- Multiple uploads of the same file are linked to the same file_id
create table if not exists uploads (
  id          uuid primary key default gen_random_uuid(),
  paper_id    uuid references papers(id),
  resource_id uuid references resources(id),
  file_id     uuid not null references files(id),
  anon_id     text not null,             -- anonymous user ID
  ip_hash     text,                       -- hashed IP for rate limiting (not displayed)
  uploaded_at timestamptz default now()
);
create index if not exists idx_uploads_anon on uploads(anon_id);

-- ── Labs ──
create table if not exists labs (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id),
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists lab_experiments (
  id          uuid primary key default gen_random_uuid(),
  lab_id      uuid not null references labs(id) on delete cascade,
  exp_number  int  not null,
  title       text not null,
  description text,
  created_at  timestamptz default now()
);

create table if not exists viva_questions (
  id            uuid primary key default gen_random_uuid(),
  lab_id        uuid not null references labs(id) on delete cascade,
  experiment_id uuid references lab_experiments(id),
  question      text not null,
  answer        text,
  created_at    timestamptz default now()
);

-- ── Questions (from papers) ──
create table if not exists questions (
  id          uuid primary key default gen_random_uuid(),
  paper_id    uuid not null references papers(id) on delete cascade,
  unit_id     uuid references units(id),
  topic_id    uuid references topics(id),
  text        text not null,
  marks       int,
  created_at  timestamptz default now()
);
create index if not exists idx_questions_paper on questions(paper_id);
create index if not exists idx_questions_topic on questions(topic_id);

-- ── Analytics Cache ──
create table if not exists analytics_cache (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  data        jsonb not null,
  computed_at timestamptz default now(),
  unique (subject_id)
);

-- ── Favorites ──
create table if not exists favorites (
  id          uuid primary key default gen_random_uuid(),
  anon_id     text not null,
  item_type   text not null check (item_type in ('paper','subject','resource')),
  item_id     uuid not null,
  added_at    timestamptz default now(),
  unique (anon_id, item_type, item_id)
);
create index if not exists idx_favorites_anon on favorites(anon_id);

-- ── Study Progress ──
create table if not exists study_progress (
  id          uuid primary key default gen_random_uuid(),
  anon_id     text not null,
  topic_id    uuid not null references topics(id) on delete cascade,
  status      text not null default 'not_started' check (status in ('not_started','studying','completed')),
  updated_at  timestamptz default now(),
  unique (anon_id, topic_id)
);

-- ── Reports ──
create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  anon_id     text not null,
  item_type   text not null check (item_type in ('paper','resource','question')),
  item_id     uuid not null,
  reason      text,
  resolved    boolean default false,
  created_at  timestamptz default now()
);

-- ── Row Level Security ──
alter table profiles         enable row level security;
alter table subjects         enable row level security;
alter table units            enable row level security;
alter table topics           enable row level security;
alter table papers           enable row level security;
alter table resources        enable row level security;
alter table uploads          enable row level security;
alter table files            enable row level security;
alter table favorites        enable row level security;
alter table study_progress   enable row level security;
alter table reports          enable row level security;
alter table analytics_cache  enable row level security;

-- Public read on academic structure & resources
create policy "Public read subjects"     on subjects       for select using (true);
create policy "Public read units"        on units          for select using (true);
create policy "Public read topics"       on topics         for select using (true);
create policy "Public read branches"     on branches       for select using (true);
create policy "Public read departments"  on departments   for select using (true);
create policy "Public read years"        on academic_years for select using (true);
create policy "Public read labs"         on labs           for select using (true);
create policy "Public read experiments"  on lab_experiments for select using (true);
create policy "Public read viva"         on viva_questions for select using (true);
create policy "Public read papers"       on papers         for select using (true);
create policy "Public read resources"    on resources      for select using (true);
create policy "Public read files"        on files          for select using (true);
create policy "Public read analytics"    on analytics_cache for select using (true);

-- Anyone can insert subjects, units, topics, papers, resources, files, uploads
create policy "Anyone insert subject"  on subjects  for insert with check (true);
create policy "Anyone insert unit"     on units     for insert with check (true);
create policy "Anyone insert topic"    on topics    for insert with check (true);
create policy "Anyone insert paper"    on papers    for insert with check (true);
create policy "Anyone insert resource" on resources for insert with check (true);
create policy "Anyone insert file"     on files     for insert with check (true);
create policy "Anyone insert upload"   on uploads   for insert with check (true);
create policy "Anyone insert report"   on reports   for insert with check (true);

-- Favorites/progress: anon_id based access
create policy "Own favorites" on favorites for all using (true);
create policy "Own progress"  on study_progress for all using (true);

-- Admin full access (role = 'admin')
create policy "Admin all papers"     on papers     for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admin all resources"  on resources  for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admin all uploads"    on uploads    for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admin analytics"      on analytics_cache for all using (auth.uid() in (select id from profiles where role = 'admin'));

-- ── Storage Buckets (create in Supabase dashboard) ──
-- Bucket: papers     (public: true)
-- Bucket: resources  (public: true)
-- Bucket: labs       (public: true)

-- ── Initial Data ──
-- Academic years
insert into academic_years (label, is_current) values
  ('2026-27', true),
  ('2025-26', false),
  ('2024-25', false),
  ('2023-24', false)
on conflict (label) do nothing;

-- Departments
insert into departments (name, code) values
  ('School of Engineering', 'ENG')
on conflict (code) do nothing;
