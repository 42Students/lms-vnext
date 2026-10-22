-- Legacy batch names were case-insensitively unique within a program.
-- Archived cohorts intentionally do not reserve reused names.
CREATE UNIQUE INDEX IF NOT EXISTS cohorts_program_active_name_uq
  ON cohorts(program_id,lower(name)) WHERE status <> 'ARCHIVED';
