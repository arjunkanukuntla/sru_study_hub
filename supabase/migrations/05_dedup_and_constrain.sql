-- ============================================================
-- SRU Study Hub — Remove Duplicate Papers & Resources
-- Then add SHA-256 unique constraint to prevent future duplicates.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Step 1: Delete duplicate papers — keep the OLDEST copy of each file
DELETE FROM papers
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY sha256
             ORDER BY created_at ASC   -- keep oldest
           ) AS rn
    FROM papers
    WHERE sha256 IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Step 2: Delete duplicate resources — keep the OLDEST copy
DELETE FROM resources
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY sha256
             ORDER BY created_at ASC
           ) AS rn
    FROM resources
    WHERE sha256 IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Step 3: Add unique constraint so this never happens again
ALTER TABLE papers    DROP CONSTRAINT IF EXISTS papers_sha256_unique;
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_sha256_unique;

ALTER TABLE papers    ADD CONSTRAINT papers_sha256_unique    UNIQUE (sha256);
ALTER TABLE resources ADD CONSTRAINT resources_sha256_unique UNIQUE (sha256);

-- Step 4: Verify — should show remaining papers with no duplicates
SELECT sha256, COUNT(*) as cnt, MIN(subject_name) as subject
FROM papers
WHERE sha256 IS NOT NULL
GROUP BY sha256
HAVING COUNT(*) > 1;
-- Should return 0 rows (no duplicates remaining)
