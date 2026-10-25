-- Accept a persisted, labelled physical venue as an alternative to a web join link.
-- Keep the organizer requirement and all existing announced-state invariants.
-- Never rewrite 0015/0135: those migrations may already be applied.
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_schedule_shape_ck;
--> statement-breakpoint
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_schedule_shape_ck
 CHECK (status NOT IN ('SCHEDULED','RESCHEDULED','COMPLETED')
   OR (scheduled_by_user_id IS NOT NULL
     AND (meeting_url IS NOT NULL
       OR coalesce(agenda ~* '^(Location|Venue):[[:blank:]]*[^[:space:]]', false))));
