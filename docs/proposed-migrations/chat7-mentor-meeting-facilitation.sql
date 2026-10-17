-- MEN-projects-meetings-27: notes, retrospective, action items and follow-up
-- accompany the existing authoritative project meeting and remain tenant scoped.
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS facilitation jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_facilitation_object_ck;
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_facilitation_object_ck
 CHECK (jsonb_typeof(facilitation)='object');
