-- Prevent duplicate quiz/assignment submissions per (student_id, lesson_content_id).
-- Remove duplicates first, keeping the row with the smallest id per (student_id, lesson_content_id).
DELETE a FROM student_assignment a
INNER JOIN student_assignment b
  ON a.student_id = b.student_id AND a.lesson_content_id = b.lesson_content_id AND a.id > b.id;

ALTER TABLE student_assignment
ADD UNIQUE KEY unique_student_lesson_content (student_id, lesson_content_id);
