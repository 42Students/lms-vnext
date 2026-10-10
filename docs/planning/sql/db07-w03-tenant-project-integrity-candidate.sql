-- W03 DB07 DRAFT ONLY — NOT registered in the Drizzle journal.
-- Chat 1 / migration integrator owns promotion after shared-schema claims clear.
--
-- Goal: privileged/direct SQL must not cross tenant boundaries merely because
-- the referenced UUID exists. Current services check these relationships, but
-- the live single-column FKs do not prove same-college scope.

-- project_instances already stores college_id, and lms_groups stores college_id.
-- Make the team-group relation prove that both belong to the same college.
CREATE UNIQUE INDEX IF NOT EXISTS
  lms_groups_college_id_id_uq
  ON lms_groups(college_id, id);

ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_team_group_same_college_fk
  FOREIGN KEY (college_id, team_group_id)
  REFERENCES lms_groups(college_id, id)
  ON DELETE RESTRICT;

-- A same-college group can still be the wrong group kind. Project linkage is
-- valid only for a non-deleted college-owned PROJECT_TEAM group.
CREATE OR REPLACE FUNCTION w03_assert_project_team_group_shape()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.team_group_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
         FROM lms_groups g
        WHERE g.id = NEW.team_group_id
          AND g.college_id = NEW.college_id
          AND g.owner_scope = 'COLLEGE'
          AND g.kind = 'PROJECT_TEAM'
          AND g.deleted_at IS NULL
     ) THEN
    RAISE EXCEPTION
      'group % is not an attachable project-team scope for project %',
      NEW.team_group_id, NEW.id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_instances_team_group_shape
BEFORE INSERT OR UPDATE OF college_id, team_group_id
ON project_instances
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_team_group_shape();

-- groups/service.ts mirrors ACTIVE PROJECT_TEAM members to active LEARNER
-- project_members in the same transaction. A DEFERRABLE constraint trigger can
-- therefore enforce the final-state equality without depending on whether the
-- group row or project-member row is written first.
CREATE OR REPLACE FUNCTION w03_assert_project_team_member_pair(
  checked_project_id uuid,
  checked_group_id uuid,
  checked_membership_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  group_active boolean;
  project_active boolean;
BEGIN
  IF checked_project_id IS NULL
     OR checked_group_id IS NULL
     OR checked_membership_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM lms_group_members gm
     WHERE gm.group_id = checked_group_id
       AND gm.membership_id = checked_membership_id
       AND gm.state = 'ACTIVE'
  ) INTO group_active;

  SELECT EXISTS (
    SELECT 1
      FROM project_members pm
     WHERE pm.project_id = checked_project_id
       AND pm.membership_id = checked_membership_id
       AND pm.role = 'LEARNER'
       AND pm.ended_at IS NULL
  ) INTO project_active;

  IF group_active IS DISTINCT FROM project_active THEN
    RAISE EXCEPTION
      'PROJECT_TEAM roster mirror mismatch project %, group %, membership %',
      checked_project_id, checked_group_id, checked_membership_id
      USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION w03_check_project_member_team_mirror()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  project_id_value uuid;
  group_id_value uuid;
  membership_id_value uuid;
BEGIN
  IF TG_OP = 'UPDATE'
     AND (
       NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     ) THEN
    RAISE EXCEPTION
      'project member project/membership identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'DELETE' THEN
    project_id_value := OLD.project_id;
    membership_id_value := OLD.membership_id;
  ELSE
    project_id_value := NEW.project_id;
    membership_id_value := NEW.membership_id;
  END IF;

  SELECT team_group_id
    INTO group_id_value
    FROM project_instances
   WHERE id = project_id_value;

  IF group_id_value IS NOT NULL THEN
    PERFORM w03_assert_project_team_member_pair(
      project_id_value, group_id_value, membership_id_value
    );
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER project_members_team_roster_mirror
AFTER INSERT OR UPDATE OR DELETE
ON project_members
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION w03_check_project_member_team_mirror();

CREATE OR REPLACE FUNCTION w03_check_group_member_project_mirror()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  group_id_value uuid;
  membership_id_value uuid;
  project_id_value uuid;
BEGIN
  IF TG_OP = 'UPDATE'
     AND (
       NEW.group_id IS DISTINCT FROM OLD.group_id
       OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     ) THEN
    RAISE EXCEPTION
      'group member group/membership identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'DELETE' THEN
    group_id_value := OLD.group_id;
    membership_id_value := OLD.membership_id;
  ELSE
    group_id_value := NEW.group_id;
    membership_id_value := NEW.membership_id;
  END IF;

  SELECT p.id
    INTO project_id_value
    FROM project_instances p
   WHERE p.team_group_id = group_id_value;

  IF project_id_value IS NOT NULL THEN
    PERFORM w03_assert_project_team_member_pair(
      project_id_value, group_id_value, membership_id_value
    );
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER lms_group_members_project_team_roster_mirror
AFTER INSERT OR UPDATE OR DELETE
ON lms_group_members
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION w03_check_group_member_project_mirror();

-- Generic same-college membership guard. The trigger takes one or more
-- membership-column names and validates every non-null membership against the
-- college of NEW.project_id. This avoids copying college_id onto every child.
CREATE OR REPLACE FUNCTION w03_assert_project_membership_same_college()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  project_college_id uuid;
  membership_column text;
  membership_value uuid;
BEGIN
  SELECT college_id
    INTO project_college_id
    FROM project_instances
   WHERE id = NEW.project_id;

  IF project_college_id IS NULL THEN
    RAISE EXCEPTION 'project % is missing or has no college', NEW.project_id
      USING ERRCODE = '23503';
  END IF;

  FOREACH membership_column IN ARRAY TG_ARGV LOOP
    membership_value :=
      NULLIF(to_jsonb(NEW) ->> membership_column, '')::uuid;

    IF membership_value IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
           FROM college_memberships cm
          WHERE cm.id = membership_value
            AND cm.college_id = project_college_id
       ) THEN
      RAISE EXCEPTION
        'membership % is outside project % college scope',
        membership_value, NEW.project_id
        USING ERRCODE = '23503';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER project_members_same_college_membership
BEFORE INSERT OR UPDATE OF project_id, membership_id
ON project_members
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_membership_same_college('membership_id');

CREATE TRIGGER project_task_submissions_same_college_memberships
BEFORE INSERT OR UPDATE OF
  project_id, submitted_by_membership_id, reviewed_by_membership_id
ON project_task_submissions
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_membership_same_college(
  'submitted_by_membership_id',
  'reviewed_by_membership_id'
);

CREATE TRIGGER project_submissions_same_college_memberships
BEFORE INSERT OR UPDATE OF
  project_id, created_by_membership_id, submitted_by_membership_id
ON project_submissions
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_membership_same_college(
  'created_by_membership_id',
  'submitted_by_membership_id'
);

CREATE TRIGGER project_evaluations_same_college_membership
BEFORE INSERT OR UPDATE OF project_id, evaluator_membership_id
ON project_evaluations
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_membership_same_college(
  'evaluator_membership_id'
);

CREATE TRIGGER project_meetings_same_college_memberships
BEFORE INSERT OR UPDATE OF
  project_id, requested_by_membership_id, scheduled_by_membership_id
ON project_meetings
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_membership_same_college(
  'requested_by_membership_id',
  'scheduled_by_membership_id'
);

-- History/event actor scope. A college-scoped actor must either have a
-- membership in the affected project's college or hold canonical SUPER_ADMIN
-- system role. Do not trust a client-provided actor_type as the bypass.
CREATE OR REPLACE FUNCTION w03_assert_project_actor_same_college()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  project_college_id uuid;
  actor_column text := TG_ARGV[0];
  actor_user_id uuid;
BEGIN
  actor_user_id :=
    NULLIF(to_jsonb(NEW) ->> actor_column, '')::uuid;

  IF actor_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT college_id
    INTO project_college_id
    FROM project_instances
   WHERE id = NEW.project_id;

  IF project_college_id IS NULL THEN
    RAISE EXCEPTION 'project % is missing or has no college', NEW.project_id
      USING ERRCODE = '23503';
  END IF;

  IF NOT EXISTS (
       SELECT 1
         FROM college_memberships cm
        WHERE cm.user_id = actor_user_id
          AND cm.college_id = project_college_id
     )
     AND NOT EXISTS (
       SELECT 1
         FROM system_roles sr
        WHERE sr.user_id = actor_user_id
          AND CAST(sr.role AS text) = 'SUPER_ADMIN'
     ) THEN
    RAISE EXCEPTION
      'actor % is outside project % college scope',
      actor_user_id, NEW.project_id
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

-- These tables are themselves staged in the DB07 history candidate. Register
-- actor triggers only after those tables are promoted.
CREATE TRIGGER project_meeting_history_actor_same_college
BEFORE INSERT OR UPDATE OF project_id, actor_user_id
ON project_meeting_history
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_actor_same_college('actor_user_id');

CREATE TRIGGER project_resource_audit_actor_same_college
BEFORE INSERT OR UPDATE OF project_id, actor_user_id
ON project_resource_audit
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_actor_same_college('actor_user_id');

CREATE TRIGGER project_delivery_events_actor_same_college
BEFORE INSERT OR UPDATE OF project_id, actor_user_id
ON project_delivery_events
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_actor_same_college('actor_user_id');

CREATE TRIGGER project_task_comments_actor_same_college
BEFORE INSERT OR UPDATE OF project_id, commenter_user_id
ON project_task_comments
FOR EACH ROW
EXECUTE FUNCTION w03_assert_project_actor_same_college('commenter_user_id');

-- Promotion/negative-test requirements:
-- 1. project A + team group from college B fails 23503.
-- 2. project member from college B fails 23503.
-- 3. task/final submission/review/evaluation/meeting membership from another
--    college fails 23503 even when the UUID exists.
-- 4. college-scoped history actor from another college fails 23503.
-- 5. canonical SUPER_ADMIN actor remains allowed without a college membership.
-- 6. normal same-college writes still pass after zero-to-head replay.
--
-- Source confirmation for project-team atomicity:
-- groups/service.ts mirrorProjectTeamMember writes ACTIVE/REMOVED group state
-- and the corresponding LEARNER project_members row in the SAME transaction;
-- attachProjectTeamGroup requires a same-college PROJECT_TEAM group and both
-- rosters empty. project member-service independently rejects direct LEARNER
-- add/end while team_group_id is present (PROJECT_TEAM_GROUP_MANAGED).
-- The deferred triggers above therefore validate final transactional equality
-- without dictating write order.
