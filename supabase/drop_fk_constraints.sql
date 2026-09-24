-- ============================================================
-- SRU Study Hub — Drop Broken Foreign Key Constraints
-- The papers and resources tables use TEXT IDs (not UUIDs),
-- so FK constraints that expect UUID references cause insert failures.
-- This removes those constraints so any text subject_id is accepted.
-- ============================================================

-- Drop FK on papers.subject_id (if exists)
alter table papers    drop constraint if exists papers_subject_id_fkey;
alter table papers    drop constraint if exists papers_file_id_fkey;

-- Drop FK on resources.subject_id (if exists)
alter table resources drop constraint if exists resources_subject_id_fkey;
alter table resources drop constraint if exists resources_file_id_fkey;

-- Verify — confirm constraints are gone
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
from information_schema.table_constraints tc
where tc.table_name in ('papers', 'resources')
  and tc.constraint_type = 'FOREIGN KEY'
order by tc.table_name;
-- Should return 0 rows (no FK constraints remaining on papers/resources)
