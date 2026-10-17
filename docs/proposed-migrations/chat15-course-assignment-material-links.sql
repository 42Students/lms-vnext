-- LEARNER-course-detail-03 and LEARNER-learning-misc-02:
-- Faculty-authored links for each published assignment, separate from
-- learners' own submission files and from lesson-level RESOURCE materials.
-- Orchestrator: register a numbered migration, then PostgreSQL replay.
CREATE TABLE IF NOT EXISTS course_assignment_materials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 assignment_id uuid NOT NULL REFERENCES course_assignments(id) ON DELETE RESTRICT,
 kind varchar(12) NOT NULL DEFAULT 'LINK',
 title text NOT NULL,
 external_url text NOT NULL,
 sequence integer NOT NULL,
 created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT course_assignment_materials_link_ck CHECK
   (kind='LINK' AND length(trim(title)) BETWEEN 1 AND 160
    AND length(external_url) BETWEEN 10 AND 2048),
 CONSTRAINT course_assignment_materials_sequence_ck CHECK (sequence BETWEEN 0 AND 19),
 CONSTRAINT course_assignment_materials_sequence_uq UNIQUE(assignment_id,sequence)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS course_assignment_materials_parent_idx
 ON course_assignment_materials(assignment_id);
