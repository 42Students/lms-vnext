-- FAC-courses-19: educator-assigned points for video, YouTube, resource, and live content.
-- Legacy existing content receives a neutral default rather than missing points.
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 1;
ALTER TABLE lesson_contents DROP CONSTRAINT IF EXISTS lesson_contents_points_ck;
ALTER TABLE lesson_contents ADD CONSTRAINT lesson_contents_points_ck CHECK (points BETWEEN 0 AND 1000);
