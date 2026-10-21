-- Part B / W2 in the super-admin audit: "Attendance: ... see who marked absent; record
-- excused/medical/late".
--
-- W2 spells out the dead end: "A student disputes an attendance record -> read-only grid -> can't
-- see who marked it -> can't correct it -> can't mark it excused." Correction is now possible
-- (AdminAttendanceController), but the attend row still recorded only THAT a student was absent --
-- never who marked them, and with no way to distinguish an unexplained absence from an excused or
-- medical one, which is the distinction that actually matters for exam eligibility.
--
-- marked_by: the faculty/admin user id that created or last changed the row. NULL for every
-- pre-existing row and for anything marked by a path that doesn't stamp it, so "unknown" stays
-- distinguishable from "nobody".
--
-- attendance_status: NULL means a plain unexplained absence, which is exactly what every existing
-- row is -- so no backfill is needed and existing percentage calculations are unaffected.

ALTER TABLE attend
    ADD COLUMN marked_by INT NULL;

ALTER TABLE attend
    ADD COLUMN attendance_status VARCHAR(20) NULL;
