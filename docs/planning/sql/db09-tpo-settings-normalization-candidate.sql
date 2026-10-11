-- DB-034 / DB09 TPO settings normalization candidate.
-- UNREGISTERED / NOT EXECUTED. W01 owns migration registration and replay.
--
-- Legacy source:
--   TpoSettingsHubService trusted_domains_json + prep_course_ids_json
-- Consumers:
--   TpoDriveService.isTrustedRecruiter (drive request auto-approval)
--   TpoStudentsReadService.prepAverages (readiness)
--
-- Canonical greenfield decision: do NOT create the two JSON identifier-list
-- columns in placement_tpo_college_settings. Store normalized rows below.

CREATE TABLE placement_tpo_trusted_domains (
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  domain varchar(253) NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_trusted_domains_pk
    PRIMARY KEY (college_id, domain),
  CONSTRAINT placement_tpo_trusted_domains_shape_ck
    CHECK (
      domain = lower(domain)
      AND domain = trim(domain)
      AND domain ~ '^[a-z0-9.-]+[.][a-z]{2,}$'
    ),
  CONSTRAINT placement_tpo_trusted_domains_free_mail_ck
    CHECK (domain NOT IN (
      'gmail.com','googlemail.com',
      'yahoo.com','yahoo.co.in','yahoo.in','ymail.com',
      'outlook.com','outlook.in','hotmail.com','live.com','msn.com',
      'icloud.com','me.com','aol.com','rediffmail.com',
      'protonmail.com','proton.me',
      'zohomail.com','zohomail.in','mail.com','gmx.com','yandex.com'
    ))
);
CREATE INDEX placement_tpo_trusted_domains_domain_idx
  ON placement_tpo_trusted_domains(domain);

CREATE TABLE placement_tpo_prep_courses (
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_prep_courses_pk
    PRIMARY KEY (college_id, course_id)
);
CREATE INDEX placement_tpo_prep_courses_course_idx
  ON placement_tpo_prep_courses(course_id);

-- db09_has_active_tpo_actor is defined by
-- db09-collaboration-scoped-fk-candidate.sql and must be registered first.
CREATE FUNCTION db09_assert_trusted_domain_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT db09_has_active_tpo_actor(
    NEW.created_by_user_id,
    NEW.college_id
  ) THEN
    RAISE EXCEPTION 'trusted domain writer lacks active TPO scope'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_trusted_domain_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,domain,created_by_user_id
  ON placement_tpo_trusted_domains
  FOR EACH ROW EXECUTE FUNCTION db09_assert_trusted_domain_scope();

-- Legacy prepCourses(organizationId) exposes the organization's courses, not
-- only a single college's courses. vNext course identity is department/college
-- scoped, so same-organization is the closest normalized parity boundary.
CREATE FUNCTION db09_assert_prep_course_setting_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_target_org uuid;
BEGIN
  SELECT organization_id
    INTO v_target_org
    FROM colleges
   WHERE id = NEW.college_id
     AND status = 'ACTIVE';

  IF v_target_org IS NULL THEN
    RAISE EXCEPTION 'prep-course settings college is not active'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM courses c
      JOIN departments d ON d.id = c.department_id
      JOIN colleges owner_college ON owner_college.id = d.college_id
     WHERE c.id = NEW.course_id
       AND c.status = 'ACTIVE'
       AND d.archived_at IS NULL
       AND owner_college.status = 'ACTIVE'
       AND owner_college.organization_id = v_target_org
  ) THEN
    RAISE EXCEPTION 'prep course is not an active course in the college organization'
      USING ERRCODE = '23514';
  END IF;

  IF NOT db09_has_active_tpo_actor(
    NEW.created_by_user_id,
    NEW.college_id
  ) THEN
    RAISE EXCEPTION 'prep-course setting writer lacks active TPO scope'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END $$;
CREATE TRIGGER db09_prep_course_setting_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,course_id,created_by_user_id
  ON placement_tpo_prep_courses
  FOR EACH ROW EXECUTE FUNCTION db09_assert_prep_course_setting_scope();

-- Required PostgreSQL acceptance witnesses:
--  1. lowercase valid company domain succeeds for active TPO actor;
--  2. uppercase, '@'-prefixed, malformed and free-mail domains are rejected;
--  3. duplicate (college,domain) is rejected under concurrent inserts;
--  4. foreign/inactive/non-TPO writer is rejected;
--  5. active same-organization prep course succeeds;
--  6. cross-organization, archived-department, archived-college and inactive
--     course references are rejected;
--  7. deleted/nonexistent course cannot survive the FK;
--  8. duplicate (college,course) is rejected under concurrent inserts;
--  9. replacing a settings list is one transaction: delete removed rows,
--     insert new rows, rollback leaves prior state intact;
-- 10. runtime trusted-recruiter check uses exact normalized domain rows and
--     still requires recruiter verification != PENDING;
-- 11. runtime readiness query uses normalized prep-course rows and continues
--     to scope learner attempts to the learner's college;
-- 12. empty normalized tables round-trip to empty setting arrays.
