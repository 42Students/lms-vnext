-- DB-014 forward-only retention: close accidental ON DELETE CASCADE erasure of
-- operational, learning, placement and communication evidence. Keep existing
-- FK definitions/snapshots unchanged; draft-only parents without these children
-- remain deletable. An explicit authorized purge requires a separate design.
-- PostgreSQL's parent DELETE row lock serializes concurrent FK child INSERTs;
-- do not disable triggers, trust app-only checks, or alter the existing FKs.
CREATE FUNCTION db14_cascade_retention_delete_guard()
RETURNS trigger LANGUAGE plpgsql AS $db14_cascade_retention_delete$
DECLARE retained_child boolean;
BEGIN
  IF TG_NARGS <> 2 THEN
    RAISE EXCEPTION 'DB014 retention trigger misconfigured' USING ERRCODE='23514';
  END IF;
  EXECUTE format(
    'SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I = $1)',
    TG_ARGV[0], TG_ARGV[1]
  ) INTO retained_child USING OLD.id;
  IF retained_child THEN
    RAISE EXCEPTION 'DB014 retention forbids deleting %.% while % references it',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_ARGV[0]
      USING ERRCODE='23514';
  END IF;
  RETURN OLD;
END;
$db14_cascade_retention_delete$;
--> statement-breakpoint
CREATE FUNCTION db14_cascade_retention_truncate_guard()
RETURNS trigger LANGUAGE plpgsql AS $db14_cascade_retention_truncate$
BEGIN
  RAISE EXCEPTION 'DB014 retention forbids TRUNCATE on %.%',
    TG_TABLE_SCHEMA, TG_TABLE_NAME USING ERRCODE='23514';
END;
$db14_cascade_retention_truncate$;
--> statement-breakpoint
-- 01/11 submitted evidence / receipt links: assignment_submission_links.submission_id -> assignment_submissions.id
CREATE TRIGGER db14_cascade_retention_01 BEFORE DELETE ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('assignment_submission_links','submission_id');
--> statement-breakpoint
-- 02/11 marked learner attendance: attendance_records.schedule_event_id -> section_schedule_events.id
CREATE TRIGGER db14_cascade_retention_02 BEFORE DELETE ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('attendance_records','schedule_event_id');
--> statement-breakpoint
-- 03/11 session marking record: attendance_sessions.schedule_event_id -> section_schedule_events.id
CREATE TRIGGER db14_cascade_retention_03 BEFORE DELETE ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('attendance_sessions','schedule_event_id');
--> statement-breakpoint
-- 04/11 classroom message history: course_discussion_messages.delivery_id -> course_section_deliveries.id
CREATE TRIGGER db14_cascade_retention_04 BEFORE DELETE ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('course_discussion_messages','delivery_id');
--> statement-breakpoint
-- 05/11 placement announcement read receipt: placement_cell_announcement_reads.announcement_id -> announcements.id
CREATE TRIGGER db14_cascade_retention_05 BEFORE DELETE ON announcements
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('placement_cell_announcement_reads','announcement_id');
--> statement-breakpoint
-- 06/11 placement announcement read receipt: placement_cell_announcement_reads.college_id -> colleges.id
CREATE TRIGGER db14_cascade_retention_06 BEFORE DELETE ON colleges
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('placement_cell_announcement_reads','college_id');
--> statement-breakpoint
-- 07/11 drive day coordinator assignment: placement_drive_day_coordinator_assignments.job_id -> placement_jobs.id
CREATE TRIGGER db14_cascade_retention_07 BEFORE DELETE ON placement_jobs
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('placement_drive_day_coordinator_assignments','job_id');
--> statement-breakpoint
-- 08/11 drive day coordinator assignment: placement_drive_day_coordinator_assignments.learner_membership_id -> college_memberships.id
CREATE TRIGGER db14_cascade_retention_08 BEFORE DELETE ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('placement_drive_day_coordinator_assignments','learner_membership_id');
--> statement-breakpoint
-- 09/11 drive day attendance evidence: placement_round_attendance.application_id -> placement_applications.id
CREATE TRIGGER db14_cascade_retention_09 BEFORE DELETE ON placement_applications
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('placement_round_attendance','application_id');
--> statement-breakpoint
-- 10/11 drive day attendance evidence: placement_round_attendance.round_id -> placement_job_rounds.id
CREATE TRIGGER db14_cascade_retention_10 BEFORE DELETE ON placement_job_rounds
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('placement_round_attendance','round_id');
--> statement-breakpoint
-- 11/11 targeted platform broadcast history: platform_broadcast_targets.broadcast_id -> platform_broadcasts.id
CREATE TRIGGER db14_cascade_retention_11 BEFORE DELETE ON platform_broadcasts
FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard('platform_broadcast_targets','broadcast_id');
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_01 BEFORE TRUNCATE ON assignment_submissions
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_02 BEFORE TRUNCATE ON section_schedule_events
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_03 BEFORE TRUNCATE ON course_section_deliveries
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_04 BEFORE TRUNCATE ON announcements
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_05 BEFORE TRUNCATE ON colleges
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_06 BEFORE TRUNCATE ON placement_jobs
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_07 BEFORE TRUNCATE ON college_memberships
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_08 BEFORE TRUNCATE ON placement_applications
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_09 BEFORE TRUNCATE ON placement_job_rounds
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
--> statement-breakpoint
CREATE TRIGGER db14_truncate_retention_10 BEFORE TRUNCATE ON platform_broadcasts
FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard();
