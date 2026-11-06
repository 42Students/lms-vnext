-- Tenant row-level security (docs/security/central-security-architecture.md, layer L5).
-- INERT by default: app_rls_allows() returns true unless the database setting app.rls_mode = 'enforce'.
-- Enforcement is switched on per environment by a human (docs/security/rls-rollout.md), after the
-- per-table review there. Superusers and BYPASSRLS roles are never subject to policies; the runtime
-- role must not be either (src/db/runtime-principal-policy.ts already enforces that in production).
CREATE OR REPLACE FUNCTION app_rls_allows(row_college uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.rls_mode', true), '') <> 'enforce'
      OR current_setting('app.platform', true) = 'on'
      OR coalesce(current_setting('app.system', true), '') <> ''
      OR row_college = nullif(current_setting('app.college_id', true), '')::uuid
$$;
--> statement-breakpoint
ALTER TABLE "academic_periods" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "academic_periods";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "academic_periods" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "activity_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "activity_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "activity_events" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "announcement_broadcast_colleges" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "announcement_broadcast_colleges";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "announcement_broadcast_colleges" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "announcement_broadcast_learners" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "announcement_broadcast_learners";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "announcement_broadcast_learners" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "announcement_broadcast_reader_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "announcement_broadcast_reader_history";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "announcement_broadcast_reader_history" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "announcements";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "announcements" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "assignment_grade_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "assignment_grade_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "assignment_grade_events" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "assignment_submission_files";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "assignment_submission_files" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "attendance_parent_contacts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "attendance_parent_contacts";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "attendance_parent_contacts" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "attendance_parent_sms_outbox" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "attendance_parent_sms_outbox";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "attendance_parent_sms_outbox" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "attendance_policies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "attendance_policies";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "attendance_policies" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "bug_reports" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "bug_reports";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "bug_reports" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "college_branding" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "college_branding";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "college_branding" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "college_memberships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "college_memberships";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "college_memberships" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "college_signin_policies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "college_signin_policies";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "college_signin_policies" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "data_import_batches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "data_import_batches";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "data_import_batches" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "departments";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "departments" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "elective_slots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "elective_slots";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "elective_slots" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "identity_auth_attempts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "identity_auth_attempts";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "identity_auth_attempts" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "identity_preuser_challenges" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "identity_preuser_challenges";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "identity_preuser_challenges" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "inbound_mail_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "inbound_mail_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "inbound_mail_messages" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "learner_import_batch_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "learner_import_batch_members";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "learner_import_batch_members" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "learner_import_batches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "learner_import_batches";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "learner_import_batches" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "lecture_halls" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "lecture_halls";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "lecture_halls" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "legacy_id_map" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "legacy_id_map";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "legacy_id_map" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "lesson_content_discussions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "lesson_content_discussions";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "lesson_content_discussions" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "lesson_content_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "lesson_content_settings";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "lesson_content_settings" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "lesson_video_assets";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "lesson_video_assets" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "lms_groups" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "lms_groups";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "lms_groups" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "mentor_google_calendar_connections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "mentor_google_calendar_connections";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "mentor_google_calendar_connections" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "messaging_delivery_batches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "messaging_delivery_batches";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "messaging_delivery_batches" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "messaging_sms_delivery_attempts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "messaging_sms_delivery_attempts";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "messaging_sms_delivery_attempts" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "notification_delivery_outbox" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "notification_delivery_outbox";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "notification_delivery_outbox" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "outbound_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "outbound_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "outbound_messages" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_batch_lifecycles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_batch_lifecycles";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_batch_lifecycles" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_batch_registrations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_batch_registrations";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_batch_registrations" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_cell_announcement_reads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_cell_announcement_reads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_cell_announcement_reads" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_college_rules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_college_rules";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_college_rules" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_share_views" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_company_applicant_share_views";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_company_applicant_share_views" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_company_applicant_shares" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_company_applicant_shares";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_company_applicant_shares" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_company_relationships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_company_relationships";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_company_relationships" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_company_visibility_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_company_visibility_settings";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_company_visibility_settings" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_debarments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_debarments";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_debarments" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_drive_day_coordinator_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_drive_day_coordinator_assignments";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_drive_day_coordinator_assignments" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_eligibility_decisions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_eligibility_decisions";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_eligibility_decisions" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_eligibility_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_eligibility_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_eligibility_events" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_external_offers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_external_offers";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_external_offers" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_hr_interview_slots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_hr_interview_slots";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_hr_interview_slots" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_jobs";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_jobs" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_learner_general_requests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_learner_general_requests";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_learner_general_requests" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_learner_round_confirmations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_learner_round_confirmations";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_learner_round_confirmations" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_outside_drive_participants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_outside_drive_participants";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_outside_drive_participants" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_outside_drive_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_outside_drive_records";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_outside_drive_records" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_enquiry_challenges" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_public_enquiry_challenges";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_public_enquiry_challenges" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_enquiry_rate_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_public_enquiry_rate_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_public_enquiry_rate_events" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_join_links" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_public_join_links";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_public_join_links" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_page_content" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_public_page_content";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_public_page_content" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_page_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_public_page_settings";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_public_page_settings" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_public_recruit_enquiries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_public_recruit_enquiries";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_public_recruit_enquiries" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_applicant_notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_recruiter_applicant_notes";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_recruiter_applicant_notes" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_drive_requests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_recruiter_drive_requests";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_recruiter_drive_requests" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_notification_reads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_recruiter_notification_reads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_recruiter_notification_reads" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_recruiter_selection_lists" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_recruiter_selection_lists";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_recruiter_selection_lists" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_saved_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_saved_jobs";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_saved_jobs" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_seasons" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_seasons";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_seasons" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_after_college" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_after_college";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_after_college" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_blocked_dates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_blocked_dates";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_blocked_dates" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_campaign_drafts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_campaign_drafts";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_campaign_drafts" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_college_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_college_settings";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_college_settings" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_company_communication" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_company_communication";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_company_communication" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_company_team_follows" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_company_team_follows";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_company_team_follows" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_company_thread_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_company_thread_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_company_thread_messages" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_company_threads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_company_threads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_company_threads" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_email_campaign_recipients" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_email_campaign_recipients";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_email_campaign_recipients" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_email_campaigns" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_email_campaigns";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_email_campaigns" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_followups" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_followups";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_followups" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_internal_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_internal_messages" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_reads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_internal_reads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_internal_reads" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_thread_participants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_internal_thread_participants";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_internal_thread_participants" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_threads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_internal_threads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_internal_threads" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_job_types" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_job_types";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_job_types" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_lead_activities" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_lead_activities";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_lead_activities" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_leads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_leads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_leads" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_message_threads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_message_threads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_message_threads" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_prep_courses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_prep_courses";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_prep_courses" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_prep_readiness" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_prep_readiness";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_prep_readiness" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_recruiter_saved_views" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_recruiter_saved_views";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_recruiter_saved_views" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_saved_views" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_saved_views";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_saved_views" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_share_links" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_share_links";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_share_links" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_student_notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_student_notes";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_student_notes" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_team_asks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_team_asks";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_team_asks" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_team_away" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_team_away";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_team_away" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_team_everyone_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_team_everyone_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_team_everyone_messages" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_team_everyone_mutes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_team_everyone_mutes";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_team_everyone_mutes" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_team_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_team_members";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_team_members" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_thread_privacy_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_thread_privacy_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_thread_privacy_events" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_trusted_domains" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_trusted_domains";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_trusted_domains" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "placement_tpo_user_preferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "placement_tpo_user_preferences";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "placement_tpo_user_preferences" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "platform_broadcast_targets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "platform_broadcast_targets";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "platform_broadcast_targets" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "profile_verification_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "profile_verification_settings";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "profile_verification_settings" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "project_instances" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "project_instances";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "project_instances" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "project_resource_files" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "project_resource_files";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "project_resource_files" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "project_template_college_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "project_template_college_assignments";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "project_template_college_assignments" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "recruiter_invite_code" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "recruiter_invite_code";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "recruiter_invite_code" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "storage_file_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "storage_file_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "storage_file_events" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "storage_legacy_file_crosswalks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "storage_legacy_file_crosswalks";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "storage_legacy_file_crosswalks" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
--> statement-breakpoint
ALTER TABLE "tenant_domains" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "tenant_domains";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tenant_domains" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
