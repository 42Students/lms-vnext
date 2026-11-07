# Personal data inventory by table (SEC-22), generated 2026-11-08

Generated from the column names of the 278 tables in the dev database catalog (`scripts`-free: one read-only query, then pattern classes below). It is an inventory of WHERE personal and sensitive columns live, by name only; it holds no values. Name patterns can miss a column with a neutral name and can flag one that is harmless, so every row needs an owner review before it is a record of processing.

Classes: contact (phone, email), identity (names, birth date, gender, government or roll numbers), address, family, documents-media (resumes, photos, files), academic (marks, attendance), employment (offers, pay), device-network (IP tag, user agent), credentials-secrets (digests, hashes, tokens; stored as digests or hashes, not plain).

Tables with at least one matching column: 96 of 278. Tables per class: credentials-secrets 33, device-network 3, contact 15, academic 16, documents-media 23, identity 9, address 8, family 2, employment 14.

| Table | Matching columns |
|---|---|
| `activity_events` | credentials-secrets: `source_ip_hash`; device-network: `source_user_agent_family` |
| `announcement_broadcast_groups` | contact: `send_email` |
| `assignment_grade_events` | academic: `legacy_grade_audit_id`, `previous_grade_published`, `new_grade_published` |
| `assignment_submission_files` | documents-media: `object_key`; credentials-secrets: `upload_token_hash` |
| `assignment_submissions` | academic: `grade_published` |
| `attendance_parent_contacts` | contact: `phone_e164` |
| `attendance_record_events` | academic: `attendance_record_id` |
| `attendance_records` | academic: `legacy_attendance_status` |
| `attendance_sessions` | academic: `legacy_attendance_marked_at` |
| `bug_tracker_access` | identity: `display_name`; credentials-secrets: `token_hash` |
| `bug_tracker_sessions` | credentials-secrets: `token_hash` |
| `cohort_progression_events` | address: `state_version` |
| `college_branding` | contact: `login_background_url_mobile`, `support_email`, `support_phone` |
| `colleges` | documents-media: `logo_object_path`; address: `address_line1`, `address_line2`, `landmark`, `city`, `state`, `country` |
| `course_assignment_materials` | credentials-secrets: `upload_token_hash` |
| `course_assignment_resources` | documents-media: `private_object_key` |
| `courses` | family: `parent_course_id`; documents-media: `image_url`, `image_url_learning_path` |
| `faculty_avatar_cleanup_queue` | documents-media: `old_object_key` |
| `faculty_profiles` | documents-media: `profile_document`, `profile_document_version`, `avatar_object_path` |
| `identity_auth_attempts` | contact: `email_code_mac`, `email_code_expires_at`, `email_code_sent_at`; device-network: `ip_tag` |
| `identity_device_sessions` | credentials-secrets: `credential_digest`; device-network: `device_name`, `user_agent`, `ip_address`; address: `ip_address` |
| `identity_email_ownership_proofs` | contact: `email_fingerprint`, `email_key_version` |
| `identity_email_verification_links` | contact: `email_fingerprint`, `email_key_version`; credentials-secrets: `token_digest` |
| `inbound_mail_messages` | address: `from_address`, `to_address` |
| `learner_profile_education_entries` | academic: `grade_obtained`, `max_grade`, `legacy_score`, `legacy_grade_raw`, `legacy_max_grade_raw` |
| `learner_profile_identity_summaries` | identity: `aadhaar_last4`, `pan_last4` |
| `learner_profile_images` | documents-media: `legacy_image_id`, `legacy_image_public_key`, `legacy_image_url` |
| `learner_profiles` | identity: `roll_number`; documents-media: `profile_document`, `resume_object_path`, `profile_document_version`, `avatar_object_path`, `resume_scan_status`, `resume_verified_at` |
| `legacy_id_map` | credentials-secrets: `source_hash` |
| `lesson_content_discussions` | family: `legacy_parent_discussion_id`, `parent_discussion_id`; documents-media: `attachment_object_key` |
| `lesson_content_materials` | credentials-secrets: `upload_token_hash` |
| `lesson_video_assets` | documents-media: `object_key`, `thumbnail_object_key`; credentials-secrets: `upload_token_hash`, `thumbnail_upload_token_hash` |
| `lms_group_member_events` | address: `from_state`, `to_state` |
| `lms_group_members` | address: `state`; identity: `legacy_roll_number` |
| `log_alert_observed_events` | credentials-secrets: `event_hash` |
| `log_alert_signature_accounts` | credentials-secrets: `account_key_hash` |
| `log_alert_signatures` | credentials-secrets: `signature_hash` |
| `log_alert_states` | address: `state_key`; credentials-secrets: `poll_page_token`, `last_digest_day` |
| `mentor_google_calendar_connections` | credentials-secrets: `refresh_token_ciphertext` |
| `outbound_global_email_suppressions` | credentials-secrets: `recipient_hash` |
| `outbound_messages` | credentials-secrets: `recipient_hash`, `global_email_hash_commitment`, `request_digest`; contact: `global_email_hash_commitment` |
| `outbound_suppressions` | credentials-secrets: `recipient_hash` |
| `placement_application_legacy_auto_screening` | academic: `score` |
| `placement_application_private_artifacts` | documents-media: `resume_object_path`, `legacy_resume_url`, `resume_history`, `assessment_object_path` |
| `placement_candidate_academic_evidence` | academic: `cgpa_hundredths` |
| `placement_candidate_preferences` | employment: `minimum_annual_ctc_inr` |
| `placement_companies` | documents-media: `logo_object_path` |
| `placement_company_applicant_shares` | credentials-secrets: `token_hash`, `code_hash` |
| `placement_company_relationships` | contact: `contact_email`, `contact_phone` |
| `placement_company_visibility_settings` | academic: `show_cgpa_exact`, `show_attendance` |
| `placement_drive_selections` | employment: `annual_ctc_inr`, `released_offer_id` |
| `placement_external_offer_events` | employment: `offer_id` |
| `placement_external_offers` | employment: `ctc_lpa`; documents-media: `private_letter_object_path` |
| `placement_job_diversity_outreach` | identity: `target_gender` |
| `placement_job_eligibility_policies` | academic: `min_cgpa_hundredths` |
| `placement_job_role_options` | employment: `minimum_annual_ctc_inr`, `maximum_annual_ctc_inr`, `ctc_lpa`, `stipend_per_month_inr`, `stipend_months` |
| `placement_jobs` | employment: `minimum_annual_ctc_inr`, `maximum_annual_ctc_inr`, `ctc_lpa`, `fixed_ctc_lpa`, `variable_ctc_lpa`, `stipend_per_month_inr`; documents-media: `job_description_object_path` |
| `placement_joining_history` | employment: `offer_id` |
| `placement_joining_outcomes` | employment: `offer_id` |
| `placement_learner_requests` | employment: `offer_id` |
| `placement_offer_status_history` | employment: `offer_id` |
| `placement_offers` | employment: `annual_ctc_inr`, `offer_letter_url`, `offer_letter_attached_at`, `offer_letter_attached_by_user_id`, `legacy_ctc_lpa`, `legacy_offer_id`; documents-media: `offer_letter_object_path` |
| `placement_public_enquiry_challenges` | contact: `work_email`; credentials-secrets: `code_hash` |
| `placement_public_enquiry_rate_events` | credentials-secrets: `ip_hash` |
| `placement_public_join_challenges` | contact: `work_email`; credentials-secrets: `code_hash` |
| `placement_public_join_links` | credentials-secrets: `token_hash`, `legacy_nonce_digest` |
| `placement_public_join_rate_events` | credentials-secrets: `ip_hash` |
| `placement_public_page_settings` | employment: `offer_count` |
| `placement_public_recruit_enquiries` | identity: `full_name` |
| `placement_recruiter_inbound_email_events` | credentials-secrets: `message_id_hash` |
| `placement_recruiter_message_mail_state` | credentials-secrets: `reply_token_hash`, `reply_token_expires_at` |
| `placement_recruiter_public_contacts` | contact: `phone_digits` |
| `placement_recruiter_selection_lists` | employment: `ctc_lpa` |
| `placement_round_results` | academic: `score_percent` |
| `placement_tpo_college_settings` | contact: `invite_email_template`, `reminder_email_template`, `whatsapp_template`, `student_email_wording`, `email_signature`, `notify_drive_open_email`; documents-media: `logo_object_path` |
| `placement_tpo_leads` | contact: `email_norm`, `phone_norm`; documents-media: `company_logo_object_path`; credentials-secrets: `invite_token_hash` |
| `placement_tpo_message_threads` | credentials-secrets: `reply_token_hash` |
| `placement_tpo_share_links` | credentials-secrets: `token_hash`, `code_hash`, `email_code_hash`; contact: `recipient_email`, `email_code_hash`, `email_code_expires_at` |
| `placement_tpo_user_preferences` | credentials-secrets: `morning_digest` |
| `placement_waitlist_promotions` | employment: `offer_id` |
| `profile_private_document_receipts` | documents-media: `private_object_key` |
| `profile_verification_academic_marks` | academic: `original_grade`, `percentage_basis_points`, `legacy_earned_marks`, `legacy_cgpa` |
| `profile_verification_settings` | academic: `cgpa_to_pct` |
| `project_delivery_events` | documents-media: `legacy_attachment_url` |
| `project_evaluation_items` | academic: `score`, `max_score` |
| `project_evaluations` | academic: `total_score`, `max_score` |
| `project_members` | identity: `legacy_display_name` |
| `project_resource_files` | documents-media: `object_key`; credentials-secrets: `upload_token_hash` |
| `project_resources` | documents-media: `legacy_attachment_url` |
| `project_submissions` | documents-media: `legacy_primary_attachment_url` |
| `quiz_attempts` | academic: `score`, `max_score`, `legacy_score`, `legacy_max_score` |
| `recruiter_invite_code` | credentials-secrets: `token_hash`, `code_hash`; address: `delivery_state` |
| `skills` | identity: `display_name` |
| `storage_legacy_file_crosswalks` | documents-media: `legacy_object_key_mac` |
| `tenant_domains` | credentials-secrets: `verification_token` |
| `users` | contact: `phone_e164`, `email`; identity: `display_name`, `legacy_first_name`, `legacy_last_name` |

## What this does not answer yet (owner and legal)

- Lawful basis, purpose and retention per class; deletion and export on request (the platform has no data-subject request flow); consent records; the processors (Exotel for SMS, ZeptoMail for email, Cloudflare R2 for files, Google for calendar and Cloud SQL hosting, Telegram for alerts) and their regions; the cross-border position of each.
- Students are mostly adults at colleges but some may be minors: age handling is unreviewed.
- Which of these tables are copied into logs: the structured logs carry user ids and one-way IP tags, not contacts or codes (see `auth-audit-privacy.ts`); the audit trail table stores no contacts.
