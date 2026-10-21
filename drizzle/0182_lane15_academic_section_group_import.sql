-- Original group-backed classes stay separate from ordinary academic sections.
-- Importer must reject duplicate numeric class identities across both tables.
ALTER TABLE sections ADD COLUMN IF NOT EXISTS legacy_class_id integer,
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean,
 ADD COLUMN IF NOT EXISTS legacy_starts_at timestamptz,
 ADD COLUMN IF NOT EXISTS legacy_ends_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS sections_legacy_class_id_uq ON sections(legacy_class_id)
 WHERE legacy_class_id IS NOT NULL;
ALTER TABLE sections ADD CONSTRAINT sections_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status<>'ACTIVE');
ALTER TABLE sections ADD CONSTRAINT sections_legacy_time_order_ck
 CHECK (legacy_starts_at IS NULL OR legacy_ends_at IS NULL OR legacy_ends_at >= legacy_starts_at);
ALTER TABLE group_backed_class_offerings ADD COLUMN IF NOT EXISTS legacy_class_id integer,
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
CREATE UNIQUE INDEX IF NOT EXISTS group_backed_offerings_legacy_class_id_uq
 ON group_backed_class_offerings(legacy_class_id) WHERE legacy_class_id IS NOT NULL;
ALTER TABLE group_backed_class_offerings ADD CONSTRAINT group_backed_offerings_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status='ARCHIVED');
