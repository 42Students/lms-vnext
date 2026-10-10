-- W04 DB08-D application write guard; SOURCE-ONLY STAGING SQL.
-- Do not apply independently of W01's numbered Drizzle migration/replay.
-- Applies to self-applied published drives. Admin-explicit inclusion is distinct.
-- A job INCLUDE override may not grant general placement module access.
CREATE FUNCTION db08_guard_placement_application_self_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  member_college uuid;
  member_user uuid;
  job_college uuid;
  job_status varchar(24);
  job_archived timestamptz;
  job_deadline timestamptz;
  enrollment_count integer;
  current_cohort uuid;
  enrollment_id uuid;
  section_count integer;
  current_section uuid;
  winning_decision varchar(24);
BEGIN
  SELECT m.college_id,m.user_id INTO member_college,member_user
    FROM college_memberships m
    JOIN membership_roles role ON role.membership_id=m.id AND role.role='LEARNER'
    WHERE m.id=NEW.membership_id AND m.status='ACTIVE' LIMIT 1;
  SELECT j.college_id,j.status,j.archived_at,j.application_deadline
    INTO job_college,job_status,job_archived,job_deadline
    FROM placement_jobs j WHERE j.id=NEW.job_id;
  IF member_college IS NULL OR job_college IS NULL
    OR member_college IS DISTINCT FROM job_college THEN
    RAISE EXCEPTION 'Placement application membership/job college mismatch'
      USING ERRCODE='23514';
  END IF;

  -- Manager explicit inclusion requires separate application-service permission
  -- and protected DB grants; never accept arbitrary spoofed actor IDs.
  IF NEW.submitted_by_user_id IS DISTINCT FROM member_user THEN
    RETURN NEW;
  END IF;

  -- The same college lock is acquired by DB08 eligibility bulk decisions and
  -- batch finish; serializes self applications with those policy writes.
  PERFORM 1 FROM colleges WHERE id=member_college FOR UPDATE;
  IF job_status<>'PUBLISHED' OR job_archived IS NOT NULL
    OR (job_deadline IS NOT NULL AND now() >= job_deadline) THEN
    RAISE EXCEPTION 'Drive not open for self application' USING ERRCODE='23514';
  END IF;

  -- College-level paid-module gate must never be overridden by per-member
  -- access. W01 should also serialize the college module OFF writer lock.
  IF NOT EXISTS (
    SELECT 1 FROM module_access_rules r
    WHERE r.module='placements' AND r.scope_type='COLLEGE'
      AND r.scope_id=member_college AND r.enabled=true
  ) OR EXISTS (
    SELECT 1 FROM module_access_rules r
    WHERE r.module='placements' AND r.scope_type='GLOBAL'
      AND r.scope_id IS NULL AND r.locked=true AND r.enabled=false
  ) THEN
    RAISE EXCEPTION 'College placement module disabled' USING ERRCODE='23514';
  END IF;

  SELECT count(*),min(le.cohort_id),min(le.id)
    INTO enrollment_count,current_cohort,enrollment_id
    FROM learner_program_enrollments le
    JOIN cohorts c ON c.id=le.cohort_id AND c.program_id=le.program_id
    JOIN programs p ON p.id=c.program_id
    JOIN departments dep ON dep.id=p.department_id
    WHERE le.membership_id=NEW.membership_id AND le.status='ACTIVE'
      AND dep.college_id=member_college;
  IF enrollment_count<>1 THEN
    RAISE EXCEPTION 'Invalid or ambiguous active academic enrollment' USING ERRCODE='23514';
  END IF;

  SELECT count(*),min(s.id) INTO section_count,current_section
    FROM section_enrollments se
    JOIN sections s ON s.id=se.section_id
      AND s.academic_period_id=se.academic_period_id
    WHERE se.learner_enrollment_id=enrollment_id AND se.status='ACTIVE'
      AND s.status='ACTIVE' AND s.cohort_id=current_cohort;
  IF section_count>1 THEN
    RAISE EXCEPTION 'Ambiguous active placement class' USING ERRCODE='23514';
  END IF;

  SELECT d.status INTO winning_decision FROM placement_eligibility_decisions d
    WHERE d.college_id=member_college AND (
      (d.scope_type='MEMBERSHIP' AND d.scope_id=NEW.membership_id) OR
      (d.scope_type='SECTION' AND d.scope_id=current_section) OR
      (d.scope_type='COHORT' AND d.scope_id=current_cohort)
    )
    ORDER BY CASE d.scope_type
      WHEN 'MEMBERSHIP' THEN 0 WHEN 'SECTION' THEN 1 ELSE 2 END
    LIMIT 1;
  IF winning_decision IS DISTINCT FROM 'ELIGIBLE' THEN
    RAISE EXCEPTION 'Learner not eligible for Placements' USING ERRCODE='23514';
  END IF;

  IF EXISTS (SELECT 1 FROM placement_batch_lifecycles batch
      WHERE batch.cohort_id=current_cohort
        AND batch.college_id=member_college AND batch.finished_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Finished academic cohort cannot self apply' USING ERRCODE='23514';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM placement_job_cohort_targets target
      WHERE target.job_id=NEW.job_id
        AND target.cohort_id=current_cohort
        AND target.college_id=member_college) THEN
    RAISE EXCEPTION 'Placement Drive does not target learner cohort'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER db08_self_application_gate
  BEFORE INSERT ON placement_applications
  FOR EACH ROW EXECUTE FUNCTION db08_guard_placement_application_self_insert();

-- P0 W01 REVIEW: service and migration must lock college before self apply;
-- manager explicit inclusion actor permission cannot be inferred from IDs in
-- a direct SQL INSERT. Enforce separate SECURITY DEFINER/grants boundary.
-- Ensure every job/role option and application belongs to same college.
-- Decide whether registered consent is a requirement for self applications;
-- legacy batch design names registration stage but does not unambiguously
-- make it an Apply precondition. Do not silently invent that rule.
-- Source-only SQL has NOT been parsed/executed on a disposable database.
