CREATE UNIQUE INDEX IF NOT EXISTS assignment_submissions_grade_audit_parent_uq
 ON assignment_submissions(id,assignment_id,delivery_id,membership_id);
CREATE TABLE IF NOT EXISTS assignment_grade_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 legacy_grade_audit_id bigint,legacy_action varchar(40),
 legacy_occurred_at_local varchar(40),actor_name_snapshot varchar(150),
 assignment_submission_id uuid NOT NULL,
 assignment_id uuid NOT NULL,delivery_id uuid NOT NULL,
 learner_membership_id uuid NOT NULL,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 actor_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
 actor_role varchar(24) NOT NULL,action varchar(40) NOT NULL,
 previous_points integer,new_points integer,
 previous_feedback text,new_feedback text,
 previous_grading_status varchar(24) NOT NULL,
 new_grading_status varchar(24) NOT NULL,
 previous_grade_published boolean NOT NULL,new_grade_published boolean NOT NULL,
 previous_graded_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 new_graded_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 previous_graded_at timestamptz,new_graded_at timestamptz,
 submission_version_before integer NOT NULL,
 submission_version_after integer NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT assignment_grade_events_submission_identity_fk FOREIGN KEY
 (assignment_submission_id,assignment_id,delivery_id,learner_membership_id)
 REFERENCES assignment_submissions(id,assignment_id,delivery_id,membership_id)
 ON DELETE RESTRICT,
 CONSTRAINT assignment_grade_events_action_ck CHECK
 (action IN ('GRADE','REGRADE','HIDE_GRADE','PUBLISH_GRADE')),
 CONSTRAINT assignment_grade_events_actor_role_ck CHECK
 (actor_role IN ('FACULTY','COLLEGE_ADMIN','SUPER_ADMIN')),
 CONSTRAINT assignment_grade_events_actor_shape_ck CHECK
 ((actor_role='SUPER_ADMIN' AND actor_membership_id IS NULL) OR
 (actor_role IN ('FACULTY','COLLEGE_ADMIN') AND actor_membership_id IS NOT NULL)),
 CONSTRAINT assignment_grade_events_status_ck CHECK
 (previous_grading_status IN ('NOT_GRADED','GRADED') AND
 new_grading_status IN ('NOT_GRADED','GRADED')),
 CONSTRAINT assignment_grade_events_points_ck CHECK
 ((previous_points IS NULL OR previous_points>=0) AND
  (new_points IS NULL OR new_points>=0)),
 CONSTRAINT assignment_grade_events_version_ck CHECK
 (submission_version_before>=0 AND
  submission_version_after=submission_version_before+1),
 CONSTRAINT assignment_grade_events_shape_ck CHECK(
 (action='GRADE' AND previous_grading_status='NOT_GRADED' AND
  new_grading_status='GRADED' AND new_points IS NOT NULL AND
  new_grade_published=false)
 OR (action='REGRADE' AND previous_grading_status='GRADED' AND
  new_grading_status='GRADED' AND new_points IS NOT NULL AND
  new_grade_published=false)
 OR (action='PUBLISH_GRADE' AND previous_grading_status='GRADED' AND
  new_grading_status='GRADED' AND previous_grade_published=false AND
  new_grade_published=true AND previous_points IS NOT DISTINCT FROM new_points
  AND previous_feedback IS NOT DISTINCT FROM new_feedback)
 OR (action='HIDE_GRADE' AND previous_grading_status='GRADED' AND
  new_grading_status='GRADED' AND previous_grade_published=true AND
  new_grade_published=false AND previous_points IS NOT DISTINCT FROM new_points
  AND previous_feedback IS NOT DISTINCT FROM new_feedback))
);
CREATE UNIQUE INDEX IF NOT EXISTS assignment_grade_events_legacy_audit_uq
 ON assignment_grade_events(legacy_grade_audit_id)
 WHERE legacy_grade_audit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS assignment_grade_events_submission_version_uq
 ON assignment_grade_events(assignment_submission_id,submission_version_after);
CREATE INDEX IF NOT EXISTS assignment_grade_events_submission_cursor_idx
 ON assignment_grade_events(assignment_submission_id,occurred_at,id);
CREATE INDEX IF NOT EXISTS assignment_grade_events_submission_time_idx
 ON assignment_grade_events(assignment_submission_id,occurred_at);
CREATE INDEX IF NOT EXISTS assignment_grade_events_college_time_idx
 ON assignment_grade_events(college_id,occurred_at);
CREATE INDEX IF NOT EXISTS assignment_grade_events_actor_time_idx
 ON assignment_grade_events(actor_user_id,occurred_at);
