-- ============================================================
-- SRU Study Hub — Cleanup Old / Broken Uploads
-- Deletes all records where file_url is:
--   - a base64 DataURL (starts with 'data:')  → broken, too large, not shareable
--   - empty / NULL                             → orphaned records
-- Keeps all real Supabase CDN URLs (https://...)
-- ============================================================

-- Preview first — see what will be deleted
select
  'papers' as table_name,
  id,
  subject_name,
  left(file_url, 60) as file_url_preview,
  created_at
from papers
where
  file_url is null
  or file_url = ''
  or file_url like 'data:%'

union all

select
  'resources' as table_name,
  id,
  title as subject_name,
  left(file_url, 60) as file_url_preview,
  created_at
from resources
where
  file_url is null
  or file_url = ''
  or file_url like 'data:%'

order by created_at desc;

-- ── After reviewing the preview above, uncomment and run: ────

-- DELETE broken papers (DataURL or empty)
delete from papers
where
  file_url is null
  or file_url = ''
  or file_url like 'data:%';

-- DELETE broken resources (DataURL or empty)
delete from resources
where
  file_url is null
  or file_url = ''
  or file_url like 'data:%';

-- Verify what remains (should all be https:// CDN URLs)
select 'papers remaining' as info, count(*) from papers
union all
select 'resources remaining', count(*) from resources;
