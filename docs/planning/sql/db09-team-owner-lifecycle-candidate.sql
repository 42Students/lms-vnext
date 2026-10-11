-- DB-069 / Chat 3. ISOLATED CANDIDATE, not a registered migration.
-- Mutable placement ownership is distinct from immutable creator provenance.
-- Chat 1 exclusively owns drizzle/*, schema barrel and migration registration.
--
-- Frozen legacy source:
--   Job.owner_faculty_id
--   TpoDriveService create/approveRequest
--   TpoDriveExtrasService copy
--   TpoTeamService removalImpact/removeMember
--   TpoRecruiterLeadsHubService recruiter-lead ownership
--
-- Dependencies before integration:
--   * DB08 placement_jobs
--   * DB09 placement_tpo_leads + placement_tpo_team_members
--   * college_memberships/membership_roles/users/colleges
--   * canonical UNIQUE college_memberships(id,college_id)
--   * canonical UNIQUE placement_jobs(id,college_id) if another child later needs it
--
-- owner_membership_id remains nullable at the column level for historical
-- CLOSED/ARCHIVED rows and because frozen legacy REQUEST jobs could be ownerless
-- until approval. Current vNext does not persist REQUEST as a placement_jobs
-- status, so a CHECK requires owner on every live DRAFT/PUBLISHED row after a
-- conservative backfill. The DB does not invent a recruiter-request lifecycle.

ALTER TABLE placement_jobs
  ADD COLUMN owner_membership_id uuid;

ALTER TABLE placement_jobs
  ADD CONSTRAINT db069_job_owner_college_fk
  FOREIGN KEY(owner_membership_id,college_id)
  REFERENCES college_memberships(id,college_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX db069_placement_jobs_owner_status_idx
  ON placement_jobs(college_id,owner_membership_id,status)
  WHERE owner_membership_id IS NOT NULL;

-- Operation-specific owner scope. This is deliberately broader than the
-- college-wide db09_has_active_tpo_actor helper: a delegated
-- FACULTY_COORDINATOR is allowed to own a drive even though that role must not
-- receive unrestricted college-wide TPO authority.
CREATE FUNCTION db069_has_active_drive_owner(
  p_membership_id uuid,
  p_college_id uuid
) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN users u ON u.id = m.user_id
      JOIN colleges c ON c.id = m.college_id
     WHERE m.id = p_membership_id
       AND m.college_id = p_college_id
       AND m.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE'
       AND c.status = 'ACTIVE'
       AND (
         EXISTS (
           SELECT 1
             FROM membership_roles r
            WHERE r.membership_id = m.id
              AND r.role IN ('TPO','COLLEGE_ADMIN')
         )
         OR EXISTS (
           SELECT 1
             FROM placement_tpo_team_members tm
            WHERE tm.college_id = p_college_id
              AND tm.membership_id = m.id
              AND tm.role IN ('TPO_ADMIN','FACULTY_COORDINATOR')
         )
       )
  );
$$;

-- Greenfield/backfill rule: current vNext creates jobs through
-- placements.manage. Preserve legacy creator->owner default only when the
-- creator resolves to exactly one active same-college placement-owner
-- membership. Never guess across ambiguous memberships.
UPDATE placement_jobs j
   SET owner_membership_id = m.id
  FROM college_memberships m
 WHERE j.owner_membership_id IS NULL
   AND j.status IN ('DRAFT','PUBLISHED')
   AND m.user_id = j.created_by_user_id
   AND m.college_id = j.college_id
   AND db069_has_active_drive_owner(m.id,j.college_id)
   AND NOT EXISTS (
     SELECT 1
       FROM college_memberships other
      WHERE other.user_id = j.created_by_user_id
        AND other.college_id = j.college_id
        AND other.id <> m.id
        AND db069_has_active_drive_owner(other.id,j.college_id)
   );

DO $db069_owner_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM placement_jobs
     WHERE status IN ('DRAFT','PUBLISHED')
       AND owner_membership_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'DB069: live placement jobs require explicit owner backfill before migration';
  END IF;
END
$db069_owner_preflight$;

ALTER TABLE placement_jobs
  ADD CONSTRAINT db069_live_job_owner_ck
  CHECK (
    status NOT IN ('DRAFT','PUBLISHED')
    OR owner_membership_id IS NOT NULL
  );

-- Serialize assignment/removal around one college+membership identity. A
-- transaction deleting a team member and a transaction concurrently assigning
-- a live drive to that member cannot both pass stale preconditions.
CREATE FUNCTION db069_lock_owner_identity(
  p_college_id uuid,
  p_membership_id uuid
) RETURNS void
LANGUAGE sql VOLATILE AS $$
  SELECT pg_advisory_xact_lock(
    hashtextextended(p_college_id::text || ':' || p_membership_id::text, 69069)
  );
$$;

CREATE FUNCTION db069_assert_job_owner_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM db069_lock_owner_identity(NEW.college_id,NEW.owner_membership_id);

  IF NOT db069_has_active_drive_owner(
    NEW.owner_membership_id,
    NEW.college_id
  ) THEN
    RAISE EXCEPTION 'placement job owner lacks active placement-owner scope'
      USING ERRCODE='23514',
            CONSTRAINT='db069_job_owner_scope';
  END IF;

  RETURN NEW;
END $$;
CREATE TRIGGER db069_job_owner_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,owner_membership_id,status
  ON placement_jobs
  FOR EACH ROW EXECUTE FUNCTION db069_assert_job_owner_scope();

-- Recruiter-lead source bulk assignment historically accepted any faculty in
-- the college, while team removal required ownership to move to the placement
-- team/TPO. That mismatch permits a removed coordinator to regain a lead.
-- vNext intentionally hardens lead ownership to the same active placement-owner
-- scope as drives, in addition to sharing the serialization key.
CREATE FUNCTION db069_lock_lead_owner_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_old_college uuid;
  v_old_owner uuid;
  v_new_college uuid;
  v_new_owner uuid;
  v_old_key text;
  v_new_key text;
BEGIN
  v_old_college := CASE WHEN TG_OP='UPDATE' THEN OLD.college_id ELSE NULL END;
  v_old_owner := CASE WHEN TG_OP='UPDATE' THEN OLD.owner_membership_id ELSE NULL END;
  v_new_college := NEW.college_id;
  v_new_owner := NEW.owner_membership_id;
  v_old_key := CASE WHEN v_old_owner IS NULL THEN NULL
                    ELSE v_old_college::text || ':' || v_old_owner::text END;
  v_new_key := CASE WHEN v_new_owner IS NULL THEN NULL
                    ELSE v_new_college::text || ':' || v_new_owner::text END;

  -- Stable full-identity lock ordering prevents opposite owner transfers,
  -- including the same membership being moved across colleges, from deadlocking.
  IF v_old_key IS NOT NULL
     AND v_new_key IS NOT NULL
     AND v_new_key < v_old_key THEN
    PERFORM db069_lock_owner_identity(v_new_college,v_new_owner);
    PERFORM db069_lock_owner_identity(v_old_college,v_old_owner);
  ELSE
    IF v_old_key IS NOT NULL THEN
      PERFORM db069_lock_owner_identity(v_old_college,v_old_owner);
    END IF;
    IF v_new_key IS NOT NULL
       AND v_new_key IS DISTINCT FROM v_old_key THEN
      PERFORM db069_lock_owner_identity(v_new_college,v_new_owner);
    END IF;
  END IF;
  IF v_new_owner IS NOT NULL
     AND NOT db069_has_active_drive_owner(v_new_owner,v_new_college) THEN
    RAISE EXCEPTION 'recruiter lead owner lacks active placement-owner scope'
      USING ERRCODE='23514',
            CONSTRAINT='db069_lead_owner_scope';
  END IF;

  RETURN NEW;
END $$;
CREATE TRIGGER db069_lead_owner_serialization_guard
  BEFORE INSERT OR UPDATE OF college_id,owner_membership_id
  ON placement_tpo_leads
  FOR EACH ROW EXECUTE FUNCTION db069_lock_lead_owner_change();

-- Direct team-row deletion must preserve the same source rule as
-- TpoTeamService.removeMember(null): a member cannot disappear while they own
-- any recruiter lead or a live DRAFT/PUBLISHED drive.
CREATE FUNCTION db069_guard_team_member_identity_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM db069_lock_owner_identity(OLD.college_id,OLD.membership_id);

  IF EXISTS (
    SELECT 1
      FROM placement_tpo_leads l
     WHERE l.college_id = OLD.college_id
       AND l.owner_membership_id = OLD.membership_id
  ) THEN
    RAISE EXCEPTION 'team member still owns recruiter leads; reassign before identity change/removal'
      USING ERRCODE='23514',
            CONSTRAINT='db069_team_member_owned_leads';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM placement_jobs j
     WHERE j.college_id = OLD.college_id
       AND j.owner_membership_id = OLD.membership_id
       AND j.status IN ('DRAFT','PUBLISHED')
  ) THEN
    RAISE EXCEPTION 'team member still owns live placement drives; reassign before identity change/removal'
      USING ERRCODE='23514',
            CONSTRAINT='db069_team_member_owned_drives';
  END IF;

  IF TG_OP='DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db069_team_member_identity_guard
  BEFORE UPDATE OF college_id,membership_id OR DELETE
  ON placement_tpo_team_members
  FOR EACH ROW EXECUTE FUNCTION db069_guard_team_member_identity_change();

-- Source-equivalent transactional operation:
-- * source team row is locked;
-- * self-removal is refused;
-- * optional target must be an active placement owner in the same college;
-- * all recruiter leads + all jobs (including closed/history rows) are moved
--   before the team row is deleted, matching legacy reassignment SQL;
-- * with no target, deletion succeeds only if no lead/live-drive ownership
--   remains. Closed/archived drive ownership may remain historical.
CREATE FUNCTION db069_reassign_and_remove_tpo_team_member(
  p_college_id uuid,
  p_from_membership_id uuid,
  p_to_membership_id uuid,
  p_actor_user_id uuid
) RETURNS TABLE(reassigned_leads integer,reassigned_jobs integer)
LANGUAGE plpgsql AS $$
DECLARE
  v_actor_membership uuid;
  v_from_user uuid;
  v_leads integer := 0;
  v_jobs integer := 0;
  v_lock_member uuid;
BEGIN
  IF p_to_membership_id IS NOT NULL
     AND p_to_membership_id = p_from_membership_id THEN
    RAISE EXCEPTION 'replacement owner must differ from removed team member'
      USING ERRCODE='23514',
            CONSTRAINT='db069_team_reassign_distinct';
  END IF;

  -- Lock both identities in deterministic UUID-text order.
  FOR v_lock_member IN
    SELECT x
      FROM unnest(
        CASE
          WHEN p_to_membership_id IS NULL THEN ARRAY[p_from_membership_id]::uuid[]
          ELSE ARRAY[p_from_membership_id,p_to_membership_id]::uuid[]
        END
      ) AS ids(x)
     ORDER BY x::text
  LOOP
    PERFORM db069_lock_owner_identity(p_college_id,v_lock_member);
  END LOOP;

  SELECT tm.membership_id,m.user_id
    INTO v_actor_membership,v_from_user
    FROM placement_tpo_team_members tm
    JOIN college_memberships m ON m.id = tm.membership_id
   WHERE tm.college_id = p_college_id
     AND tm.membership_id = p_from_membership_id
   FOR UPDATE OF tm;

  IF v_actor_membership IS NULL THEN
    RAISE EXCEPTION 'team member not found'
      USING ERRCODE='23514',
            CONSTRAINT='db069_team_member_exists';
  END IF;

  IF v_from_user = p_actor_user_id THEN
    RAISE EXCEPTION 'team member cannot remove themself'
      USING ERRCODE='23514',
            CONSTRAINT='db069_team_self_remove';
  END IF;

  -- Only a persisted college-wide TPO actor may perform team removal. This
  -- intentionally does not promote FACULTY_COORDINATOR to global authority.
  IF NOT db09_has_active_tpo_actor(p_actor_user_id,p_college_id) THEN
    RAISE EXCEPTION 'actor lacks active TPO scope for team removal'
      USING ERRCODE='23514',
            CONSTRAINT='db069_team_remove_actor_scope';
  END IF;

  IF p_to_membership_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM placement_tpo_leads l
       WHERE l.college_id=p_college_id
         AND l.owner_membership_id=p_from_membership_id
    ) OR EXISTS (
      SELECT 1 FROM placement_jobs j
       WHERE j.college_id=p_college_id
         AND j.owner_membership_id=p_from_membership_id
         AND j.status IN ('DRAFT','PUBLISHED')
    ) THEN
      RAISE EXCEPTION 'team member still owns recruiters or live drives'
        USING ERRCODE='23514',
              CONSTRAINT='db069_team_remove_requires_reassign';
    END IF;
  ELSE
    IF NOT db069_has_active_drive_owner(p_to_membership_id,p_college_id) THEN
      RAISE EXCEPTION 'replacement owner lacks active placement-owner scope'
        USING ERRCODE='23514',
              CONSTRAINT='db069_team_reassign_target_scope';
    END IF;

    UPDATE placement_tpo_leads
       SET owner_membership_id=p_to_membership_id
     WHERE college_id=p_college_id
       AND owner_membership_id=p_from_membership_id;
    GET DIAGNOSTICS v_leads = ROW_COUNT;

    -- Legacy source reassigns every owned job, not only open jobs, when a
    -- replacement is explicitly chosen.
    UPDATE placement_jobs
       SET owner_membership_id=p_to_membership_id,
           updated_at=statement_timestamp()
     WHERE college_id=p_college_id
       AND owner_membership_id=p_from_membership_id;
    GET DIAGNOSTICS v_jobs = ROW_COUNT;
  END IF;

  DELETE FROM placement_tpo_team_members
   WHERE college_id=p_college_id
     AND membership_id=p_from_membership_id;

  reassigned_leads := v_leads;
  reassigned_jobs := v_jobs;
  RETURN NEXT;
END $$;

-- W01 / API cutover notes:
-- 1) Add ownerMembershipId to canonical placementJobs Drizzle but do not
--    replace createdByUserId; both fields have different semantics.
-- 2) TPO-created/copied jobs set owner to the acting membership. Live
--    DRAFT/PUBLISHED rows are CHECK-constrained to have an owner.
-- 3) Recruiter-request approval sets owner to the approving TPO membership.
-- 4) Team removal must call the atomic function (or equivalent transaction),
--    never DELETE the team row first.
-- 5) Existing greenfield rows may be backfilled from created_by_user_id only
--    when an unambiguous same-college active membership exists. Do not infer
--    a delegated owner from creator identity where evidence is ambiguous.
-- 6) Recruiter-lead owner changes use the same placement-owner scope. This is
--    an intentional vNext hardening over the legacy bulk action that accepted
--    any same-college faculty, closing post-removal owner resurrection.
-- 7) Run the authored direct-SQL and two-client race witnesses on disposable
--    PostgreSQL after migration registration. This file itself is not proof.
