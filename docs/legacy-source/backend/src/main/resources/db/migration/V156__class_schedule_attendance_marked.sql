-- The attendance model only ever stores absences (see the `attend` table's own doc comment).
-- With zero rows for a freshly-scheduled class, totalPresent = totalCount - absentCount reports
-- every learner as "Present" the instant a class is scheduled, before any faculty ever opens the
-- Mark Attendance screen -- indistinguishable from "attendance was taken and everyone showed up".
-- This column gives that missing third state an explicit signal: null until a faculty actually
-- submits a bulk attendance mark for the session, regardless of whether anyone was absent.
ALTER TABLE class_schedule
    ADD COLUMN attendance_marked_at TIMESTAMP NULL;
