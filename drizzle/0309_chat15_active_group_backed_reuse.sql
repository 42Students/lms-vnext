-- Historical GROUP_BACKED elective classrooms keep their own roster.
-- A closed class may be replaced in the same academic period and group.
DROP INDEX IF EXISTS group_backed_offerings_period_group_uq;
CREATE UNIQUE INDEX group_backed_offerings_period_group_uq
 ON group_backed_class_offerings(academic_period_id,roster_group_id)
 WHERE status='ACTIVE';
