-- [chat-14] DB05 separate lesson-content discussion store.
-- Source of the table and guard: the two unregistered DB05 draft SQL files.
-- Lane 15 owns journal registration; API permission gates and disposable PG
-- negative/race tests are still prerequisites to using this at runtime.
CREATE TABLE IF NOT EXISTS lesson_content_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_discussion_id integer,
  -- Numeric legacy provenance only; never use these IDs as current auth keys.
  legacy_class_id integer,
  legacy_course_id integer,
  legacy_content_id integer,
  legacy_parent_discussion_id integer,
  legacy_sequence integer,
  -- Both scope and actor belong to one college; trigger below enforces this.
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lesson_content_id uuid NOT NULL REFERENCES lesson_contents(id) ON DELETE RESTRICT,
  author_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  -- Legacy names were saved as snapshots by the trusted server, NOT the client.
  author_unique_name_snapshot text,
  author_profile_name_snapshot text,
  content_text text NOT NULL,
  sequence integer NOT NULL DEFAULT 0,
  -- Historical physical snapshot has optional fields not handled by current
  -- Discussions.java / DiscussionController. Keep nullable, do not claim
  -- reply/resolution/attachment functionality is active without producer evidence.
  parent_discussion_id uuid,
  discussion_status varchar(20),
  is_faculty_answer boolean,
  resolved_at timestamptz,
  resolved_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  attachment_object_key text,
  -- Preserve legacy is_deleted state without hard-deleting/moderation history.
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_content_discussions_author_college_fk
    FOREIGN KEY (author_membership_id, college_id)
    REFERENCES college_memberships(id, college_id) ON DELETE RESTRICT,
  CONSTRAINT lesson_content_discussions_resolver_college_fk
    FOREIGN KEY (resolved_by_membership_id, college_id)
    REFERENCES college_memberships(id, college_id) ON DELETE RESTRICT,
  CONSTRAINT lesson_content_discussions_text_ck
    CHECK (length(btrim(content_text)) BETWEEN 1 AND 5000),
  CONSTRAINT lesson_content_discussions_parent_not_self_ck
    CHECK (parent_discussion_id IS NULL OR parent_discussion_id <> id),
  CONSTRAINT lesson_content_discussions_id_content_uq
    UNIQUE (id, lesson_content_id),
  -- A reply may never reference a parent from another lesson content.
  CONSTRAINT lesson_content_discussions_parent_content_fk
    FOREIGN KEY (parent_discussion_id, lesson_content_id)
    REFERENCES lesson_content_discussions(id, lesson_content_id)
    ON DELETE RESTRICT
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lesson_content_discussions_content_created_idx
  ON lesson_content_discussions (lesson_content_id, created_at, id)
  WHERE deleted_at IS NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lesson_content_discussions_author_idx
  ON lesson_content_discussions (author_membership_id, created_at DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lesson_content_discussions_parent_idx
  ON lesson_content_discussions (parent_discussion_id)
  WHERE parent_discussion_id IS NOT NULL;


--> statement-breakpoint
CREATE UNIQUE INDEX lesson_content_discussions_legacy_college_id_uq
 ON lesson_content_discussions(college_id, legacy_discussion_id)
 WHERE legacy_discussion_id IS NOT NULL;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db05_lesson_discussions_tenant_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_lesson_discussions_college$
DECLARE
  content_period_college_id uuid;
  course_department_college_id uuid;
  author_college_id uuid;
  trusted_profile_name text;
  trusted_unique_name text;
  resolver_college_id uuid;
  content_offering_id uuid;
  content_delivery_id uuid;
  delivery_offering_id uuid;
  delivery_section_period_college_id uuid;
  offering_cohort_id uuid;
  offering_period_id uuid;
  section_cohort_id uuid;
  section_period_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND (
      NEW.college_id IS DISTINCT FROM OLD.college_id OR
      NEW.lesson_content_id IS DISTINCT FROM OLD.lesson_content_id OR
      NEW.author_membership_id IS DISTINCT FROM OLD.author_membership_id) THEN
    RAISE EXCEPTION 'discussion author and scope are immutable'
      USING ERRCODE = '23514';
  END IF;
  SELECT offering_period.college_id,
         department.college_id,
         offering.id,
         content.delivery_id,
         delivery.offering_id,
         section_period.college_id,
         offering.cohort_id, offering.academic_period_id,
         section_row.cohort_id, section_row.academic_period_id
    INTO content_period_college_id,
         course_department_college_id,
         content_offering_id,
         content_delivery_id,
         delivery_offering_id,
         delivery_section_period_college_id,
         offering_cohort_id, offering_period_id,
         section_cohort_id, section_period_id
  FROM lesson_contents content
  JOIN course_lessons lesson ON lesson.id = content.lesson_id
  JOIN course_learning_paths path ON path.id = lesson.learning_path_id
  JOIN course_offerings offering ON offering.id = path.offering_id
  JOIN academic_periods offering_period ON offering_period.id = offering.academic_period_id
  JOIN courses course_row ON course_row.id = offering.course_id
  JOIN departments department ON department.id = course_row.department_id
  LEFT JOIN course_section_deliveries delivery ON delivery.id = content.delivery_id
  LEFT JOIN sections section_row ON section_row.id = delivery.section_id
  LEFT JOIN academic_periods section_period ON section_period.id = section_row.academic_period_id
  WHERE content.id = NEW.lesson_content_id;

  SELECT membership.college_id INTO author_college_id
  FROM college_memberships membership
  WHERE membership.id = NEW.author_membership_id;

  IF content_period_college_id IS NULL
     OR course_department_college_id IS NULL
     OR author_college_id IS NULL
     OR content_period_college_id IS DISTINCT FROM course_department_college_id
     OR content_period_college_id IS DISTINCT FROM author_college_id
     OR content_period_college_id IS DISTINCT FROM NEW.college_id
     OR (content_delivery_id IS NOT NULL AND
       (delivery_offering_id IS NULL
        OR delivery_offering_id IS DISTINCT FROM content_offering_id
        OR delivery_section_period_college_id IS DISTINCT FROM content_period_college_id
        OR section_cohort_id IS DISTINCT FROM offering_cohort_id
        OR section_period_id IS DISTINCT FROM offering_period_id)) THEN
    RAISE EXCEPTION 'lesson discussion violates course/content/author college boundary'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.resolved_by_membership_id IS NOT NULL THEN
    SELECT membership.college_id INTO resolver_college_id
    FROM college_memberships membership
    WHERE membership.id = NEW.resolved_by_membership_id;

    IF resolver_college_id IS NULL
       OR resolver_college_id IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'lesson discussion resolver violates college boundary'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT u.display_name,
           COALESCE(NULLIF(btrim(lp.registration_number), ''),
                    NULLIF(btrim(lp.roll_number), ''), u.display_name)
      INTO trusted_profile_name, trusted_unique_name
      FROM college_memberships m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN learner_profiles lp ON lp.membership_id = m.id
      WHERE m.id = NEW.author_membership_id;
    NEW.author_unique_name_snapshot := trusted_unique_name;
    NEW.author_profile_name_snapshot := trusted_profile_name;
  ELSE
    NEW.author_unique_name_snapshot := OLD.author_unique_name_snapshot;
    NEW.author_profile_name_snapshot := OLD.author_profile_name_snapshot;
  END IF;
  RETURN NEW;
END;
$db05_lesson_discussions_college$;

--> statement-breakpoint
CREATE TRIGGER db05_lesson_discussions_tenant_before_write
BEFORE INSERT OR UPDATE ON lesson_content_discussions
FOR EACH ROW EXECUTE FUNCTION db05_lesson_discussions_tenant_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db05_block_discussed_content_reparent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM lesson_content_discussions d
              WHERE d.lesson_content_id = OLD.id) THEN
    RAISE EXCEPTION 'cannot reparent content with lesson discussions'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db05_discussed_content_no_reparent
BEFORE UPDATE OF lesson_id, delivery_id ON lesson_contents
FOR EACH ROW WHEN (OLD.lesson_id IS DISTINCT FROM NEW.lesson_id
                    OR OLD.delivery_id IS DISTINCT FROM NEW.delivery_id)
EXECUTE FUNCTION db05_block_discussed_content_reparent();

--> statement-breakpoint
-- Per-content stable historical sequence, independent from delivery chat order.
CREATE INDEX IF NOT EXISTS lesson_content_discussions_content_sequence_idx
  ON lesson_content_discussions(lesson_content_id,sequence,id)
  WHERE deleted_at IS NULL;
