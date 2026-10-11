-- DB-012 Chat 3 / 2026-10-11. CANDIDATE SQL ONLY; NOT REGISTERED OR EXECUTED.
-- Chat 1 remains sole migration/journal/CI writer. Coordinate with DB-014
-- FK audit, and deduplicate parent unique keys from db09-crm-scoped-fk-candidate.sql.
-- Do NOT promote DB09 runtime parity merely because this SQL exists.

-- Main omission in staged DB09 tables: unrelated UUID FKs do not assert
-- the source job, department, learner, or applicant belongs to the child
-- college/job. Parent composite UNIQUE keys are centralized in:
--   docs/planning/sql/db09-parent-composite-keys-candidate.sql
-- Child FKs below use the canonical ID-first parent order.

ALTER TABLE placement_tpo_message_threads
  ADD CONSTRAINT db09_thread_job_scope_fk
  FOREIGN KEY(job_id, college_id) REFERENCES placement_jobs(id, college_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;
-- This permits NULL job_id General threads, as intended by V165.

ALTER TABLE placement_tpo_share_links
  ADD CONSTRAINT db09_share_job_scope_fk
  FOREIGN KEY(job_id, college_id) REFERENCES placement_jobs(id, college_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_tpo_student_notes
  ADD CONSTRAINT db09_note_member_scope_fk
  FOREIGN KEY(learner_membership_id, college_id)
  REFERENCES college_memberships(id, college_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_tpo_team_members
  ADD CONSTRAINT db09_team_member_scope_fk
    FOREIGN KEY(membership_id, college_id)
    REFERENCES college_memberships(id, college_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_team_department_scope_fk
    FOREIGN KEY(department_id, college_id)
    REFERENCES departments(id, college_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;
-- Nullable department only for TPO_ADMIN; existing check covers role shape.

ALTER TABLE placement_recruiter_applicant_notes
  ADD CONSTRAINT db09_recruiter_note_job_scope_fk
    FOREIGN KEY(job_id, college_id) REFERENCES placement_jobs(id, college_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_recruiter_note_application_job_fk
    FOREIGN KEY(application_id, job_id)
    REFERENCES placement_applications(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Drive coordinator tenant/job/member FKs are owned by the canonical
-- db09-round-scheduling-candidate.sql table definition; do not add a second
-- ALTER path here.


-- Principal-scope hardening. Structural parent FKs above prove object/tenant
-- relationships but do not prove the named recruiter/user is allowed to act
-- in that tenant. Direct SQL must not be able to create a valid-looking
-- thread/read marker/private note for an unrelated recruiter.
CREATE FUNCTION db09_has_active_recruiter_grant(
  p_recruiter_user_id uuid,
  p_college_id uuid,
  p_company_relationship_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
      FROM placement_recruiter_college_grants g
      JOIN placement_company_relationships r
        ON r.id = g.company_relationship_id
      JOIN placement_recruiter_profiles p
        ON p.user_id = g.recruiter_user_id
     WHERE g.recruiter_user_id = p_recruiter_user_id
       AND g.status = 'ACTIVE'
       AND r.status = 'ACTIVE'
       AND p.status = 'ACTIVE'
       AND r.college_id = p_college_id
       AND r.company_id = p.company_id
       AND (
         p_company_relationship_id IS NULL
         OR r.id = p_company_relationship_id
       )
  );
$$;

CREATE FUNCTION db09_assert_message_thread_principal_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_job_relationship uuid;
BEGIN
  IF NEW.job_id IS NOT NULL THEN
    SELECT company_relationship_id
      INTO v_job_relationship
      FROM placement_jobs
     WHERE id = NEW.job_id
       AND college_id = NEW.college_id;
    IF v_job_relationship IS NULL THEN
      RAISE EXCEPTION 'message thread job is outside the thread college'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NOT db09_has_active_recruiter_grant(
    NEW.recruiter_user_id,
    NEW.college_id,
    v_job_relationship
  ) THEN
    RAISE EXCEPTION 'message thread recruiter has no active matching college grant'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_message_thread_principal_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,recruiter_user_id,job_id
  ON placement_tpo_message_threads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_message_thread_principal_scope();

CREATE FUNCTION db09_assert_message_sender_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_college_id uuid;
  v_recruiter_user_id uuid;
BEGIN
  SELECT college_id,recruiter_user_id
    INTO v_college_id,v_recruiter_user_id
    FROM placement_tpo_message_threads
   WHERE id = NEW.thread_id;

  IF v_college_id IS NULL THEN
    RAISE EXCEPTION 'message thread does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.sender_type = 'RECRUITER' THEN
    IF NEW.sender_user_id <> v_recruiter_user_id
       OR NOT db09_has_active_recruiter_grant(
         NEW.sender_user_id,
         v_college_id,
         NULL
       ) THEN
      RAISE EXCEPTION 'message recruiter sender does not own the thread'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.sender_type = 'TPO' THEN
    IF NOT EXISTS (
      SELECT 1
        FROM college_memberships m
       WHERE m.user_id = NEW.sender_user_id
         AND m.college_id = v_college_id
         AND m.status = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'message TPO sender is not active in the thread college'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    RAISE EXCEPTION 'unknown message sender type'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_message_sender_scope_guard
  BEFORE INSERT ON placement_tpo_messages
  FOR EACH ROW EXECUTE FUNCTION db09_assert_message_sender_scope();

-- Message content/identity is history. Legacy behavior only advances read_at;
-- do not allow direct SQL to rewrite sender/body/thread after publication.
CREATE FUNCTION db09_restrict_message_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.thread_id IS DISTINCT FROM OLD.thread_id
     OR NEW.sender_type IS DISTINCT FROM OLD.sender_type
     OR NEW.sender_user_id IS DISTINCT FROM OLD.sender_user_id
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'message identity/content is immutable'
      USING ERRCODE = '23514';
  END IF;
  IF OLD.read_at IS NOT NULL
     AND NEW.read_at IS DISTINCT FROM OLD.read_at THEN
    RAISE EXCEPTION 'message read state cannot be rewound or rewritten'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_message_update_guard
  BEFORE UPDATE ON placement_tpo_messages
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_message_update();

CREATE FUNCTION db09_assert_recruiter_private_note_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_relationship uuid;
BEGIN
  SELECT company_relationship_id
    INTO v_relationship
    FROM placement_jobs
   WHERE id = NEW.job_id
     AND college_id = NEW.college_id;

  IF v_relationship IS NULL
     OR NOT db09_has_active_recruiter_grant(
       NEW.recruiter_user_id,
       NEW.college_id,
       v_relationship
     ) THEN
    RAISE EXCEPTION 'recruiter applicant note is outside recruiter grant scope'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_recruiter_private_note_scope_guard
  BEFORE INSERT OR UPDATE OF recruiter_user_id,college_id,job_id,application_id
  ON placement_recruiter_applicant_notes
  FOR EACH ROW EXECUTE FUNCTION db09_assert_recruiter_private_note_scope();

CREATE FUNCTION db09_assert_recruiter_read_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT db09_has_active_recruiter_grant(
    NEW.recruiter_user_id,
    NEW.college_id,
    NULL
  ) THEN
    RAISE EXCEPTION 'recruiter notification read marker is outside grant scope'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_recruiter_read_scope_guard
  BEFORE INSERT OR UPDATE OF recruiter_user_id,college_id
  ON placement_recruiter_notification_reads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_recruiter_read_scope();

-- Share events are an audit trail. Their source service only appends.
CREATE FUNCTION db09_reject_share_event_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'share event history is append-only'
    USING ERRCODE = '23514';
END $$;
CREATE TRIGGER db09_share_event_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_share_events
  FOR EACH ROW EXECUTE FUNCTION db09_reject_share_event_rewrite();

-- Required PostgreSQL negative witnesses:
--  1. Tenant A message thread with tenant B job => rejected.
--  2. Tenant A share token with tenant B job => rejected.
--  3. Tenant A student note with tenant B membership => rejected.
--  4. Tenant A team member with tenant B membership/department => rejected.
--  5. Tenant A recruiter applicant note with wrong job/college or
--     application from another job => rejected.
--  6. Same-tenant valid cases, including null General thread job, succeed.
--  7. Deletes/owner changes and concurrent writes cannot break relationships.
--  8. Actor status, recruiter grants, share disclosure scopes, membership
--     roles, read visibility, and token TTL remain APP-level/witness concerns
--     not solved by these structural foreign keys.
--  9. Verify exact generated SQL/replay on disposable PostgreSQL, with
--     existing data checked for inconsistencies before any ALTER.
-- 10. Coordinator tenant negatives execute through the canonical scheduling
--     candidate, not this collaboration ALTER file.
-- 11. Direct SQL cannot create a thread/read marker/private applicant note for
--     a recruiter lacking an ACTIVE same-company grant to that college/job.
-- 12. RECRUITER messages must be authored by the thread recruiter; TPO messages
--     require an ACTIVE membership in the thread college.
-- 13. Published message identity/body cannot be rewritten and read_at cannot be
--     rewound; share-event history rejects UPDATE/DELETE.
