ALTER TABLE elective_slots ADD COLUMN IF NOT EXISTS legacy_slot_id integer, ADD COLUMN IF NOT EXISTS legacy_program_id integer, ADD COLUMN IF NOT EXISTS legacy_revision bigint, ADD COLUMN IF NOT EXISTS legacy_created_at_local varchar(36);
CREATE UNIQUE INDEX IF NOT EXISTS elective_slots_legacy_id_uq ON elective_slots(legacy_slot_id) WHERE legacy_slot_id IS NOT NULL;
ALTER TABLE elective_offerings ADD COLUMN IF NOT EXISTS legacy_offering_id integer, ADD COLUMN IF NOT EXISTS legacy_class_id integer, ADD COLUMN IF NOT EXISTS legacy_course_id integer, ADD COLUMN IF NOT EXISTS legacy_revision bigint;
CREATE UNIQUE INDEX IF NOT EXISTS elective_offerings_legacy_id_uq ON elective_offerings(legacy_offering_id) WHERE legacy_offering_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS elective_offerings_legacy_class_idx ON elective_offerings(legacy_class_id) WHERE legacy_class_id IS NOT NULL;
