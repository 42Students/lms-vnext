-- MEN-projects-meetings-27: notes, retrospective, action items and follow-up
-- accompany the existing authoritative project meeting and remain tenant scoped.
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS facilitation jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_facilitation_object_ck;
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_facilitation_object_ck
 CHECK (jsonb_typeof(facilitation)='object');

-- MEN-projects-meetings-27: Drafts are not yet scheduled or announced;
-- Rescheduled is a persisted scheduled state with normal meeting permissions.
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_status_ck;
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_status_ck
 CHECK (status IN ('DRAFT','REQUESTED','SCHEDULED','RESCHEDULED','COMPLETED','CANCELLED'));
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_schedule_shape_ck;
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_schedule_shape_ck
 CHECK (status NOT IN ('SCHEDULED','RESCHEDULED','COMPLETED')
   OR (scheduled_by_user_id IS NOT NULL AND meeting_url IS NOT NULL));
