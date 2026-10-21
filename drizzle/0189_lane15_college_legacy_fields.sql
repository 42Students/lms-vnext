ALTER TABLE colleges ADD COLUMN IF NOT EXISTS legacy_college_id integer,
 ADD COLUMN IF NOT EXISTS legacy_organization_id integer,
 ADD COLUMN IF NOT EXISTS legacy_unique_id varchar(64),
 ADD COLUMN IF NOT EXISTS legacy_chair_id integer,
 ADD COLUMN IF NOT EXISTS legacy_vice_chair_id integer,
 ADD COLUMN IF NOT EXISTS legacy_logo_url varchar(255),
 ADD COLUMN IF NOT EXISTS legacy_domain_host varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS colleges_legacy_id_uq
 ON colleges(legacy_college_id) WHERE legacy_college_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS colleges_legacy_unique_id_uq
 ON colleges(lower(legacy_unique_id)) WHERE legacy_unique_id IS NOT NULL;
ALTER TABLE colleges ADD CONSTRAINT colleges_legacy_unique_id_ck
 CHECK (legacy_unique_id IS NULL OR length(trim(legacy_unique_id)) BETWEEN 1 AND 64);
