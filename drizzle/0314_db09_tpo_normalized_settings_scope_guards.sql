-- DB-034: promote trusted-domain and prep-course actor/organization guards.
-- vNext registered 0075 created physical normalized rows but omitted the
-- scoped writer and same-organization guards in the source-only candidate.
-- Fail closed on existing violations instead of silently mutating their owner.
DO $db034_preflight$
BEGIN
 IF EXISTS (
  SELECT 1 FROM placement_tpo_trusted_domains t
  WHERE NOT db09_has_active_tpo_actor(t.created_by_user_id,t.college_id)
 ) THEN
  RAISE EXCEPTION 'DB034 existing trusted-domain row lacks active TPO owner'
   USING ERRCODE='23514';
 END IF;
 IF EXISTS (
  SELECT 1 FROM placement_tpo_prep_courses t
  WHERE NOT db09_has_active_tpo_actor(t.created_by_user_id,t.college_id)
   OR NOT EXISTS (
     SELECT 1 FROM courses course
     JOIN departments department ON department.id=course.department_id
     JOIN colleges course_college ON course_college.id=department.college_id
     JOIN colleges selected_college ON selected_college.id=t.college_id
     WHERE course.id=t.course_id
       AND course.status='ACTIVE'
       AND department.archived_at IS NULL
       AND course_college.status='ACTIVE'
       AND selected_college.status='ACTIVE'
       AND course_college.organization_id=selected_college.organization_id
   )
 ) THEN
  RAISE EXCEPTION 'DB034 existing prep-course selection has invalid owner or organization'
   USING ERRCODE='23514';
 END IF;
END $db034_preflight$;
--> statement-breakpoint
-- Lock the authorization principal until the transaction commits.
-- A concurrent membership role or platform-user revocation cannot win after
-- this row was accepted but before the settings write becomes visible.
CREATE OR REPLACE FUNCTION db034_assert_active_tpo_actor(p_user_id uuid,p_college_id uuid)
RETURNS void LANGUAGE plpgsql AS $db034_tpo$
BEGIN
 PERFORM m.id
 FROM college_memberships m
 JOIN membership_roles mr ON mr.membership_id=m.id
 JOIN users u ON u.id=m.user_id
 JOIN colleges c ON c.id=m.college_id
 WHERE m.user_id=p_user_id
   AND m.college_id=p_college_id
   AND m.status='ACTIVE'
   AND mr.role IN ('TPO','COLLEGE_ADMIN')
   AND u.platform_status='ACTIVE'
   AND c.status='ACTIVE'
 ORDER BY m.id
 LIMIT 1
 FOR SHARE OF m,mr,u,c;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'DB034 writer lacks active same-college TPO authority'
   USING ERRCODE='23514';
 END IF;
END $db034_tpo$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db09_assert_trusted_domain_scope()
RETURNS trigger LANGUAGE plpgsql AS $db034_trusted$
BEGIN
 PERFORM db034_assert_active_tpo_actor(NEW.created_by_user_id,NEW.college_id);
 RETURN NEW;
END $db034_trusted$;
--> statement-breakpoint
CREATE TRIGGER db09_trusted_domain_scope_guard
 BEFORE INSERT OR UPDATE OF college_id,domain,created_by_user_id
 ON placement_tpo_trusted_domains
 FOR EACH ROW EXECUTE FUNCTION db09_assert_trusted_domain_scope();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db09_assert_prep_course_setting_scope()
RETURNS trigger LANGUAGE plpgsql AS $db034_prep$
BEGIN
 PERFORM db034_assert_active_tpo_actor(NEW.created_by_user_id,NEW.college_id);
 PERFORM course.id
 FROM courses course
 JOIN departments department ON department.id=course.department_id
 JOIN colleges course_college ON course_college.id=department.college_id
 JOIN colleges selected_college ON selected_college.id=NEW.college_id
 WHERE course.id=NEW.course_id
   AND course.status='ACTIVE'
   AND department.archived_at IS NULL
   AND course_college.status='ACTIVE'
   AND selected_college.status='ACTIVE'
   AND course_college.organization_id=selected_college.organization_id
 FOR SHARE OF course,department,course_college,selected_college;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'DB034 prep course must be active in same organization'
   USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $db034_prep$;
--> statement-breakpoint
CREATE TRIGGER db09_prep_course_setting_scope_guard
 BEFORE INSERT OR UPDATE OF college_id,course_id,created_by_user_id
 ON placement_tpo_prep_courses
 FOR EACH ROW EXECUTE FUNCTION db09_assert_prep_course_setting_scope();
