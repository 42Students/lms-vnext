-- [chat-14] Semester-course default (retain explicit nullable noncredit rows).
ALTER TABLE course_offerings ALTER COLUMN credits SET DEFAULT 3;
