-- Tenant row-level security for tables that have no college_id but belong to a tenant through a
-- foreign key (SEC-06-003). The policy asks the parent table: a child row is visible when its anchor
-- parent row is visible, and the parent's own policy applies inside that lookup. Anchors are chosen
-- from the live dev catalog, shortest path first (docs/security/assessments/derived-policy-plan.json).
-- INERT unless app.rls_mode = 'enforce', like 0333. Excluded on purpose: users, organizations,
-- colleges, system_roles, identity_device_sessions, membership_roles and the global/infrastructure
-- tables (documented in tables-without-college-id.md).
CREATE OR REPLACE FUNCTION app_rls_bypass() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.rls_mode', true), '') <> 'enforce'
      OR current_setting('app.platform', true) = 'on'
      OR coalesce(current_setting('app.system', true), '') <> ''
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_rls_bypass() TO PUBLIC;
--> statement-breakpoint
ALTER TABLE "assignment_submission_links" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "assignment_submission_links" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "assignment_submission_links";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "assignment_submission_links" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "assignment_submissions" AS p WHERE p."id" = "assignment_submission_links"."submission_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "assignment_submissions" AS p WHERE p."id" = "assignment_submission_links"."submission_id"));
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "assignment_submissions";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "assignment_submissions" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "assignment_submissions"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "assignment_submissions"."membership_id"));
--> statement-breakpoint
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "attendance_records" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "attendance_records";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "attendance_records" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "attendance_records"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "attendance_records"."membership_id"));
--> statement-breakpoint
ALTER TABLE "attendance_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "attendance_sessions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "attendance_sessions";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "attendance_sessions" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "section_schedule_events" AS p WHERE p."id" = "attendance_sessions"."schedule_event_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "section_schedule_events" AS p WHERE p."id" = "attendance_sessions"."schedule_event_id"));
--> statement-breakpoint
ALTER TABLE "bug_report_activities" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "bug_report_activities" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "bug_report_activities";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "bug_report_activities" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "bug_reports" AS p WHERE p."id" = "bug_report_activities"."bug_report_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "bug_reports" AS p WHERE p."id" = "bug_report_activities"."bug_report_id"));
--> statement-breakpoint
ALTER TABLE "bug_report_attachments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "bug_report_attachments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "bug_report_attachments";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "bug_report_attachments" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "bug_reports" AS p WHERE p."id" = "bug_report_attachments"."bug_report_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "bug_reports" AS p WHERE p."id" = "bug_report_attachments"."bug_report_id"));
--> statement-breakpoint
ALTER TABLE "cohort_progression_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cohort_progression_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "cohort_progression_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "cohort_progression_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "cohorts" AS p WHERE p."id" = "cohort_progression_events"."cohort_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "cohorts" AS p WHERE p."id" = "cohort_progression_events"."cohort_id"));
--> statement-breakpoint
ALTER TABLE "cohort_progression_state" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cohort_progression_state" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "cohort_progression_state";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "cohort_progression_state" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "cohorts" AS p WHERE p."id" = "cohort_progression_state"."cohort_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "cohorts" AS p WHERE p."id" = "cohort_progression_state"."cohort_id"));
--> statement-breakpoint
ALTER TABLE "cohorts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cohorts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "cohorts";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "cohorts" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "cohorts"."start_period_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "cohorts"."start_period_id"));
--> statement-breakpoint
ALTER TABLE "course_assignment_materials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_assignment_materials" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_assignment_materials";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_assignment_materials" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_assignments" AS p WHERE p."id" = "course_assignment_materials"."assignment_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_assignments" AS p WHERE p."id" = "course_assignment_materials"."assignment_id"));
--> statement-breakpoint
ALTER TABLE "course_assignment_resources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_assignment_resources" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_assignment_resources";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_assignment_resources" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_assignments" AS p WHERE p."id" = "course_assignment_resources"."assignment_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_assignments" AS p WHERE p."id" = "course_assignment_resources"."assignment_id"));
--> statement-breakpoint
ALTER TABLE "course_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_assignments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_assignments";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_assignments" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_lessons" AS p WHERE p."id" = "course_assignments"."lesson_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_lessons" AS p WHERE p."id" = "course_assignments"."lesson_id"));
--> statement-breakpoint
ALTER TABLE "course_discussion_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_discussion_messages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_discussion_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_discussion_messages" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "course_discussion_messages"."sender_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "course_discussion_messages"."sender_membership_id"));
--> statement-breakpoint
ALTER TABLE "course_learning_paths" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_learning_paths" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_learning_paths";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_learning_paths" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_offerings" AS p WHERE p."id" = "course_learning_paths"."offering_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_offerings" AS p WHERE p."id" = "course_learning_paths"."offering_id"));
--> statement-breakpoint
ALTER TABLE "course_lessons" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_lessons" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_lessons";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_lessons" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_learning_paths" AS p WHERE p."id" = "course_lessons"."learning_path_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_learning_paths" AS p WHERE p."id" = "course_lessons"."learning_path_id"));
--> statement-breakpoint
ALTER TABLE "course_offerings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_offerings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_offerings";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_offerings" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "course_offerings"."academic_period_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "course_offerings"."academic_period_id"));
--> statement-breakpoint
ALTER TABLE "course_quizzes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_quizzes" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_quizzes";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_quizzes" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_lessons" AS p WHERE p."id" = "course_quizzes"."lesson_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_lessons" AS p WHERE p."id" = "course_quizzes"."lesson_id"));
--> statement-breakpoint
ALTER TABLE "course_section_deliveries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_section_deliveries" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_section_deliveries";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_section_deliveries" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_offerings" AS p WHERE p."id" = "course_section_deliveries"."offering_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_offerings" AS p WHERE p."id" = "course_section_deliveries"."offering_id"));
--> statement-breakpoint
ALTER TABLE "course_teaching_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_teaching_assignments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "course_teaching_assignments";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "course_teaching_assignments" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "course_teaching_assignments"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "course_teaching_assignments"."membership_id"));
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "courses" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "courses";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "courses" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "departments" AS p WHERE p."id" = "courses"."department_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "departments" AS p WHERE p."id" = "courses"."department_id"));
--> statement-breakpoint
ALTER TABLE "elective_offerings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "elective_offerings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "elective_offerings";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "elective_offerings" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "elective_offerings"."group_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "elective_offerings"."group_id"));
--> statement-breakpoint
ALTER TABLE "faculty_course_associations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "faculty_course_associations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "faculty_course_associations";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "faculty_course_associations" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "faculty_course_associations"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "faculty_course_associations"."membership_id"));
--> statement-breakpoint
ALTER TABLE "faculty_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "faculty_profiles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "faculty_profiles";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "faculty_profiles" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "faculty_profiles"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "faculty_profiles"."membership_id"));
--> statement-breakpoint
ALTER TABLE "group_backed_class_offerings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "group_backed_class_offerings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "group_backed_class_offerings";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "group_backed_class_offerings" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "group_backed_class_offerings"."academic_period_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "group_backed_class_offerings"."academic_period_id"));
--> statement-breakpoint
ALTER TABLE "identity_email_ownership_proofs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "identity_email_ownership_proofs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "identity_email_ownership_proofs";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "identity_email_ownership_proofs" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "identity_email_verification_links" AS p WHERE p."id" = "identity_email_ownership_proofs"."verification_link_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "identity_email_verification_links" AS p WHERE p."id" = "identity_email_ownership_proofs"."verification_link_id"));
--> statement-breakpoint
ALTER TABLE "in_app_notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "in_app_notifications" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "in_app_notifications";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "in_app_notifications" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "activity_events" AS p WHERE p."id" = "in_app_notifications"."event_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "activity_events" AS p WHERE p."id" = "in_app_notifications"."event_id"));
--> statement-breakpoint
ALTER TABLE "learner_content_progress" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_content_progress" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_content_progress";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_content_progress" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_content_progress"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_content_progress"."membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profile_education_documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profile_education_documents" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profile_education_documents";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profile_education_documents" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_education_documents"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_education_documents"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profile_education_entries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profile_education_entries" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profile_education_entries";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profile_education_entries" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_education_entries"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_education_entries"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profile_identity_summaries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profile_identity_summaries" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profile_identity_summaries";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profile_identity_summaries" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_identity_summaries"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_identity_summaries"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profile_images" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profile_images" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profile_images";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profile_images" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_images"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_images"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profile_import_undo_journal" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profile_import_undo_journal" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profile_import_undo_journal";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profile_import_undo_journal" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_import_undo_journal"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_import_undo_journal"."membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profile_private_document_bindings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profile_private_document_bindings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profile_private_document_bindings";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profile_private_document_bindings" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_private_document_bindings"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_private_document_bindings"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profile_video_intros" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profile_video_intros" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profile_video_intros";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profile_video_intros" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_video_intros"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profile_video_intros"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_profiles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_profiles";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_profiles" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profiles"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_profiles"."membership_id"));
--> statement-breakpoint
ALTER TABLE "learner_program_enrollments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learner_program_enrollments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "learner_program_enrollments";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "learner_program_enrollments" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_program_enrollments"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "learner_program_enrollments"."membership_id"));
--> statement-breakpoint
ALTER TABLE "lesson_content_delivery_sequences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lesson_content_delivery_sequences" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "lesson_content_delivery_sequences";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "lesson_content_delivery_sequences" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_section_deliveries" AS p WHERE p."id" = "lesson_content_delivery_sequences"."delivery_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_section_deliveries" AS p WHERE p."id" = "lesson_content_delivery_sequences"."delivery_id"));
--> statement-breakpoint
ALTER TABLE "lesson_content_materials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lesson_content_materials" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "lesson_content_materials";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "lesson_content_materials" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lesson_contents" AS p WHERE p."id" = "lesson_content_materials"."lesson_content_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lesson_contents" AS p WHERE p."id" = "lesson_content_materials"."lesson_content_id"));
--> statement-breakpoint
ALTER TABLE "lesson_contents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lesson_contents" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "lesson_contents";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "lesson_contents" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_lessons" AS p WHERE p."id" = "lesson_contents"."lesson_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_lessons" AS p WHERE p."id" = "lesson_contents"."lesson_id"));
--> statement-breakpoint
ALTER TABLE "lms_group_member_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lms_group_member_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "lms_group_member_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "lms_group_member_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "lms_group_member_events"."group_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "lms_group_member_events"."group_id"));
--> statement-breakpoint
ALTER TABLE "lms_group_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lms_group_members" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "lms_group_members";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "lms_group_members" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "lms_group_members"."group_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "lms_group_members"."group_id"));
--> statement-breakpoint
ALTER TABLE "lms_group_rules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lms_group_rules" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "lms_group_rules";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "lms_group_rules" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "lms_group_rules"."group_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "lms_groups" AS p WHERE p."id" = "lms_group_rules"."group_id"));
--> statement-breakpoint
ALTER TABLE "messaging_delivery_receipts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "messaging_delivery_receipts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "messaging_delivery_receipts";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "messaging_delivery_receipts" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "messaging_delivery_batches" AS p WHERE p."id" = "messaging_delivery_receipts"."batch_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "messaging_delivery_batches" AS p WHERE p."id" = "messaging_delivery_receipts"."batch_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_legacy_auto_screening" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_legacy_auto_screening" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_legacy_auto_screening";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_legacy_auto_screening" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_legacy_auto_screening"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_legacy_auto_screening"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_legacy_status_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_legacy_status_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_legacy_status_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_legacy_status_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_legacy_status_history"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_legacy_status_history"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_notes" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_notes";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_notes" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_notes"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_notes"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_private_artifacts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_private_artifacts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_private_artifacts";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_private_artifacts" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_private_artifacts"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_private_artifacts"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_round_exceptions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_round_exceptions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_round_exceptions";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_round_exceptions" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_round_exceptions"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_round_exceptions"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_screening_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_screening_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_screening_history"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_screening_history"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_screenings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_screenings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_screenings";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_screenings" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_screenings"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_screenings"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_application_status_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_application_status_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_application_status_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_application_status_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_status_history"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_application_status_history"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_applications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_applications" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_applications";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_applications" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_applications"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_applications"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_batch_registration_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_batch_registration_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_batch_registration_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_batch_registration_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_batch_registrations" AS p WHERE p."id" = "placement_batch_registration_events"."registration_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_batch_registrations" AS p WHERE p."id" = "placement_batch_registration_events"."registration_id"));
--> statement-breakpoint
ALTER TABLE "placement_candidate_academic_evidence" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_candidate_academic_evidence" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_candidate_academic_evidence";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_candidate_academic_evidence" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "placement_candidate_academic_evidence"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "placement_candidate_academic_evidence"."membership_id"));
--> statement-breakpoint
ALTER TABLE "placement_candidate_preferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_candidate_preferences" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_candidate_preferences";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_candidate_preferences" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "placement_candidate_preferences"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "placement_candidate_preferences"."membership_id"));
--> statement-breakpoint
ALTER TABLE "placement_college_application_stage_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_college_application_stage_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_college_application_stage_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_college_application_stage_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_college_application_stages" AS p WHERE p."id" = "placement_college_application_stage_history"."stage_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_college_application_stages" AS p WHERE p."id" = "placement_college_application_stage_history"."stage_id"));
--> statement-breakpoint
ALTER TABLE "placement_college_application_stages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_college_application_stages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_college_application_stages";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_college_application_stages" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_college_application_stages"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_college_application_stages"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_college_interviews" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_college_interviews" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_college_interviews";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_college_interviews" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_college_interviews"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_college_interviews"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_company_share_selections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_company_share_selections" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_company_share_selections";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_company_share_selections" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_company_applicant_shares" AS p WHERE p."id" = "placement_company_share_selections"."share_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_company_applicant_shares" AS p WHERE p."id" = "placement_company_share_selections"."share_id"));
--> statement-breakpoint
ALTER TABLE "placement_debarment_drive_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_debarment_drive_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_debarment_drive_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_debarment_drive_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_debarments" AS p WHERE p."id" = "placement_debarment_drive_events"."debarment_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_debarments" AS p WHERE p."id" = "placement_debarment_drive_events"."debarment_id"));
--> statement-breakpoint
ALTER TABLE "placement_debarment_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_debarment_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_debarment_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_debarment_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_debarments" AS p WHERE p."id" = "placement_debarment_history"."debarment_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_debarments" AS p WHERE p."id" = "placement_debarment_history"."debarment_id"));
--> statement-breakpoint
ALTER TABLE "placement_drive_change_request_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_drive_change_request_messages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_drive_change_request_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_drive_change_request_messages" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_drive_change_requests" AS p WHERE p."id" = "placement_drive_change_request_messages"."request_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_drive_change_requests" AS p WHERE p."id" = "placement_drive_change_request_messages"."request_id"));
--> statement-breakpoint
ALTER TABLE "placement_drive_change_requests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_drive_change_requests" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_drive_change_requests";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_drive_change_requests" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_drive_change_requests"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_drive_change_requests"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_drive_selections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_drive_selections" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_drive_selections";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_drive_selections" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_drive_selections"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_drive_selections"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_eligibility_overrides" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_eligibility_overrides" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_eligibility_overrides";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_eligibility_overrides" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_eligibility_overrides"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_eligibility_overrides"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_external_offer_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_external_offer_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_external_offer_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_external_offer_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_external_offers" AS p WHERE p."id" = "placement_external_offer_events"."offer_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_external_offers" AS p WHERE p."id" = "placement_external_offer_events"."offer_id"));
--> statement-breakpoint
ALTER TABLE "placement_interview_private_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_interview_private_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_interview_private_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_interview_private_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_interview_private_events"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_interview_private_events"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_job_diversity_outreach" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_job_diversity_outreach" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_job_diversity_outreach";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_job_diversity_outreach" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_diversity_outreach"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_diversity_outreach"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_job_eligibility_policies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_job_eligibility_policies" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_job_eligibility_policies";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_job_eligibility_policies" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_eligibility_policies"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_eligibility_policies"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_job_role_options" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_job_role_options" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_job_role_options";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_job_role_options" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_role_options"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_role_options"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_job_round_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_job_round_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_job_round_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_job_round_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_job_rounds" AS p WHERE p."id" = "placement_job_round_events"."round_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_job_rounds" AS p WHERE p."id" = "placement_job_round_events"."round_id"));
--> statement-breakpoint
ALTER TABLE "placement_job_rounds" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_job_rounds" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_job_rounds";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_job_rounds" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_rounds"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_job_rounds"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_joining_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_joining_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_joining_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_joining_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_offers" AS p WHERE p."id" = "placement_joining_history"."offer_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_offers" AS p WHERE p."id" = "placement_joining_history"."offer_id"));
--> statement-breakpoint
ALTER TABLE "placement_joining_outcomes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_joining_outcomes" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_joining_outcomes";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_joining_outcomes" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_offers" AS p WHERE p."id" = "placement_joining_outcomes"."offer_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_offers" AS p WHERE p."id" = "placement_joining_outcomes"."offer_id"));
--> statement-breakpoint
ALTER TABLE "placement_learner_general_request_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_learner_general_request_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_learner_general_request_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_learner_general_request_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_learner_general_requests" AS p WHERE p."id" = "placement_learner_general_request_events"."request_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_learner_general_requests" AS p WHERE p."id" = "placement_learner_general_request_events"."request_id"));
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_learner_requests" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_learner_requests";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_learner_requests" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "placement_learner_requests"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "placement_learner_requests"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "placement_legacy_application_status_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_legacy_application_status_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_legacy_application_status_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_legacy_application_status_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_legacy_application_status_events"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_legacy_application_status_events"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_offer_status_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_offer_status_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_offers" AS p WHERE p."id" = "placement_offer_status_history"."offer_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_offers" AS p WHERE p."id" = "placement_offer_status_history"."offer_id"));
--> statement-breakpoint
ALTER TABLE "placement_offers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_offers" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_offers";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_offers" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_offers"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_offers"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_join_challenges" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_public_join_challenges" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_public_join_challenges";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_public_join_challenges" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_public_join_links" AS p WHERE p."id" = "placement_public_join_challenges"."link_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_public_join_links" AS p WHERE p."id" = "placement_public_join_challenges"."link_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_join_rate_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_public_join_rate_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_public_join_rate_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_public_join_rate_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_public_join_links" AS p WHERE p."id" = "placement_public_join_rate_events"."link_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_public_join_links" AS p WHERE p."id" = "placement_public_join_rate_events"."link_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_college_grants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_college_grants" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_recruiter_college_grants";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_recruiter_college_grants" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_company_relationships" AS p WHERE p."id" = "placement_recruiter_college_grants"."company_relationship_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_company_relationships" AS p WHERE p."id" = "placement_recruiter_college_grants"."company_relationship_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_inbound_email_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_inbound_email_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_recruiter_inbound_email_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_recruiter_inbound_email_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_message_threads" AS p WHERE p."id" = "placement_recruiter_inbound_email_events"."thread_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_message_threads" AS p WHERE p."id" = "placement_recruiter_inbound_email_events"."thread_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_message_mail_state" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_message_mail_state" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_recruiter_message_mail_state";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_recruiter_message_mail_state" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_message_threads" AS p WHERE p."id" = "placement_recruiter_message_mail_state"."thread_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_message_threads" AS p WHERE p."id" = "placement_recruiter_message_mail_state"."thread_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_private_reviews" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_private_reviews" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_recruiter_private_reviews";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_recruiter_private_reviews" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_recruiter_private_reviews"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_recruiter_private_reviews"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_selection_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_selection_items" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_recruiter_selection_items";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_recruiter_selection_items" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_recruiter_selection_items"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_recruiter_selection_items"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_round_attendance" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_round_attendance" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_round_attendance";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_round_attendance" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_round_attendance"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_round_attendance"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_round_candidate_slots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_round_candidate_slots" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_round_candidate_slots";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_round_candidate_slots" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_round_candidate_slots"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_round_candidate_slots"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_round_results" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_round_results" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_round_results";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_round_results" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_round_results"."application_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_applications" AS p WHERE p."id" = "placement_round_results"."application_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_application_stages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_tpo_application_stages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_tpo_application_stages";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_tpo_application_stages" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_tpo_application_stages"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_tpo_application_stages"."job_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_tpo_messages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_tpo_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_tpo_messages" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_message_threads" AS p WHERE p."id" = "placement_tpo_messages"."thread_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_message_threads" AS p WHERE p."id" = "placement_tpo_messages"."thread_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_notice_audiences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_tpo_notice_audiences" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_tpo_notice_audiences";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_tpo_notice_audiences" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "announcements" AS p WHERE p."id" = "placement_tpo_notice_audiences"."announcement_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "announcements" AS p WHERE p."id" = "placement_tpo_notice_audiences"."announcement_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_notice_recipients" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_tpo_notice_recipients" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_tpo_notice_recipients";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_tpo_notice_recipients" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "announcements" AS p WHERE p."id" = "placement_tpo_notice_recipients"."announcement_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "announcements" AS p WHERE p."id" = "placement_tpo_notice_recipients"."announcement_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_share_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_tpo_share_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_tpo_share_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_tpo_share_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_share_links" AS p WHERE p."id" = "placement_tpo_share_events"."share_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_tpo_share_links" AS p WHERE p."id" = "placement_tpo_share_events"."share_id"));
--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "placement_waitlist_promotions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "placement_waitlist_promotions";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "placement_waitlist_promotions" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_waitlist_promotions"."job_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "placement_jobs" AS p WHERE p."id" = "placement_waitlist_promotions"."job_id"));
--> statement-breakpoint
ALTER TABLE "profile_private_document_receipts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "profile_private_document_receipts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "profile_private_document_receipts";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "profile_private_document_receipts" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_private_document_receipts"."owning_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_private_document_receipts"."owning_membership_id"));
--> statement-breakpoint
ALTER TABLE "profile_verification_academic_marks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "profile_verification_academic_marks" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "profile_verification_academic_marks";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "profile_verification_academic_marks" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_verification_academic_marks"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_verification_academic_marks"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "profile_verification_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "profile_verification_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "profile_verification_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "profile_verification_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "profile_verifications" AS p WHERE p."id" = "profile_verification_events"."verification_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "profile_verifications" AS p WHERE p."id" = "profile_verification_events"."verification_id"));
--> statement-breakpoint
ALTER TABLE "profile_verification_tpo_grants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "profile_verification_tpo_grants" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "profile_verification_tpo_grants";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "profile_verification_tpo_grants" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_verification_tpo_grants"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_verification_tpo_grants"."membership_id"));
--> statement-breakpoint
ALTER TABLE "profile_verifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "profile_verifications" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "profile_verifications";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "profile_verifications" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_verifications"."learner_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "profile_verifications"."learner_membership_id"));
--> statement-breakpoint
ALTER TABLE "program_term_courses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "program_term_courses" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "program_term_courses";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "program_term_courses" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "courses" AS p WHERE p."id" = "program_term_courses"."course_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "courses" AS p WHERE p."id" = "program_term_courses"."course_id"));
--> statement-breakpoint
ALTER TABLE "program_terms" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "program_terms" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "program_terms";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "program_terms" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "programs" AS p WHERE p."id" = "program_terms"."program_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "programs" AS p WHERE p."id" = "program_terms"."program_id"));
--> statement-breakpoint
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "programs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "programs";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "programs" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "departments" AS p WHERE p."id" = "programs"."department_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "departments" AS p WHERE p."id" = "programs"."department_id"));
--> statement-breakpoint
ALTER TABLE "project_delivery_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_delivery_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_delivery_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_delivery_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_delivery_events"."actor_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_delivery_events"."actor_membership_id"));
--> statement-breakpoint
ALTER TABLE "project_evaluation_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_evaluation_items" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_evaluation_items";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_evaluation_items" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_evaluations" AS p WHERE p."id" = "project_evaluation_items"."evaluation_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_evaluations" AS p WHERE p."id" = "project_evaluation_items"."evaluation_id"));
--> statement-breakpoint
ALTER TABLE "project_evaluations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_evaluations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_evaluations";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_evaluations" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_evaluations"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_evaluations"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_meeting_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_meeting_history" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_meeting_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_meeting_history" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_meeting_history"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_meeting_history"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_meetings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_meetings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_meetings";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_meetings" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_meetings"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_meetings"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_members" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_members";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_members" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_members"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_members"."membership_id"));
--> statement-breakpoint
ALTER TABLE "project_releases" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_releases" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_releases";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_releases" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_releases"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_releases"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_resource_audit" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_resource_audit" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_resource_audit";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_resource_audit" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_resource_audit"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_resource_audit"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_resources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_resources" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_resources";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_resources" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_resources"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_resources"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_sprints" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_sprints" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_sprints";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_sprints" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_sprints"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_sprints"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_submission_reviews" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_submission_reviews" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_submission_reviews";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_submission_reviews" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_submission_reviews"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_submission_reviews"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_submissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_submissions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_submissions";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_submissions" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_submissions"."created_by_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_submissions"."created_by_membership_id"));
--> statement-breakpoint
ALTER TABLE "project_task_comments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_task_comments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_task_comments";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_task_comments" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_task_comments"."author_membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "project_task_comments"."author_membership_id"));
--> statement-breakpoint
ALTER TABLE "project_task_submissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_task_submissions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_task_submissions";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_task_submissions" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_task_submissions"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_task_submissions"."project_id"));
--> statement-breakpoint
ALTER TABLE "project_tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project_tasks" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "project_tasks";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "project_tasks" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_tasks"."project_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "project_instances" AS p WHERE p."id" = "project_tasks"."project_id"));
--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "quiz_attempt_answers";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "quiz_attempt_answers" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "quiz_attempts" AS p WHERE p."id" = "quiz_attempt_answers"."attempt_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "quiz_attempts" AS p WHERE p."id" = "quiz_attempt_answers"."attempt_id"));
--> statement-breakpoint
ALTER TABLE "quiz_attempts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "quiz_attempts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "quiz_attempts";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "quiz_attempts" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "quiz_attempts"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "quiz_attempts"."membership_id"));
--> statement-breakpoint
ALTER TABLE "quiz_options" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "quiz_options" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "quiz_options";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "quiz_options" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "quiz_questions" AS p WHERE p."id" = "quiz_options"."question_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "quiz_questions" AS p WHERE p."id" = "quiz_options"."question_id"));
--> statement-breakpoint
ALTER TABLE "quiz_questions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "quiz_questions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "quiz_questions";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "quiz_questions" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_quizzes" AS p WHERE p."id" = "quiz_questions"."quiz_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_quizzes" AS p WHERE p."id" = "quiz_questions"."quiz_id"));
--> statement-breakpoint
ALTER TABLE "section_enrollments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "section_enrollments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "section_enrollments";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "section_enrollments" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "section_enrollments"."academic_period_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "section_enrollments"."academic_period_id"));
--> statement-breakpoint
ALTER TABLE "section_faculty_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "section_faculty_assignments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "section_faculty_assignments";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "section_faculty_assignments" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "section_faculty_assignments"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "section_faculty_assignments"."membership_id"));
--> statement-breakpoint
ALTER TABLE "section_schedule_event_courses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "section_schedule_event_courses" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "section_schedule_event_courses";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "section_schedule_event_courses" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_section_deliveries" AS p WHERE p."id" = "section_schedule_event_courses"."delivery_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "course_section_deliveries" AS p WHERE p."id" = "section_schedule_event_courses"."delivery_id"));
--> statement-breakpoint
ALTER TABLE "section_schedule_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "section_schedule_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "section_schedule_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "section_schedule_events" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "sections" AS p WHERE p."id" = "section_schedule_events"."section_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "sections" AS p WHERE p."id" = "section_schedule_events"."section_id"));
--> statement-breakpoint
ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sections" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "sections";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "sections" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "sections"."academic_period_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "academic_periods" AS p WHERE p."id" = "sections"."academic_period_id"));
