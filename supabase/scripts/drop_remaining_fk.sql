-- Drop ALL remaining FK constraints on papers and resources
-- (academic_year_id and verified_by FKs — we don't write those fields so they'd be NULL,
--  but dropping them prevents any future FK issues)

alter table papers    drop constraint if exists papers_academic_year_id_fkey;
alter table papers    drop constraint if exists papers_verified_by_fkey;
alter table resources drop constraint if exists resources_academic_year_id_fkey;
alter table resources drop constraint if exists resources_verified_by_fkey;

-- Verify — should return 0 rows
select tc.table_name, tc.constraint_name, tc.constraint_type
from information_schema.table_constraints tc
where tc.table_name in ('papers', 'resources')
  and tc.constraint_type = 'FOREIGN KEY'
order by tc.table_name;
