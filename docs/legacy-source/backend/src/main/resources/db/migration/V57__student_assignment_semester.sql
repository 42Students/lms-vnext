-- AQ-11: Add semester_number to student_assignment so attempt counters reset each semester.
-- NULL means legacy/unscoped (pre-migration data); new submissions will have the value set.
ALTER TABLE student_assignment
    ADD COLUMN semester_number TINYINT NULL;
