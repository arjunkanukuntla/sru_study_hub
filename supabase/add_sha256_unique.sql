-- ============================================================
-- SRU Study Hub — Add SHA-256 Unique Constraints for Deduplication
-- Prevents duplicate files at the DB level even if two users
-- upload the same file at the same time (race condition guard).
-- NULL sha256 values are allowed (PostgreSQL treats each NULL as distinct).
-- ============================================================

-- Add unique constraint on sha256 for papers
alter table papers
  add constraint papers_sha256_unique unique (sha256);

-- Add unique constraint on sha256 for resources
alter table resources
  add constraint resources_sha256_unique unique (sha256);

-- Verify
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
from information_schema.table_constraints tc
where tc.table_name in ('papers', 'resources')
  and tc.constraint_type = 'UNIQUE'
order by tc.table_name;
