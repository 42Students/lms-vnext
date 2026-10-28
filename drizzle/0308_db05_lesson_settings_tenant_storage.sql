-- DB-008 persisted lesson-content authoring facets from ContentDataDTO.
-- Preserve legacy raw dates and editing flags without mapping them to DB06
-- assignment due dates or enabling unsafe HTML rendering.
-- Scope is resolved from content -> lesson -> learning path -> offering ->
-- period and course department, with an exact optional section delivery.
-- Rows are persisted only; API activation needs explicit authorization review.
CREATE TABLE lesson_content_settings (
  lesson_content_id uuid PRIMARY KEY
    REFERENCES lesson_contents(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  allow_discussions boolean NOT NULL DEFAULT false,
  view_after_schedule boolean NOT NULL DEFAULT false,
  view_before_schedule boolean NOT NULL DEFAULT false,
  html_content text,
  plain_text text,
  legacy_due_date_raw text,
  calendar_event_id text,
  calendar_time_zone text,
  thumbnail_url text,
  version bigint NOT NULL DEFAULT 0,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db05_lesson_content_settings_version_nonnegative_ck CHECK (version >= 0)
);
--> statement-breakpoint
CREATE INDEX db05_lesson_content_settings_updated_idx
 ON lesson_content_settings(updated_at DESC);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db05_lesson_settings_tenant_version_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_settings_guard$
DECLARE
  owning_college_id uuid;
  period_college_id uuid;
  content_deleted_at timestamptz;
  lesson_deleted_at timestamptz;
  content_delivery_id uuid;
  resolved_delivery_offering_id uuid;
  offering_id uuid;
  offering_cohort_id uuid;
  offering_period_id uuid;
  section_cohort_id uuid;
  section_period_id uuid;
  authorized_editor boolean;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'lesson settings writes require READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);
  IF TG_OP = 'UPDATE' THEN
    IF NEW.lesson_content_id IS DISTINCT FROM OLD.lesson_content_id
      OR NEW.college_id IS DISTINCT FROM OLD.college_id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'lesson content settings identity and provenance are immutable'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.version IS DISTINCT FROM OLD.version + 1 THEN
      RAISE EXCEPTION 'lesson settings update must increment version'
        USING ERRCODE = '23514';
    END IF;
    NEW.updated_at := greatest(clock_timestamp(), OLD.updated_at + interval '1 millisecond');
  END IF;
  SELECT dep.college_id, period.college_id,
    content.deleted_at, lesson.deleted_at, content.delivery_id,
    delivery.offering_id, offering.id, offering.cohort_id, offering.academic_period_id,
    section_row.cohort_id, section_row.academic_period_id
  INTO owning_college_id, period_college_id,
    content_deleted_at, lesson_deleted_at, content_delivery_id,
    resolved_delivery_offering_id, offering_id, offering_cohort_id, offering_period_id,
    section_cohort_id, section_period_id
  FROM lesson_contents content
  JOIN course_lessons lesson ON lesson.id=content.lesson_id
  JOIN course_learning_paths path ON path.id=lesson.learning_path_id
  JOIN course_offerings offering ON offering.id=path.offering_id
  JOIN academic_periods period ON period.id=offering.academic_period_id
  JOIN courses course_row ON course_row.id=offering.course_id
  JOIN departments dep ON dep.id=course_row.department_id
  LEFT JOIN course_section_deliveries delivery ON delivery.id=content.delivery_id
  LEFT JOIN sections section_row ON section_row.id=delivery.section_id
  WHERE content.id=NEW.lesson_content_id;
  IF owning_college_id IS NULL
     OR period_college_id IS DISTINCT FROM owning_college_id
     OR NEW.college_id IS DISTINCT FROM owning_college_id
     OR content_deleted_at IS NOT NULL OR lesson_deleted_at IS NOT NULL
     OR (content_delivery_id IS NOT NULL AND (
         resolved_delivery_offering_id IS DISTINCT FROM offering_id
         OR section_cohort_id IS DISTINCT FROM offering_cohort_id
         OR section_period_id IS DISTINCT FROM offering_period_id
     )) THEN
    RAISE EXCEPTION 'lesson settings content is outside the college/offering boundary'
      USING ERRCODE = '23514';
  END IF;
  SELECT EXISTS(
    SELECT 1 FROM college_memberships membership
    JOIN users actor ON actor.id=membership.user_id
    JOIN membership_roles role ON role.membership_id=membership.id
    WHERE actor.id=NEW.updated_by_user_id
      AND actor.platform_status='ACTIVE'
      AND membership.college_id=NEW.college_id
      AND membership.status='ACTIVE'
      AND role.role IN ('COLLEGE_ADMIN','FACULTY')
  ) INTO authorized_editor;
  IF NOT authorized_editor THEN
    RAISE EXCEPTION 'lesson settings editor lacks active college authoring membership'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_settings_guard$;
--> statement-breakpoint
CREATE TRIGGER db05_lesson_settings_tenant_before_write
 BEFORE INSERT OR UPDATE ON lesson_content_settings
 FOR EACH ROW EXECUTE FUNCTION db05_lesson_settings_tenant_version_guard();
--> statement-breakpoint
-- Prevent an already-authored settings row silently changing its lesson or
-- delivery scope. Ancestor moves remain separate DB02/DB05 integrity gates.
CREATE OR REPLACE FUNCTION db05_lesson_settings_no_content_reparent()
RETURNS trigger LANGUAGE plpgsql AS $db05_settings_reparent$
BEGIN
  IF EXISTS(SELECT 1 FROM lesson_content_settings WHERE lesson_content_id=OLD.id) THEN
    RAISE EXCEPTION 'lesson with settings cannot reparent content or delivery'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_settings_reparent$;
--> statement-breakpoint
CREATE TRIGGER db05_lesson_settings_content_reparent_before_write
 BEFORE UPDATE OF lesson_id, delivery_id ON lesson_contents
 FOR EACH ROW WHEN (
   OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
   OLD.delivery_id IS DISTINCT FROM NEW.delivery_id
 )
 EXECUTE FUNCTION db05_lesson_settings_no_content_reparent();
