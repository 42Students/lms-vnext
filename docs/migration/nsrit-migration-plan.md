# NSRIT data migration: discovery and plan (legacy dev DB -> vNext dev DB)

Status: read-only discovery, 2026-10-16. Nothing was written to any database. Legacy source = local MySQL copy `lms_click` (copy of the legacy dev DB, 228 tables). Target = vNext dev Postgres `lms_vnext` (GKE dev). No PII values appear in this file; only counts, column names and masked descriptions. Helper SQL: `nsrit-discovery-queries.sql`; raw counts: `counts-out.tsv`; column inventories: `legacy-columns.txt`, `vnext-columns.txt`; parity audit: `db-parity-audit.md`.

Important precedent: `docs/core-platform-migration-map.md` in vNext says "LMS vNext is starting with fresh data ... do not implement the migration identity map, data extractors, reconciliation pipeline ... unless the user explicitly reopens migration". The owner has now reopened it for NSRIT only (dev only). `src/db/schema/legacy-id-map.ts` (`legacy_id_map`, unique on legacy type+id+new type) already exists in the schema and can be the persistent mapping table.

---------------------------------------------------------------------------

## 1. Findings

### 1.1 NSRIT identity in the legacy DB

| Item | Value |
| --- | --- |
| `college.id` | **6**, name `NSRIT`, `unique_id` = `nsrit42`, `org_id` = 6, `is_deleted` = 0, created 2026-05-11 |
| `organization.id` | **6**, name `NSRIT`, not deleted |
| Hosts (`tenant_domain`) | `nsrit42.development.42lms.com` (primary, verified), `nsrit42.42lms.com` (verified, non-primary) |
| Module switches (`app_setting`, scope COLLEGE 6) | `module.placements.enabled`, `module.projects.enabled` |
| Name variants searched | `nsr`, `raju` over college, organization, department, new_program, course, smrithi_college, job.host_college_name, company, lms_group. Only hits: college 6, org 6, `new_program` 7 "NSRIT Training in MERN Stack" and `course` 8 "NSRIT MERN Stack Training" (both owned by **college 2 "42Learn College"**, dept 8 "42 Learn FSD": the pre-NSRIT pilot; see open question Q1). No "N S Raju" long name exists anywhere. |
| Other colleges in the DB (NOT in scope) | 1 "42Learn", 2 "42Learn College", 3 "Top Coders", 4/5 "E2E College A/B" (deleted), 7 "42LMS Demo College" (deleted), 8 "Audit CSV College" |

NSRIT college row has no address, logo, chair or vice-chair set (city/state null). `college_branding` has 0 rows (none for NSRIT). 4 NSRIT departments have a chair set.

### 1.2 How tables link to NSRIT (the real graph; very few DB foreign keys exist)

Only 65 DB FKs exist and none reach `college`/`organization` from the academic or people tables, so the scope was derived from code conventions (Hibernate plain `Long` columns, no `@ManyToOne` on `Batch.program_id`).

```
organization(6)
 +- college(6) --- tenant_domain, college_public_link, tpo_college_settings, college_placements_page, app_setting(scope COLLEGE/6)
     +- department(college_id=6)  [80 rows]
     |    +- new_program(dept_id)     <- batch.program_id, class.program_id, semester.program_id, learner.program_id point at NEW_PROGRAM, not legacy `program`
     |    |    +- batch(program_id) ; class(program_id,batch_id) ; semester(program_id) -> semester_course
     |    +- course(dept_id) or course(created_by_org_id=6)  -> lesson -> lesson_contents(course_id,lesson_id,class_id)
     |         -> quizzes(course_id/class_id/lesson_id) -> quiz_questions -> quiz_options ; quiz_attempts -> quiz_answers
     |         -> student_assignment(lesson_content_id, student_id) ; learner_content_progress ; discussions(lesson_content_id)
     +- learner(college_id) ; faculty(college_id or organization_id)
     |    +- learner: job_application, interview, qualification, job_preferences, learner_saved_job, placement_registration, notification(learner_id), attend(student_id), ...
     |    +- faculty: faculty_course_mapping, faculty_teaching_assignment, class_schedule(faculty_id), tpo_* authorship
     +- lecture_hall(college_id) ; class_schedule(class_id) -> attend(class_schedule_id)
     +- lms_group(college_id) -> lms_group_member, lms_group_member_event, lms_group_rule ; elective_slot(college_id) -> elective_offering(slot_id, group_id)
     +- project_workspace(college_id) -> member/sprint/task/task_comment/resource(+audit)/meeting(+history)/delivery(+event)/release/activity_event
     +- project_template(college_id/org) and project_template_college -> project_template_version
     +- job(college_id/org) -> job_round -> round_slot/round_assignment/round_result ; job_application -> application_screening, status_history, job_offer
     +- company via college_company / job.company_id ; recruiter via recruiter_college_access -> capability ; recruiter_lead -> activity, follow_up
     +- placement_season, placement_batch, placement_eligibility(+event), placement_announcement(+recipient,+read), tpo_* (threads, messages, bells, saved views, campaigns)
```

Consistency checks done (all passed): all 151 NSRIT learners belong to a class whose program belongs to an NSRIT department; every NSRIT lesson-content has a lesson; no orphan job applications; NSRIT `student_assignment` rows have learners of college 6 except none foreign (146 of 153 total are NSRIT, 7 are other colleges); `job_application` for NSRIT learners 61 of 429 (the rest are college 2 learners).

Legacy DB has **no triggers, views, stored routines or events**. All logic is in Java (Spring) code; see `db-parity-audit.md`.

### 1.3 Per-table row counts for NSRIT (total in DB vs NSRIT)

Generated by `gen_counts.py` (SQL in `nsrit-discovery-queries.sql`, output `counts-out.tsv`). "path" = relationship used.

| Legacy table | Total | NSRIT | Path |
| --- | ---: | ---: | --- |
| organization | 7 | 1 | id=6 |
| college | 8 | 1 | id=6 |
| tenant_domain | 17 | 2 | college_id |
| college_public_link | 1 | 1 | college_id |
| tpo_college_settings | 1 | 1 | college_id |
| college_placements_page | 1 | 1 | college_id |
| app_setting | 7 | 2 | scope COLLEGE/6 |
| department | 90 | 80 | college_id |
| program (legacy table, ids overlap new_program) | 5 | 2 | dept_id |
| new_program | 17 | 8 | dept_id |
| batch | 9 | 3 | program_id -> new_program |
| class | 34 | 27 | program_id / batch_id |
| semester | 12 | 5 | program_id |
| semester_course | 52 | 44 | semester_id |
| lecture_hall | 49 | 47 | college_id |
| elective_slot | 17 | 17 | college_id |
| elective_offering | 24 | 24 | slot_id |
| lms_group | 26 | 26 | college_id |
| lms_group_member | 36 | 36 | group_id |
| lms_group_member_event | 45 | 45 | group_id |
| lms_group_rule | 1 | 1 | group_id |
| learner | 256 | 151 | college_id |
| faculty | 22 | 11 | college_id or organization_id (8 + 3 with college set, org null) |
| recruiter | 2 | 2 | recruiter_college_access / job.recruiter_id |
| learner_acct_verification | 218 | 8 | learner_id |
| faculty_acct_verification | 1900 | 29 | faculty_id |
| qualification | 12 | 11 | learner_id |
| job_preferences | 1 | 1 | learner_id |
| learner_saved_job | 1 | 1 | learner_id |
| placement_registration | 45 | 45 | learner_id |
| faculty_course_mapping | 18 | 18 | faculty_id / class_id |
| faculty_teaching_assignment | 36 | 29 | faculty_id / class_id |
| course | 33 | 23 | dept_id / created_by_org_id |
| lesson | 91 | 74 | course_id |
| lesson_contents | 458 | 385 | course_id / lesson_id / class_id |
| learner_content_progress | 245 | 167 | learner_id |
| classroom_messages | 3 | 3 | course_id / class_id |
| student_assignment | 153 | 146 | lesson_content_id / student_id |
| quizzes | 95 | 91 | course_id / class_id |
| quiz_questions | 446 | 439 | quiz_id |
| quiz_options | 1511 | 1487 | question_id |
| quiz_attempts | 12 | 8 | quiz_id / learner_id |
| quiz_answers | 49 | 42 | attempt_id |
| class_schedule | 87 | 20 | class_id |
| attend | 236 | 200 | class_schedule_id / student_id |
| notification | 1095 | 952 | learner_id / class / course |
| notification_outbox | 721 | 721 | recipient (all PENDING; see risks) |
| announcements | 3 | 1 | receiver COLLEGE/6 (one row; manual) |
| project_workspace | 40 | 40 | college_id |
| project_member | 95 | 95 | project_id |
| project_sprint | 49 | 49 | project_id |
| project_task | 256 | 256 | project_id |
| project_task_comment | 90 | 90 | project_id |
| project_resource | 45 | 45 | project_id |
| project_resource_audit | 231 | 231 | project_id |
| project_meeting | 40 | 40 | project_id |
| project_meeting_history | 44 | 44 | project_id |
| project_delivery | 10 | 10 | project_id |
| project_delivery_event | 10 | 10 | project_id |
| project_release | 13 | 13 | project_id |
| project_activity_event | 780 | 780 | project_id |
| project_template | 54 | 46 | college/org/assignment (8 are global) |
| project_template_college | 42 | 42 | college_id |
| project_template_version | 85 | 60 | template_id |
| company | 20 | 12 | college_company / added_by_college |
| college_company | 14 | 12 | college_id |
| company_domain | 11 | 11 | company_id |
| company_alias | 1 | 1 | company_id |
| industry_company | 1 | 1 | recruiter |
| recruiter_college_access | 2 | 2 | college_id |
| recruiter_college_access_capability | 6 | 6 | access_id |
| recruiter_lead / _activity / follow_up | 10 / 17 / 4 | 10 / 17 / 4 | college_id |
| job | 30 | 17 | college_id (17; 6 with college null belong to org 2) |
| job_round | 15 | 15 | job_id |
| round_slot / round_assignment | 7 / 15 | 7 / 15 | round_id |
| round_result | 48 | 48 | round_id |
| job_application | 429 | 61 | job_id / learner_id |
| application_screening | 385 | 58 | application_id |
| job_application_status_history | 86 | 82 | application_id |
| job_offer | 118 | 9 | application_id |
| interview | 169 | 0 | none belong to NSRIT |
| drive_change_request / internal_note / drive_group | 4 / 1 / 1 | 4 / 1 / 1 | job |
| placement_season / batch | 1 / 1 | 1 / 1 | college_id |
| placement_eligibility (+event) | 2 (+2) | 2 (+2) | college_id |
| placement_announcement | 6 | 6 | college_id |
| placement_announcement_recipient / read | 73 / 5 | 73 / 5 | announcement_id |
| tpo_audit_log | 73 | 73 | college_id |
| tpo_bell | 23 | 23 | college_id |
| tpo_company_outreach / email_campaign / campaign_recipient | 1 / 1 / 2 | same | college_id |
| tpo_message_thread / tpo_message | 3 / 10 | same | college_id |
| tpo_saved_view | 3 | 3 | college_id |
| tpo_team_thread / thread_member / message / ask / mention | 5 / 7 / 9 / 2 / 2 | same | college_id |
| admin_audit_log | 908 | 869 | college_id / organization_id |
| mobile_login_attempt | 3796 | 3391 | college_id |
| refresh_token_blocklist | 2783 | 2307 | user_type + user_id |
| sms_delivery_log | 273 | 0 | none |
| discussions | 107 | 0 | all belong to college 2's course 8 |
| lesson_content_class_sequence | 9 | 0 | none |
| grade_audit_log | 5 | 0 | none |
| student_image | 1 | 0 | none |
| empty tables (0 rows everywhere) | | 0 | learner_academic_record, profile_verification(+event), student_registration, student_request, placement_debarment, external_placement, prep_assignment, tpo_student_note, tpo_team_member, college_branding, college_placement_rules, college_what_companies_see, recruiter_applicant_note, round_attendance, reschedule_request, job_eligibility_override, quiz_attempt, exam*, user, login_user, user_roles, role, user_session |

Totals: **~7,083 business rows to load**, ~942 audit-log rows (admin_audit_log 869 + tpo_audit_log 73; load as archive activity events, optional), ~6,456 operational/derived rows NOT to load (login attempts, token blocklist, account verification OTP rows, pending outbox, SMS log). The Smrithi tables (smrithi_*, 3 colleges 5 rows) are a separate admissions product, not NSRIT.

### 1.4 What NSRIT data actually is (important for "as is")

* **People: 151 learners** (98 in class 6 "MERN - ...", created 2026-05-11; 50 in class 9 "CSE - A", created 2026-07-04; 3 in class 10 AIML, 2026-09-11). 147 have `@nsrit.edu.in` emails; 4 look like seed/test accounts (gmail/example/testing/student.com). All 151 have a unique 10-digit phone and an email; 6 learners have no `unique_id`; roll numbers present, no duplicate roll numbers. **11 faculty** (ordinals: 0 PERMANENT x2, 1 GUEST x1, 4 ADMIN x1, 8 PROFESSOR x2, 11 LECTURER x3, 13 MENTOR x1, 14 TPO x1; 6 of 11 have no email). **2 recruiters** with active college access.
* **Academic structure is mostly test junk**: 78 of 80 departments are E2E/QA/XSS-probe/placeholder names (`E2E Dept <timestamp>`, a 200-character name, `<script>` names); 4 of 8 programs are `E2E ...`; 24 of 27 classes are `[Elective] ... SMOKE/AUDIT-FIX/R2 slot cap` GROUP_BACKED test classes; 25 of 26 elective groups ARCHIVED; elective slots/offerings are all smoke-test data. Real structure: departments MERN (9), Department of Science (12), Computer Science and Engineering (13), AI and ML (14); programs MERN (8), B.Tech CSE (11), AIML (19, 20 duplicate); batches 5 "2027 CRT Prime", 8 "2026-2027 Batch", 9 "2024-2025 Batch"; classes 6, 9, 10.
* **Content**: 19 courses created by org 6 + 4 by NSRIT department with null org; 385 lesson contents (221 video with CDN URL host `42lms.in`, 133 resources with object keys under `org-6/college-6/...`, 43 assignments, 6 youtube, 6 live class, 2 quiz); 74 lessons.
* **Real activity**: 146 assignment submissions (151 `NOT_GRADED`, 2 `AUTO_GRADED`: 98% ungraded), 8 quiz attempts, 20 scheduled classes (2026-06-08..07-03), 200 attendance (absentee) rows, 167 progress rows, 952 notifications, 40 project workspaces (20 ARCHIVED), 17 drives (16 CLOSED/CANCELLED), 61 applications -> 61 HIRED / 9 offers for NSRIT learners.

---------------------------------------------------------------------------

## 2. Mapping table (legacy table | NSRIT rows | vNext target | gaps)

vNext target names are tables in `src/db/schema/*`; items marked **[staged]** exist as Drizzle files with draft SQL under `scripts/sql/*.draft.sql` but are NOT in `drizzle/` migrations (0000-0079), i.e. not present in the dev DB today.

| Legacy table | Rows | vNext target | Gaps / notes |
| --- | ---: | --- | --- |
| organization | 1 | `organizations` | name only; status ACTIVE |
| college | 1 | `colleges` (organization_id, name, code=unique_id, status, address) | chair/vice-chair intentionally dropped (vNext decision 1.6); logo -> `logo_object_path` (null) |
| tenant_domain | 2 | `tenant_domains` | direct; keep `is_primary`; verification fields copy; note dev host `nsrit42.development.42lms.com` needs an ingress host rule (see `scripts/ops/add-college-host.sh`) |
| college_public_link | 1 | `placement_public_join_links` | token hash only; **link must be regenerated** (hash of legacy token cannot be reused safely); copy `enabled/post_direct`, reset counters |
| tpo_college_settings | 1 | `placement_tpo_college_settings` (+`placement_tpo_trusted_domains`, `placement_tpo_job_types`, `placement_tpo_prep_courses`) | JSON columns split into child tables; `cgpa_to_pct`, `notify_toggles_json`, `recruiter_sees_applicants`, `tpo_can_verify_profiles` need field-by-field map (see parity doc) |
| college_placements_page | 1 | `placement_public_page_settings` | numbers_json shape check |
| app_setting | 2 | `module_access_rules` (scope COLLEGE, module placements/projects) | direct |
| department | 80 (2 deleted) | `departments` (college_id, name, archived_at) | no chair columns; `is_deleted` -> `archived_at`; **names with markup/200 chars** need decision: load as is (fidelity) or skip junk (Q2) |
| program (legacy) | 2 | NOT-NEEDED (unused; only ids 1-5, referenced by nothing for NSRIT) | verify no NSRIT batch/class points at it (confirmed: they point to new_program) |
| new_program | 8 | `programs` (department_id, name, code, duration_terms=duration_years*2? status) | `duration_years` -> `duration_terms` needs semester count rule; code is required: generate from name+id |
| batch | 3 | `cohorts` (program_id, name, code, start_period_id, expected_end_period_id) + `academic_periods` + `cohort_progression_state` | legacy `academic_year`, `current_semester`, `current_students`, `start/end_date`, `status` -> derive `academic_periods` (college-level) and `cohort_progression_state.current_term_number`; `current_students` is derived (drop) |
| class | 3 SECTION + 24 GROUP_BACKED | SECTION -> `sections` (cohort_id, academic_period_id, name, capacity=upper_limit); GROUP_BACKED -> `lms_groups` + `course_section_deliveries` backing (`elective_offerings.backed_delivery_id`) | `lower_limit` has no vNext column (gap); `description`, `start_date/end_date` no column (gap); GROUP_BACKED classes need the elective graph loaded in one unit |
| semester | 5 | `program_terms` (program_id, term_number, name, is_active, total_credits) | direct |
| semester_course | 44 | `program_term_courses` (type from is_mandatory, credits, display_order) | `course_id` needs course mapping first |
| lecture_hall | 47 | `lecture_halls` | direct (dept_id -> department_id, room_type) |
| elective_slot | 17 | `elective_slots` | direct, `academic_year` + `semester_number` kept; mostly smoke data |
| elective_offering | 24 | `elective_offerings` (group_id, backed_delivery_id) | needs class->delivery mapping |
| lms_group | 26 | `lms_groups` | direct (kind ELECTIVE; owner_scope; config_json) |
| lms_group_member / event / rule | 36/45/1 | `lms_group_members` / `lms_group_member_events` / `lms_group_rules` | member_id (learner id) -> membership_id; criteria_json needs `criteria_version` (default 1 and validate) |
| learner | 151 | `users` + `college_memberships` (role LEARNER) + `learner_profiles` (+ `learner_program_enrollments`, `section_enrollments`) | see section 3.2: identity collapse; profile fields -> `profile_document` jsonb (address, skills, hobbies, certifications, experiences, social links...); `video_intro_url` -> `learner_profile_video_intros` **[staged]**; `qualification` -> `learner_profile_education_entries` **[staged]**; `identity` (Aadhaar/PAN) -> `learner_profile_identity_summaries` **[staged]** (store only last4; do NOT migrate full numbers); `resume_url`, `suspended_at/reason` -> membership `suspended_at/reason`; `token_version` DROP; `bulk_import_batch_id` -> `learner_import_batches` **[staged]** (none set) ; `coding_profiles`, `projects`, `achievements`, `extracurricular` JSON -> profile_document |
| learner_academic_record | 0 | `placement_candidate_academic_evidence` | empty today; cgpa x100 hundredths, pct x100 basis points |
| qualification | 11 | `learner_profile_education_entries` **[staged, not migrated]** | needs migration first; `certificate_upload` -> private-doc receipt |
| job_preferences | 1 | `placement_candidate_preferences` | enum value mapping (role_preference, shift) |
| learner_saved_job | 1 | `placement_saved_jobs` | job + membership mapping |
| placement_registration | 45 | `placement_batch_registrations` (cohort_id, membership_id, choice, consent_*) | legacy keyed by season, vNext by cohort: map via learner.class -> batch -> cohort; choice PLACEMENTS/HIGHER_STUDIES; `outcome_label/detail` -> `placement_tpo_after_college` |
| learner_acct_verification | 8 | NOT-NEEDED | plaintext OTP/lockout state of a legacy login; replaced by `identity_auth_attempts`; see Q-AUTH |
| faculty | 11 | `users` + `college_memberships` + `membership_roles` (FACULTY/COLLEGE_ADMIN/MENTOR/TPO from ordinal) + `faculty_profiles` (primary_department_id, employment_type, academic_title) | faculty_type ordinal map: 0 PERMANENT, 1 GUEST, 2 VISITING, 3 CONTRACT, 4 ADMIN, 5 HEAD, 6 COORDINATOR, 7 CLERK, 8 PROFESSOR, 9 ASSOC_PROF, 10 ASST_PROF, 11 LECTURER, 12 ADJUNCT, 13 MENTOR, 14 TPO. ADMIN/MENTOR/TPO -> membership roles (plus FACULTY base role) and employment_type left null; the rest -> employment_type/academic_title. `organizations` JSON column dropped. |
| faculty_acct_verification | 29 | NOT-NEEDED | same as learner |
| faculty_course_mapping / teaching_assignment / associations | 18 / 29 / 0 | `course_teaching_assignments` (delivery_id, membership_id, role PRIMARY/CO_TEACHER), `section_faculty_assignments`, `faculty_course_associations` | needs delivery (offering x section) derived: `faculty_teaching_assignment.academic_year/semester_number/batch_id/class_id/course_id` -> offering + delivery |
| course | 23 | `courses` (department_id, name, code, description, status) + `course_display_contents` **[staged]** + `course_offerings` (cohort/period) + `course_learning_paths` | gaps: `slug`, `short_title`, `formal_title`, `default_subscription_days`, `parent_course_id`, `version`, `allowed_for_display`, `contents` JSON have no column (staged `db05-course-identity/metadata-extension` drafts cover several); the "course -> class" binding lives in lesson_contents.class_id and faculty_course_mapping in legacy, vNext uses offering+delivery |
| lesson | 74 | `course_lessons` (learning_path_id, name, sequence, status) + `lesson_content_settings` **[staged]** (active/enabled) | one learning path per offering needed |
| lesson_contents | 385 | `lesson_contents` (type video/resource/assignment/youtube/live class/quiz -> `LESSON_CONTENT_TYPES`; storage_key, external_url, starts_at/ends_at, visible_to_students) + `lesson_content_materials` **[staged]** + `lesson_content_settings` **[staged]** (html_content, due date raw, thumbnail) + `lesson_content_delivery_sequences` **[staged]** (per-class sequence) | `content_data` is a JSON blob (file_dto, link, due_date, html_content, duration, time_zone, start/end) that must be unpacked; `points` -> assignment max_points; `deadline` -> `course_assignments.due_at` (IST); `deleted_with_lesson` tombstone semantics |
| lesson_content_class_sequence | 0 | `lesson_content_delivery_sequences` **[staged]** | no NSRIT rows |
| learner_content_progress | 167 | `learner_content_progress` | `duration_seconds`, `first_completed_at`, `attempt` columns: vNext lacks them (staged `db05-version-progress-attempts` draft adds); membership+content mapping |
| classroom_messages | 3 | `course_discussion_messages` (delivery_id, sender_membership_id, pinned) | sender_name/role snapshot dropped (vNext derives); sender_id type ambiguity (learner vs faculty by sender_role) |
| discussions | 0 | `lesson_content_discussions` **[staged]** | no NSRIT rows (all belong to college 2) |
| student_assignment | 146 | `assignment_submissions` (+ `assignment_submission_files` **[staged]**, `assignment_grade_events` **[staged]**) | gaps: `attempt_number`, `previous_points`, `graded_by` actor type, `submission_assets` JSON (files), `html_content`, `semester_number`, `student_first/last_name` snapshots; `points_obtained`->`points_awarded` precision; `grading_status` NOT_GRADED/AUTO_GRADED mapping |
| grade_audit_log | 0 | `assignment_grade_events` **[staged]** | none for NSRIT |
| quizzes | 91 | `course_quizzes` | `shuffle_questions/options`, `max_attempts` present?, `is_grade_published` -> `results_published`, `faculty_id` -> created_by, `due_at` IST; `total_points` kept |
| quiz_questions / quiz_options | 439 / 1487 | `quiz_questions` / `quiz_options` | question_type: MCQ -> SINGLE_CHOICE (1 row), MULTIPLE_CHOICE kept |
| quiz_attempts / quiz_answers | 8 / 42 | `quiz_attempts` / `quiz_attempt_answers` (prompt/options snapshot required) | vNext answers store `prompt_snapshot`, `options_snapshot`, `points_possible`: reconstruct from legacy question/options at migration time; `status` always SUBMITTED |
| class_schedule | 20 | `section_schedule_events` + `section_schedule_event_courses` + `attendance_sessions` | `attendance_marked_at` -> `attendance_sessions.marked_at/status`; start_time/end_time are naive IST wall time -> timestamptz |
| attend | 200 | `attendance_records` (status) | **semantic gap**: legacy stores only absentees (a row = absent; status NULL = ABSENT, EXCUSED/MEDICAL/LATE otherwise). vNext needs a record per learner per marked session: expand present learners for sessions with `attendance_marked_at` set; `drop_class_reason` -> `note`; `marked_by` -> `marked_by_user_id` |
| notification | 952 | `in_app_notifications` (+ `activity_events` as event) | legacy has no event row; synthesize `activity_events` (module, event_type) or null event_id if allowed; `is_read` -> `read_at` (use updated_at); `delivery_status` SENT info dropped |
| notification_outbox | 721 | NOT-NEEDED (do NOT load) | all PENDING SMS/EMAIL/APP; loading into any worker queue would send. Archive counts only |
| announcements | 1 | `announcements` (college_id, receiver_type COLLEGE) | sender_id polymorphic (ADMIN) -> sender_user_id lookup |
| project_workspace | 40 | `project_instances` (+`project_templates` linkage) | gaps (parity doc): `progress`, `phase`, `blocker`, `next_action`, `due_label`, `class_id`, `start/end_date`, `sprint_length_weeks`, `estimation_unit`, `readiness_override*`, JSON blobs (`overview`,`sprints`,`tasks`,`resources`,`delivery`,`meetings`,`activity`) are denormalized duplicates of the child tables; `recoverable_content` |
| project_member | 95 | `project_members` (membership_id, role_label) | user_type LEARNER/FACULTY -> membership; `member_status` |
| project_sprint | 49 | `project_sprints` | `sprint_key` -> template_key, dates/goal/state: vNext has title, sequence, status only (gap: due_date, start/end, goal, started_at/by, sprint_number) |
| project_task | 256 | `project_tasks` | gaps: assignee (task assignee id/type/name), due_date, estimate_points, task_type, blocker_reason, submission fields (-> `project_task_submissions`), carried_over_from_sprint_key, approach |
| project_task_comment | 90 | `project_task_comments` **[staged]** | needs migration |
| project_resource / audit | 45 / 231 | `project_resources` / `project_resource_audit` **[staged]** | visibility, pinned, sprint/task links, file fields (gap) |
| project_meeting / history | 40 / 44 | `project_meetings` / `project_meeting_history` **[staged]** | attendees, action_items, retro_*, reminder/calendar fields (gap); `meeting_date + start_time + timezone` -> `starts_at` |
| project_delivery / event | 10 / 10 | `project_submissions` (+`project_submission_reviews`) / `project_delivery_events` **[staged]** | snapshot JSON, attachments, locked_*, file_* fields (gap) |
| project_release | 13 | `project_releases` | direct-ish |
| project_activity_event | 780 | `activity_events` (module projects) | event_code/key mapping; actor type |
| project_template / version / college | 46 / 60 / 42 | `project_templates` / `project_template_versions` / `project_template_college_assignments` | `sprints/tasks/resources/meetings` JSON -> `blueprint` jsonb; slug unique (global) |
| company / domain / alias | 12 / 11 / 1 | `placement_companies` + `placement_company_relationships` (college) | `verified_by_42` fields -> status; company is global in vNext (de-dup by domain; other colleges' companies not in scope, but 8 NSRIT-linked companies may be shared with other colleges: map, do not duplicate if already loaded) |
| college_company | 12 | `placement_company_relationships` (is_trusted, owner_membership_id, share defaults) | contact_person/email/phone/internal_notes -> `placement_tpo_leads`/relationship notes (no column: gap) ; `join_token_hash` regenerate |
| recruiter / recruiter_college_access / capability | 2 / 2 / 6 | `users` + `placement_recruiter_profiles` + `placement_recruiter_college_grants` | capabilities (6 rows) have no vNext column (gap); `valid_until`, `verification`, `hiring_for_company_id`, `agency_for_company_name` (gap) |
| recruiter_lead / activity / follow_up | 10 / 17 / 4 | `placement_tpo_leads` / `_lead_activities` / `_followups` | invite token hashes: do NOT copy (regenerate) |
| industry_company | 1 | `placement_companies` | merge by name/domain |
| job | 17 | `placement_jobs` (+ `placement_job_role_options`, `placement_job_eligibility_policies`, `placement_job_cohort_targets`) | `eligibility_json`, `evaluation_config`, `candidate_preferences`, `important_dates`, `assessment_url`, `drive_mode`, `category`, `lifecycle_status` DRAFT/REQUEST/PUBLISHED/CLOSED/CANCELLED -> vNext status set; `ctc_range` text -> min/max INR (parse); `target_*` ids -> cohort/program ids |
| job_round / round_slot / round_assignment | 15 / 7 / 15 | `placement_job_rounds` / `placement_hr_interview_slots` / `placement_application_round_exceptions` | scheduled_date naive IST -> `scheduled_at` + `timezone`; round_assignment (confirmation/notify) partial |
| round_result | 48 | `placement_round_results` | `score` -> `score_percent`; submitted_by_type/id -> user |
| job_application | 61 | `placement_applications` (+ screenings, status_history) | status map APPLIED/SHORTLISTED/INTERVIEW/ASSESSMENT/OFFERED/HIRED/REJECTED to vNext enum; `external_ref/public_ref`, `resume_history`, `pap_requested` (gap); `applied_by_college` -> channel |
| application_screening / status_history | 58 / 82 | `placement_application_screenings` / `_status_history` | direct-ish |
| job_offer | 9 | `placement_offers` (+ history, joining outcomes) | legacy ctc fixed/variable/bonus/bond/respond_by/accepted_disputable_until/cascade_id/acceptance_channel: vNext has `annual_ctc_inr`, expires_at only (gaps) |
| interview | 0 | `placement_hr_interview_slots` / rounds | none for NSRIT |
| placement_season / batch | 1 / 1 | `placement_seasons` / `placement_batch_lifecycles` | direct-ish |
| placement_eligibility (+event) | 2 / 2 | `placement_eligibility_decisions` / `placement_eligibility_events` | direct (staged events in table `placement-batches.ts`) |
| placement_announcement + recipient + read | 6 / 73 / 5 | `platform_broadcasts`? NO: use `announcements` for college notices; no placement-announcement table (gap) | recipient fan-out and read state; decide target |
| tpo_message_thread / message | 3 / 10 | `placement_tpo_message_threads` / `placement_tpo_messages` | direct |
| tpo_team_thread/member/message/ask/mention | 5/7/9/2/2 | `placement_tpo_internal_threads` / `_messages` | threads/asks/mentions richer in legacy (gap: asks, mentions, decisions, archived/private) |
| tpo_saved_view / bell / audit_log | 3 / 23 / 73 | `placement_tpo_saved_views` / (bell -> `in_app_notifications`) / `activity_events` | tpo_bell has no table of its own |
| tpo_email_campaign (+recipient) | 1 / 2 | NO-TARGET | no campaign table in vNext |
| tpo_company_outreach | 1 | `placement_company_relationships.status` partly | no exact column |
| admin_audit_log | 869 | `activity_events` (archive; module `legacy_audit`) | optional; payload_json; actor types FACULTY/LEARNER |
| mobile_login_attempt, refresh_token_blocklist, user_session, auth_handoff_token, auth_token | 3391 / 2307 / 0 / n.a. / n.a. | NOT-NEEDED | auth/session telemetry; contains plaintext OTP columns (never copy) |
| sms_delivery_log | 0 | NOT-NEEDED | none for NSRIT |
| flyway_schema_history*, backup_*, cleanup_*, zz_backup_* | n.a. | NOT-NEEDED | legacy migration/backup tables |
| smrithi_* | n.a. | NOT-NEEDED | different product |
| skills, skill_synonyms, skill_usage | 0/2/13 (global) | `skills`, `skill_synonyms`, `skill_usage` **[staged draft]** | platform-wide; migrate only if drafts get registered |
| bug_*, audit_finding*, log_alert_* | global | `bug_reports` etc. exist but are platform operations data | not NSRIT data |
| exam*, examinee, assigned_exam, question, question_option, selected_option, facial_recognition_result, approver_id_card | 0 | NO-TARGET (empty) | legacy online-exam module, empty |

### NO-TARGET summary (vNext lacks a table or column)

1. College-level contact/notes per company (`college_company.contact_*`, `internal_notes`), recruiter capabilities (`recruiter_college_access_capability`), recruiter agency/valid_until fields.
2. Email campaigns (`tpo_email_campaign*`), placement announcements with recipient fan-out and read state (`placement_announcement*`), `tpo_bell`, team asks/mentions/decisions.
3. Class capacity floor `lower_limit`, class description/dates, `current_students` (derived).
4. Offer compensation breakdown (fixed/variable/joining bonus/bond months/amount/disputable window/cascade_id), job fields `evaluation_config`, `candidate_preferences`, `important_dates`.
5. Project fields listed above (sprint dates/goals, task assignee/estimate/type/blockers, meeting retro/action items/attendees, delivery locks/files, workspace progress/phase/readiness, resource visibility).
6. Assignment attempt history (`attempt_number`, `previous_points`, grade audit actor), quiz `shuffle_*`.
7. Lesson content progress duration/attempt/first completion.
8. Learner/faculty profile JSON fields live in `profile_document` jsonb (shape must be defined by the profile module).
9. Many "[staged]" tables: they exist only as Drizzle files plus draft SQL; the dev DB lacks them (must be registered as proper migrations first: see Section 5).

---------------------------------------------------------------------------

## 3. ETL design

### 3.1 Form of the loader

* A TypeScript script in the vNext repo: `scripts/migrate/nsrit/` (run with `tsx`, same style as `scripts/seed-test-tenants.ts` and guarded the same way). Reads from a **file snapshot** of the legacy tables (a `mysqldump`/CSV/NDJSON export of the NSRIT-scoped rows produced from the local `lms_click` copy), not from a live MySQL connection. This keeps the legacy DB offline and lets the export be reviewed.
* Loader connects to the dev Postgres through `DATABASE_URL` (same recipe as the migrate job; see memory `vnext-deployment-state.md`): run as a one-shot Kubernetes Job in `lms-dev-2026` from the migrator image, with the snapshot mounted from a ConfigMap/Secret or fetched from a private R2 prefix. Never run from the laptop against Cloud SQL unless the authorized-networks step is explicitly approved.
* Modes: `--dry-run` (default; runs everything in a transaction and rolls back, prints counts and validation results), `--apply`, `--only=<phase>`, `--batch-id=<uuid>`, `--rollback=<batch-id>`.
* Guards: refuse unless `APP_ENV=development` and database name matches `lms_vnext` dev; refuse when `DATABASE_URL` host is not the dev private IP; refuse if any target college other than the NSRIT row would be touched; require `ALLOW_NSRIT_IMPORT=I_ACCEPT`.

### 3.2 Identity and tenancy

* NSRIT college id in vNext: create once (deterministic UUID, see 3.3) with code `nsrit42` and organization "NSRIT"; hosts `nsrit42.development.42lms.com` (+ `nsrit42.42lms.com` marked unverified in dev). **Every inserted row carries the NSRIT `college_id`** (or hangs from a parent that does). A final validation asserts zero loaded rows resolve to another college.
* **One vNext `users` row per person.** Legacy has separate learner / faculty / recruiter accounts. For NSRIT (all counts below are over 151 learners + 11 faculty + 2 recruiters = 164 legacy accounts):
  * phones: all 164 have a 10-digit phone (no empty/placeholder phones; the legacy `EMAIL_FIRST_PHONE` placeholder is `""` and only exists on login attempts, not on accounts);
  * **1 phone is shared by a learner and a faculty account of NSRIT with different names and different emails**: do not merge automatically (owner decision Q4);
  * **2 NSRIT phones are also used by accounts outside NSRIT** (other colleges/recruiters) and 2 recruiters share a phone or email with an NSRIT learner/faculty account: the recruiter/faculty people are cross-college and the vNext model (one user, many memberships) fits; they must be matched by evidence, not just phone;
  * 0 duplicate emails (case-insensitive) inside NSRIT; 2 NSRIT emails also appear on non-NSRIT accounts;
  * 6 faculty have no email (login works by phone OTP; vNext allows null email); 0 learners lack both;
  * email/phone normalization: E.164 `+91XXXXXXXXXX` from the last 10 digits; email lower-cased/trimmed to match `users_email_ci_uq`.
* Collapse rule: users are keyed by **normalised phone**. A group of legacy accounts with the same phone becomes one `users` row with several memberships/roles only when there is corroborating evidence (same normalised name, or same email, or roll number/employee match); otherwise the group goes to a manual-review list and the load stops for those accounts (the second person would need a different phone, or an email-only identity, because `phone_e164` is unique). For NSRIT this is a list of 1 group (+ 2 cross-college phones, + 2 recruiters).
* `identity_uid`: legacy accounts have no external provider uid; use the deterministic synthetic value `legacy:<type>:<legacy id>` of the first (oldest) account, never a real provider uid. First sign-in is by phone/email OTP (first-party login, see `docs/architecture/first-party-login.md`), so **no passwords or reset flow are needed**; legacy `user`/`login_user` tables are empty and learner/faculty accounts never had passwords.
* Roles: learner -> `membership_roles` LEARNER; faculty ordinal -> FACULTY plus COLLEGE_ADMIN/MENTOR/TPO according to ordinal (4 ADMIN, 13 MENTOR, 14 TPO); recruiters -> `placement_recruiter_profiles` + college grants (no membership). Super admin (legacy principal id 0) is not part of NSRIT data.
* Suspension: `suspended_at/suspension_reason` -> `college_memberships.suspended_at/suspension_reason` (0 NSRIT rows currently suspended).
* Do not import: `token_version`, OTP columns (`learner_acct_verification.otp` is stored in plaintext: 218 rows), `mobile_login_attempt` (otp/email_otp), `auth_handoff_token` (access/refresh token values), `refresh_token_blocklist`, any hashed share/invite token.
* Users must have a reachable phone or email to log in: all 164 do. Dev login sends real SMS/email to real numbers when the person starts login (user-initiated), see messaging safety.

### 3.3 ID strategy

* vNext PKs are UUIDs; legacy PKs are int (Long), and different tables share numeric ids (learner 6 and faculty 6 and class 6 are different rows). Use **UUIDv5 (deterministic)**: `uuid5(NAMESPACE_NSRIT, "<legacy_entity>:<legacy_id>")`, so the same legacy row always yields the same vNext id on every rerun, and the loader can compute foreign keys without a lookup round trip. Namespace is a fixed constant stored in the script.
* Record every mapping in `legacy_id_map` (`legacy_entity_type` = legacy table name, `legacy_id`, `new_entity_type` = vNext table, `new_id`, `metadata` = {batch_id, source hash}). Unique key `(legacy_entity_type, legacy_id, new_entity_type)` makes upserts idempotent. One legacy row may map to several vNext rows (course -> course + offering + delivery; learner -> user + membership + profile): `new_entity_type` distinguishes them.
* Natural-key dedupe before insert: users by phone/email, companies by primary domain, departments by (college, name), skills by name.

### 3.4 Idempotency and ordering

Each phase is a transaction; every insert is `INSERT ... ON CONFLICT (id) DO UPDATE` guarded by a row hash stored in `legacy_id_map.metadata` (skip when unchanged). Re-run = same result. Dependency order:

1. P0 preflight (target guard, college exists, migrations at expected head, staged tables registered)
2. P1 org, college, tenant_domains, module_access_rules, tpo college settings
3. P2 departments, programs, academic_periods, cohorts (+progression state), program_terms, sections, lecture halls
4. P3 users, college_memberships, membership_roles, learner/faculty profiles (+staged education/video intro/identity summary)
5. P4 enrollments (`learner_program_enrollments`, `section_enrollments`), `section_faculty_assignments`
6. P5 courses, course_offerings, deliveries, teaching assignments, learning paths, lessons, lesson_contents (+materials/settings/sequences), program_term_courses
7. P6 groups + elective slots/offerings
8. P7 schedule events, attendance sessions and records, content progress
9. P8 assignments + submissions (+files, grade events), quizzes, questions, options, attempts, answers
10. P9 announcements, classroom messages, in-app notifications (+ synthesized activity events)
11. P10 projects (templates, versions, assignments, instances, sprints, tasks, members, resources, meetings, submissions, audit tables)
12. P11 placements (companies, relationships, recruiters, grants, leads, seasons, jobs, rounds, applications, screenings, offers, results, registrations, eligibility, TPO collaboration)
13. P12 audit archive (admin_audit_log, tpo_audit_log) as `activity_events` (optional)
14. P13 `activity_events` row "legacy_import" per phase; reconciliation report.

### 3.5 Dry run, validation, reconciliation

* `--dry-run` executes all phases inside one outer transaction, then `ROLLBACK`; outputs `legacy count / would-insert / would-update / skipped / rejected` per entity and writes `reconciliation-<batch>.json/.md` (no PII; counts and legacy ids only).
* Validation queries (all must be 0 unless noted): rows without college scope; FK orphans in `legacy_id_map` targets; memberships with 0 roles; learners without enrollment; duplicate (college, roll_number); users with neither phone nor email; submissions whose assignment's college differs from the learner's; `attendance_records` for sessions not marked; offers without application; counts of NSRIT rows vs legacy table above (expected figures in Section 1.3).
* Reconciliation report columns: entity | legacy count | mapped to vNext count | rejected (reason codes) | spot-check checksum (sum of numeric fields such as points, ctc, attempt scores; count of learners by class) | pass/fail.

### 3.6 Value, time and soft-delete handling

* **Timezones**: legacy datetimes are naive. The Spring JVM runs in UTC, so audit columns (`created_at`, `updated_at`, `submitted_at`, `graded_at`, `applied_at`...) are naive UTC; but schedule/deadline columns are naive IST wall time (evidence: `class_schedule.start_time` hours cluster 09-11, `quizzes.due_at` 09-15, `lesson_contents.deadline` 23:xx i.e. 23:59 IST, assignment `due_date` strings carry `Z` or are date-only). Rule table per column (see parity doc) -> `timestamptz`: UTC columns interpreted as UTC; IST columns converted with `Asia/Kolkata`; date-only deadlines -> end of day 23:59:59 IST (legacy rule `DEADLINE_ZONE`). Round/meeting rows keep a `timezone` column = `Asia/Kolkata`.
* **Soft deletes**: `is_deleted` is a `bit`/tinyint, sometimes NULL (treated as false). Rows with `is_deleted=1` are imported as archived (`archived_at`/`deleted_at` = legacy `updated_at`) only for entities that have such a column in vNext; for others they are skipped and counted as `rejected: soft_deleted`. NSRIT soft-deleted: 2 departments, 20 ARCHIVED workspaces (status, not is_deleted), 6 lesson_contents.
* **Enums**: explicit lookup maps with a reject-on-unknown policy: attendance (NULL->ABSENT, EXCUSED, MEDICAL, LATE; present = no legacy row), grading_status, content_type (`live class` -> live class type), quiz question_type (MCQ->SINGLE_CHOICE), job lifecycle, application status, offer status (RELEASED/ACCEPTED/DECLINED), round kind/status, interview status, workspace/task/sprint status, faculty_type ordinals, notification_type, lms_group.kind/state, class_type. Unknown values go to the rejected list, never silently coerced.
* **Orphans**: 23 `attend` rows reference learners that do not exist (all `attend` rows: 236 total, 200 NSRIT): reject and report. `student_assignment` from other colleges' learners in NSRIT content: skip. `job_application` of non-NSRIT learners on NSRIT jobs: 0 found.
* **Numbers**: CGPA -> hundredths, percentages -> basis points (round half up), CTC LPA decimal -> INR integer (x100000), points keep `numeric` precision; text length limits checked against vNext varchar sizes before insert (department 200-char name, etc.).
* **Names/markup**: values containing HTML/script payloads (E2E XSS probes) are loaded as plain text (escaped on render); decision on test-junk Q2.

### 3.7 Files and media

* Videos (221): legacy `file_dto.cloud_storage_object` is a full public URL on host `42lms.in`. Keep as `lesson_contents.external_url` pointing at the same URL (public bucket, no copy needed) or copy to the vNext dev R2 prefix (`org-6/college-6/...`).
* Resources and assignment files (133 + 31): object keys `org-6/college-6/...` in the legacy bucket. vNext private storage is R2 with `R2_PRIVATE_BUCKET` (does not exist yet: user must create `lms-vnext-private`, per memory). Plan: server-side copy by key within R2 into the dev prefix `legacy/nsrit/<original key>` after the private bucket exists; store `storage_key` in `lesson_content_materials`/`assignment_submission_files` plus `learner_profile_*` receipts. Until then load rows with `storage_key` set and a `migration_status` note, file not copied (links will 404).
* Profile resumes (1), video intros (2), certificates, ID documents, logo: same copy approach; Aadhaar/PAN images must not be copied (only last4 already in legacy `identity`? verify field content before any load).
* The loader never downloads files to the laptop; copies are R2-to-R2 inside the cluster Job.

### 3.8 Messaging safety (no real SMS/email may be sent by the load)

* The loader performs only SQL inserts. It does not import `notification_outbox` (721 rows, all PENDING: DRIVE_PUBLISHED, OFFER_RELEASED, ROUND_SCHEDULED, REGISTRATION_OPEN, PLACEMENT_ANNOUNCEMENT with SMS/EMAIL channels) nor `placement_announcement` fan-out, and never writes to `outbound_messages`/`general_notification_outbox`.
* Imported `in_app_notifications` rows are in-app only; set `read_at` for legacy-read rows; no delivery triggers exist on that table. If a notification worker is later added, it must not scan in-app history.
* The loader does not call Exotel/ZeptoMail code paths (import does not use `login-service`, `exotel-sms.ts`, `messaging/providers.ts`). Job env for the loader has NO `EXOTEL_*`/`ZEPTOMAIL_*` variables (do not mount the `vnext-integrations` secret).
* Gap to fix before any bulk activity: vNext has no non-production recipient allowlist for OTP (login sends real SMS/email to any registered phone/email when APP_ENV=development, except `AUTH_TEST_*` contacts which get a fixed code). Importing 164 real phone numbers means any of them can trigger a real OTP SMS by trying to log in on `nsrit42.development.42lms.com` (user-initiated, acceptable) but nothing else may. Propose an env switch `OUTBOUND_ALLOWLIST_ONLY=true` for dev (new code; see Section 4).
* Do not copy legacy invite/share/join tokens or hashes (they would create live external links).

### 3.9 Audit and rollback

* Import batch id: UUID per run, stored in `legacy_id_map.metadata.batch_id` and in one `activity_events` row per phase (module `data_import`, event_type `nsrit_legacy_import`, metadata = counts, source snapshot hash, loader version).
* Rollback `--rollback=<batch-id>`: delete in reverse dependency order every vNext row whose `legacy_id_map.new_id` was created by that batch (deterministic ids make this exact), then delete the mapping rows. Updates (re-runs) are not individually undone; the supported rollback unit is "remove the whole NSRIT import", which is safe because dev data for NSRIT only comes from this loader. Before `--apply`, take a Cloud SQL on-demand backup or `pg_dump` of the dev DB (PITR 7 days already on).
* Scope guard in rollback: only ever deletes rows reachable from the NSRIT college id.

### 3.10 Runtime and size

~7,100 business rows, ~1,000 audit rows, files: 221 videos stay in place; ~165 R2 objects to copy. Estimated load: under 2 minutes SQL; file copy limited by R2 (minutes). Single-digit MB of data; negligible load on the dev DB.

---------------------------------------------------------------------------

## 4. Schema gaps: work needed so vNext can hold NSRIT data "as is"

Proposed migrations (next number is 0080; each must be a normal Drizzle migration registered in the journal; staged drafts already exist for items marked S):

A. **Register the staged tables** (drafts under `scripts/sql/db05-*.draft.sql`, `db02-*`, `db08-*`, `db10-*`): `lesson_content_settings`, `lesson_content_materials`, `lesson_content_delivery_sequences`, `lesson_content_discussions`, `course_display_contents`, `course_upload_receipts`, `assignment_submission_files`, `assignment_grade_events`, `attendance_record_events`, `course_quiz_lifecycle_events`, `learner_profile_education_entries/documents/images/identity_summaries/private_document_bindings/video_intros`, `learner_import_batches(+members)`, project audit tables (`project_task_comments`, `project_resource_audit`, `project_meeting_history`, `project_delivery_events`), `skills*`.
B. **New columns** (course/academics): `courses.slug/short_title/formal_title/default_subscription_days/parent_course_id/version` (staged: db05-course-identity, course-metadata-extension), `sections.lower_limit/description/start_date/end_date`, `learner_content_progress.duration_seconds/first_completed_at/attempt` (staged: db05-version-progress-attempts), `assignment_submissions.attempt_number/previous_points/html_content/semester_number`, `course_quizzes.shuffle_questions/shuffle_options`.
C. **Placements**: `placement_offers` compensation breakdown (fixed/variable/bonus/bond/respond_by/disputable window/cascade id/acceptance channel); recruiter capability table; relationship contact/notes columns; `placement_announcements` (+recipients/reads); `tpo_bells`; email campaign tables; team asks/mentions/decisions; job fields (`evaluation_config`, `candidate_preferences`, `important_dates`, drive mode, category); application `external_ref/public_ref/pap_requested`.
D. **Projects**: richer instance (progress, phase, blocker, next action, dates, sprint length, estimation unit, readiness override), sprint dates/goal/state timestamps, task assignee/due/estimate/type/blocker/approach/carry-over, resource visibility/pin/links/file fields, meeting attendees/action items/retro/reminder, delivery lock/file metadata.
E. **Import infrastructure**: `legacy_id_map` already exists (add index on `(new_entity_type, new_id)` is present; add `batch_id` column or keep in metadata); optional `data_import_batches` table for audit; `activity_events.module` allowing `data_import`/`legacy_audit`.
F. **Safety**: outbound allowlist switch for non-production (OTP + any future notification worker), documented in `docs/operations`.
G. Check constraints that could reject legacy data: `colleges.code` unique, `programs.code` required, `departments` name uniqueness per college (duplicate AIML program names 19/20), `users_email_ci_uq`, `phone_e164` unique, roll-number uniqueness per college (0 duplicates), varchar lengths (department name 200 chars).

All of these are listed with severity in `db-parity-audit.md`.

---------------------------------------------------------------------------

## 5. Risks

| Risk | Detail | Mitigation |
| --- | --- | --- |
| PII | 151 learners + 11 faculty + 2 recruiters: real names, phones, 10-digit numbers, emails, DOB (6 present), addresses, Aadhaar/PAN field `identity`, resumes, video intros, marksheets. Dev DB is a lower-trust environment than prod | encrypt-at-rest already on Cloud SQL; never log values; loader logs ids/counts only; identity numbers keep last4 only; restrict who has dev DB access; owner confirms real data may live in dev (Q3) |
| Accidental messages | pending outbox (721) and any future workers; real OTP on login | do not import outbox; no integration secrets in the Job; allowlist switch (Section 4F) |
| Junk data "as is" | 78/80 departments, 24/27 classes, 17 elective slots are E2E/smoke data including script-injection names; loading them pollutes the real NSRIT tenant | offer two modes: `--fidelity=all` and `--fidelity=clean` (skip rows matching junk patterns, still report); recommend `clean` + archive list (Q2) |
| Identity collisions | 1 shared phone with different names; cross-college phones/emails (2+2) | manual review list; never auto-merge on phone alone |
| Timezone drift | mixed UTC/IST naive columns; wrong guess shifts schedules/deadlines by 5h30m | per-column rule table + hour-histogram check as a validation step; sample 20 rows with owner |
| Attendance semantics | legacy stores absentees only; naive mapping would produce all-absent or no data | expand present learners only for sessions marked (`attendance_marked_at`) ; validate percentage parity per learner (legacy formula vs vNext) |
| Structure mismatch | legacy course/lesson/content tied to class by `class_id`; vNext needs offering + delivery + cohort + period; GROUP_BACKED electives | derive deterministic offering/delivery per (course, class); validate every lesson content maps to a delivery |
| Staged tables not deployed | 30+ target tables have no migration | do migrations first; loader preflight checks table existence |
| Files | R2 private bucket missing; legacy keys under `org-6/college-6/`; public video host `42lms.in` | create bucket first (user action); copy inside cluster; until then store keys only |
| Cross-college references | NSRIT companies shared with other colleges; recruiter 2 accounts cross-college; NSRIT projects templates global | map companies by domain/name; do not import other colleges' rows; keep only NSRIT grants |
| Re-run drift | legacy dev DB keeps changing (other chats edit it) | snapshot file + hash; re-export only deliberately; loader refuses mixed snapshots |
| Cluster access | master authorized networks block the laptop | run as in-cluster Job; remove laptop IP after |
| Volume / runtime | tiny (7k rows) | none |
| Legacy defects not to copy | plaintext OTP storage, ordinal-stored enums, JSON-duplicated project state, dual naming `program` vs `new_program`, unvalidated `identity` field | see parity doc |

---------------------------------------------------------------------------

## 6. Implementation steps (suggested order)

1. Owner answers open questions (Section 7), especially Q1 (pilot course/program), Q2 (junk), Q4 (shared phone), Q5 (private R2 bucket).
2. Export snapshot: from the local `lms_click` copy run read-only `SELECT`s per scoped table (SQL in `nsrit-discovery-queries.sql` / `gen_counts.py` sets) into NDJSON with a manifest (counts + sha256). Strip or hash plaintext OTP/token columns at export time (never write them).
3. vNext migrations (proposed): register staged tables (4A), add gap columns (4B-4D), `legacy_id_map` tweaks and activity event module values (4E). Review, test on a fresh local Postgres (`lms_vnext_test`), then run the migrate Job on dev as in the redeploy recipe.
4. Build the loader `scripts/migrate/nsrit/` phases P0..P13 with unit tests for: uuid5 mapping, enum maps, timezone rules, attendance expansion, identity collapse, faculty ordinal map, JSON content_data unpacking, junk filter.
5. Integration test on local Postgres with the real snapshot (dry-run and apply); verify reconciliation numbers match Section 1.3 within documented rejections.
6. Build image, run `--dry-run` as a dev Job; review the report with the owner.
7. Take a Cloud SQL backup; run `--apply`; run validation queries; verify login on `nsrit42.development.42lms.com` with a test phone from `AUTH_TEST_PHONES` mapped to an imported test-like account only (no real OTP).
8. Add the ingress host rule for `nsrit42.development.42lms.com` (script exists, dry-run by default) only after owner approval; the college host serves only NSRIT.
9. Copy files R2-to-R2 (after bucket exists), re-run `--only=files`.
10. Final reconciliation report committed to `docs/`; decide go/no-go for keeping data; rollback available via `--rollback`.

---------------------------------------------------------------------------

## 7. Open questions for the owner

Q1. College 2 ("42Learn College", dept 8 "42 Learn FSD") holds program 7 "NSRIT Training in MERN Stack" and course 8 "NSRIT MERN Stack Training" with 106 discussions, 166 interviews and 365 job applications by 52 college-2 learners, which look like the original NSRIT pilot before college 6 existed. Course 9 "MERN Stack Training" under NSRIT is the migrated copy. Should college-2 data count as NSRIT, or only college 6?
Q2. "As is" versus clean: 78 of 80 departments, 4 of 8 programs, 24 of 27 classes and all electives are E2E/smoke/test data (including script-injection names). Load everything, or load real data only (4 real departments, the real programs/classes) and keep the rest out? Same for 4 test-looking learner accounts (non-nsrit emails) and 20 archived project workspaces.
Q3. Is real student/faculty PII (names, phones, emails, DOB, addresses, résumés, ID numbers) allowed in the vNext dev database and cluster? Should phone/email be replaced by masked values for non-owner users?
Q4. One NSRIT phone is shared by a learner and a faculty account with different names and emails; 2 NSRIT phones and 2 emails also exist on accounts outside NSRIT; 2 recruiters share a phone/email with NSRIT people. vNext allows one user per phone. For each group: merge into one person with two roles, or keep two people (then one needs a different phone/email)? I will list them (masked) for review.
Q5. Please create the private R2 bucket (`lms-vnext-private`) so resources/assignment files can be copied; videos (public host `42lms.in`): keep pointing at the existing public URLs or copy?
Q6. Notifications and audit: load 952 learner notifications and 869+73 audit rows as history, or skip them? The 721 pending outbox rows will not be loaded (they would send SMS/email).
Q7. Account-verification tables (learner_acct_verification 8, faculty_acct_verification 29 NSRIT rows; all `verify_status` unverified/false): they hold plaintext OTP and lockout state of the legacy login and all 151 learners show "never verified". vNext verifies by fresh OTP each login. Recommendation: do NOT import. Confirm.
Q8. Hosts: should `nsrit42.development.42lms.com` be created as an ingress rule now (it currently routes to the legacy dev app), and the production host `nsrit42.42lms.com` row left out?
Q9. Should faculty types be converted as proposed (ADMIN -> COLLEGE_ADMIN, MENTOR -> MENTOR, TPO -> TPO, others -> employment type)? 1 faculty account has a NULL type.
Q10. Offers/CTC and 61 HIRED applications: vNext offers hold only one annual CTC and expiry. Is losing fixed/variable/bonus/bond detail acceptable for the import, or must vNext schema be extended first (section 4C)?
Q11. Learner profile detail (address, skills, certifications, experiences, social links): store inside `profile_document` jsonb as legacy shape, or only the fields the vNext profile module currently understands?
Q12. Student photos (`student_image`) and Aadhaar/PAN field `identity`: skip entirely (recommended)?
Q13. Timezone confirmation: please confirm class schedule and deadline times in the legacy UI are shown as IST wall clock (evidence supports this) so we can convert naive IST to UTC.

Unverified items (I did not read legacy Java for every rule): exact shape of `learner.identity`, `faculty.metadata`, `learner.metadata`, JSON `content_data` variants beyond the types counted, and whether `student_assignment.student_id` is always a learner id. The parity audit file lists which logic differences were verified in code.

---------------------------------------------------------------------------

## 8. Stage 1 update (2026-10-16): schema prerequisites

See `nsrit-schema-prereqs.md` for the full need table. Now REAL in `drizzle/`: 0096 offer/role-option pay breakdown (typed nullable columns), 0097 `data_import_batches` + college-scoped `legacy_id_map` (batch id, source hash, same-college composite FK, RUNNING-batch guard), 0098 section min size/description, progress first completion/attempt, submission attempt/previous points, quiz shuffle flags. Migrations 0080-0095 (landed after this plan was written) also closed several section 4 items (project task/resource/delivery fields, recruiter grant validity, external offers, TPO email campaigns). Section 4A staged tables (lesson content settings/materials/sequences, course display facets, learner profile children, project audit tables) are intentionally NOT registered: profile detail goes to `profile_document`, audit history is skipped, and the remainder is a documented fidelity loss. Remaining gaps are listed in section 3 of the prereqs doc. The ETL has not been started. Migrations 0000-0098 apply cleanly on a fresh local Postgres.

---------------------------------------------------------------------------

## 9. Stage 2a update (2026-10-16): foundation and people loader (dry-run and local rehearsal only)

Code: `scripts/migrate/nsrit/` (export, loader, planner, guards, reports). Tests: `tests/unit/nsrit-migration-*.test.ts` (synthetic data only). Nothing has been run against the vNext dev cluster database; stage 2a was rehearsed only on a disposable local Postgres. Output of every run (snapshot, reports) stays outside the repository (a scratchpad or other private directory; `.gitignore` also blocks `scripts/migrate/nsrit/snapshot|reports`).

### 9.1 What stage 2a loads

Owner defaults (decision item 14) applied: college 6 only, real data only, IST naive times converted to UTC, no hosts (`tenant_domains` left out per Q8), no photos, no Aadhaar/PAN, no OTP/verification tables, no outbox.

| vNext table | Legacy source | NSRIT rows in snapshot -> loaded (rehearsal) |
| --- | --- | --- |
| `organizations`, `colleges` | `organization`, `college` (code = `unique_id`) | 1 -> 1, 1 -> 1 |
| `departments` | `department` | 80 -> 4 |
| `programs` | `new_program` (not legacy `program`); `duration_terms` = years x 2, raised to the highest legacy term | 8 -> 3 |
| `academic_periods` (derived) | distinct `batch.academic_year`, 1 July to 30 June; closed periods block cohorts and sections in vNext, so past years load ACTIVE | derived 2 |
| `cohorts` (+ progression state by trigger) | `batch` | 3 -> 3 |
| `sections` | `class` where `class_type = SECTION`; `upper_limit` 0 = unlimited (null capacity), `lower_limit` -> `min_size` | 27 -> 3 (6 elective-backed deferred, rest test data) |
| `program_terms` | `semester` | 5 -> 4 |
| `lecture_halls` | `lecture_hall` (`room_type` ordinal -> enum) | 47 -> 1 |
| `users`, `college_memberships`, `membership_roles` | `learner` (LEARNER), `faculty` (FACULTY + COLLEGE_ADMIN / MENTOR / TPO from the ordinal; employment type or title for the rest) | 151 learners -> 148, 11 faculty -> 5 |
| `learner_profiles` | `learner` + `qualification`: roll number, `unique_id` as registration number, `profile_document` jsonb in the vNext profile schema (education from `qualification`, skills, hobbies, links, address, certifications, achievements, languages, projects, experiences; identity numbers always empty) | 148 profiles; 10 education entries |
| `faculty_profiles` | `faculty` (primary department, employment type, title) | 5 |
| `learner_program_enrollments`, `section_enrollments` | `learner.class_id` -> section -> cohort -> program | 148, 148 |
| `data_import_batches`, `legacy_id_map` | provenance for every mapped row | 777 map rows |

Identity rules: `identity_uid = legacy:<learner|faculty>:<id>`, phone = E.164 `+91` + last 10 digits, e-mail lower-cased, display name = first + last. Soft-deleted people and rows with unusable phone and no e-mail are rejected. Suspended people load as SUSPENDED memberships.

Real-data-only rules (documented in `filters.ts`, nine named rules): E2E tokens, whole-word test/testing/dummy/sample/probe/demo/smoke/qa, audit-fix and slot-cap elective smoke names, HTML or script payloads, 8+ repeated characters, names over 120 characters, a reviewed list of placeholder names, reserved or test e-mail domains (example.*, testing.com, test.com, student.com, mailinator.com, .test and similar), test-token e-mail local parts, and soft delete. Free-text descriptions are NOT screened (a real cohort description may say "demo").

Rejections on the NSRIT snapshot: departments 76 (66 E2E, 7 repeated characters, 2 soft deleted, 1 placeholder), programs 5 (4 E2E, 1 duplicate AIML), semesters 1 (parent rejected), classes 18 test data + 6 deferred, lecture halls 46, learners 3 (2 reserved e-mail domain, 1 placeholder name), faculty 6 (4 E2E name, 1 reserved domain, 1 test-word name), recruiters 2 (test names). Note: the single NSRIT faculty of type TPO matched a test-name rule and was rejected, so the rehearsal has no TPO account; the owner should name a real TPO account if one exists.

Shared contacts: the review list covers every account in scope (including rejected test accounts). It found 1 group (one loaded faculty account sharing a phone with a rejected test learner and a rejected test recruiter), so nothing was blocked on the real data; the loader logic (oldest account loaded, later ones `BLOCKED_DUPLICATE`, no merge, plus `BLOCKED_DUPLICATE_EXISTING` for contacts already held by users the loader does not own) is unit tested.

### 9.2 How to run

```
# 1. Export (needs the legacy MySQL copy; start only mysqld on 3310, read-only, stop it afterwards)
tsx scripts/migrate/nsrit/export.ts --out=<private snapshot dir>

# 2. Dry run (default): everything inside one transaction that is rolled back
DATABASE_URL=postgresql://...@127.0.0.1:.../<db> tsx scripts/migrate/nsrit/load.ts --snapshot=<dir>

# 3. Apply / rollback (require ALLOW_NSRIT_IMPORT=I_ACCEPT)
tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --apply
tsx scripts/migrate/nsrit/load.ts --snapshot=<dir> --rollback=<batch-id>
```

Reports (`--out`, default `<snapshot>/reports`): `reconciliation-<mode>-<time>.md/json`, `rejected-rows-report.md`, `contact-review-list.md/csv`. All contain counts, reason codes, legacy numeric ids and masked references only.

Safety: the snapshot manifest (per-file sha256, row counts, overall digest) is verified before any connection; the target must be loopback unless `--allow-remote-dev` plus `ALLOW_NSRIT_REMOTE_DEV` are both set (never for production names); every write statement is checked against a table allowlist (no outbox, notification or messaging tables), covered by a static test; error text never echoes row values. Loader runs create a `data_import_batches` row (RUNNING, then COMPLETED or FAILED) and attach every mapped row in `legacy_id_map` with a source hash. Re-runs with the same snapshot are exact no-ops. `--rollback` deletes the rows mapped under a batch in reverse dependency order and marks the batch ROLLED_BACK; the organization and college rows are kept because batch rows reference the college (a later `--apply` reuses them). Rows updated by a later batch move to that batch, so roll back the batch that last touched them.

### 9.3 Local rehearsal (disposable embedded Postgres, migrations 0000-0098)

Export 6.5 s; dry-run 1.4 s load (7.6 s with process start); first apply 1.7 s (153 users, 777 map rows); second apply wrote nothing (every table `unchanged`, 0.5 s); rollback 2.6 s (all 777 map rows and the loaded rows removed, college kept); apply again 1.6 s with identical counts. Validation queries all passed (no row outside the NSRIT college, no membership without a role, no enrollment without a section enrollment, no duplicate roll numbers, mapped counts equal planned counts).

### 9.4 What stage 2b still needed (superseded by 9.5 and 9.6)

* Courses (`courses`, `course_offerings`, `course_section_deliveries`, learning paths, lessons, `lesson_contents`, `program_term_courses`) and teaching assignments (`course_teaching_assignments`, `section_faculty_assignments`): offering and delivery derivation per course and class.
* Academics activity: schedule events, attendance (legacy stores only absentees: expand present learners for marked sessions), learner content progress, assignments and submissions (round points half up, see schema prerequisites 4.2), quizzes, questions, options, attempts, answers, announcements, classroom messages.
* Electives: the 6 deferred elective-backed classes and their groups, slots and offerings (all current data is archived or smoke data; decide whether any is real).
* Placements: companies and recruiter profiles (2 recruiters were rejected as test accounts, the loader reports accepted ones as deferred), grants, jobs, rounds, applications, screenings, offers (`bond_amount` stays null, see 4.1), seasons, registrations, eligibility, TPO collaboration.
* Projects: workspaces, templates, sprints, tasks, members, resources, meetings, deliveries.
* Notifications (learner in-app only, via synthesized `PLATFORM` activity events, never the outbox) and files (R2 dev prefix for keys, public video URLs kept). `resume_url` and `video_intro_url` are in the snapshot but not loaded.
* Cohort progression: batches whose legacy `current_semester` is above 1 (1 of 3) load at term 1, because the vNext progression trigger only allows one-term promotions through its writer; advance them with the promotion workflow after review.
* Before any run on the dev cluster: migrations through 0098 applied by the migrate Job, the `OUTBOUND_ALLOWLIST_ONLY` messaging switch in place (the real people now exist as contactable users), a database backup, and the owner's go-ahead for the dev target flags.

### 9.5 Stage 2b-i update (2026-10-16): academics loader (local rehearsal only)

Code: `scripts/migrate/nsrit/` (`plan-academics.ts`, `mappers-academics.ts`, `db-academics.ts`, `reconcile.ts`, `reports-academics.ts`, `verify.ts`; `load.ts --stage=2b`). Tests: `tests/unit/nsrit-migration-academics.test.ts` (synthetic data only). Same export -> NDJSON snapshot -> idempotent loader pattern (deterministic UUIDv5 ids, `legacy_id_map` + `data_import_batches`, table allowlist extended with the 22 academics tables, never an outbox, notification or messaging table, no storage key ever written, dry-run default, loopback-only guard unchanged). Nothing was run against the vNext dev cluster database. Stage 2b-i has its own batch (`loader_version nsrit-2b-1`; 2a rows keep `nsrit-2a-1`, so a 2a re-run stays a no-op). Roll back 2b-i before 2a (2b rows reference 2a rows).

Export additions (40 tables in total): `semester_course`, `course`, `lesson`, `lesson_contents`, `lesson_content_class_sequence`, `faculty_course_mapping`, `faculty_teaching_assignment`, `faculty_course_associations`, `learner_content_progress`, `student_assignment`, `class_schedule`, `attend`, `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `quiz_answers`, `classroom_messages`, `announcements`, `lms_group` (+ member, member_event, rule), `elective_slot`, `elective_offering`. A stage 2a snapshot still loads (the 2b tables are optional on read; the 2b planner refuses to run without them).

#### How the legacy structure maps (decisions)

* **Delivery** = every (course, class) pair with accepted evidence: a teaching assignment, a faculty-course mapping, a lesson content, a quiz, a scheduled class or a classroom message. **Offering** = (course, cohort), period = the cohort start period (the one 2a gave the sections), credits/type/order from `semester_course` of the program (credits 1..30 else null). One **learning path** per offering (title = course name, PUBLISHED). Legacy lessons belong to a course, so each is copied into every offering that uses it (items in a class of that cohort) and, when it has no items at all, into every offering of its course; lesson names that collide in a path get ` (2)`, sequences are renumbered densely (51 renumbered). Within a lesson and delivery, contents, assignments and quizzes share one dense order (legacy sequence, then kind, then id), which also satisfies each table's unique-sequence index.
* **Lesson contents.** vNext has RESOURCE, VIDEO, YOUTUBE, LIVE_CLASS; VIDEO requires a storage key, so the 221 legacy videos (public `42lms.in` CDN URLs, duration 0) load as RESOURCE with `external_url` = the existing public URL (never a storage key); the legacy type, duration, thumbnail and schedule flags go to `legacy_id_map.metadata.unmapped`. Legacy `resource` rows (private object keys; 129 loaded, 4 more rejected as deleted) load as RESOURCE with the note "Attachment pending file migration." and the legacy key list in metadata (files are a later stage). `enabled` or `active` = 0 -> DRAFT and `visible_to_students` false. Signed or credentialed URLs are never copied (0 in NSRIT).
* **Assignments** (`lesson_contents.content_type = assignment`) -> `course_assignments`: `deadline` (IST) or `due_date` end of day IST -> `due_at`, `points` -> `max_points` (round half up; 1..10000, so **0 points is rejected `ZERO_POINTS`**: 10 legacy rows). The HTML description is converted to plain text and the raw HTML is kept only in metadata (never rendered); attachment file references and allowed submission types go to metadata.
* **Submissions** (`student_assignment`): a row with no `submission_type` is a placeholder created when the assignment was assigned, not a submission (`NOT_SUBMITTED`, 107; its `assignment_contents` file is the teacher's attachment copy). `PDF_UPLOAD` submissions are FILE submissions, which vNext only accepts with a READY, scan-attested file row (deferred trigger from migration 0080), so all **31 are deferred** `SUBMISSION_FILE_AWAITS_FILES_STAGE`, each with a provenance-only map row carrying object key, mimetype and size (no original file name). TEXT/LINK mapping, graded points rounded half up (rejected if above `max_points`), `attempt_number`, `previous_points`, `graded_by` (fallback: the delivery's primary teacher) and `is_grade_published` are implemented and unit tested; the NSRIT data has **0 loadable submissions** and 0 graded rows (all 146 legacy rows are `NOT_GRADED`).
* **Progress**: video progress loads with `first_completed_at` (falls back to `completed_at`) and `attempt`. Progress rows on assignment contents (147 of 167) have no vNext row because assignment completion is derived from the submission (`NO_VNEXT_TARGET`).
* **Schedule and attendance.** Rule (legacy `getAttendancePercentage`): a session is *held* when `start_time` is at or before the snapshot export time; every `attend` row is an absence (null status = ABSENT; EXCUSED/MEDICAL/LATE also count as absence in legacy, and vNext counts only PRESENT as attended). Held sessions load as MARKED (marker = legacy `faculty_id`, else the delivery's primary teacher, else a college admin; `marked_at` = `attendance_marked_at`, else the earliest absentee row, else the session end); each learner actively enrolled in the section with no absentee row gets a derived PRESENT row (enrollment x session). Not-held sessions stay UNMARKED and their absentee rows are rejected `SESSION_NOT_HELD`. Counts reconcile per session: records = active enrollment (validation check). **All 20 NSRIT schedule rows are titled "Demo Attendance Session N" (created in one second, exactly 10 absentees each), so real-data-only mode rejects them (`NAME_TESTWORD`) and the 200 absentee rows follow (`PARENT_REJECTED`)**: attendance loads 0 rows. To prove the path anyway, `--rehearsal-keep-demo` (loopback database only) keeps them: 20 sessions, 200 absent + 800 derived present = 1000 records = 20 x 50 learners.
* **Quizzes**: 89 of 91 (2 soft deleted), all PUBLISHED, class-scoped (fixed delivery); questions 439 and options 1487 loaded in full (types SINGLE/MULTIPLE_CHOICE; a SINGLE question with several correct options would become MULTIPLE, 0 here); `total_points` is recomputed as the sum of question points (0 differ); shuffle flags and `is_grade_published` -> `results_published`. Attempts: legacy status SUBMITTED only (vNext attempts have no status column and no in-progress state); answers get prompt and option snapshots, selected legacy option ids are mapped to the new option ids (unresolved ids are dropped and counted). 8 attempts and 42 answers loaded; attempt score equals the answer point sum for all 8.
* **Discussion and announcements**: `classroom_messages` -> `course_discussion_messages` (2 of 3, 1 soft deleted); `announcements` -> `announcements` (receiver COLLEGE/DEPARTMENT/PROGRAM/CLASS/LEARNER/FACULTY mapped to the vNext receiver ids, sender `ADMIN` -> `COLLEGE_ADMIN`), 1 of 1 loaded, plain-text body.
* **Electives: nothing loaded, by decision.** All 6 deferred elective-backed classes, 17 slots, 24 offerings, 26 groups, 36 members, 45 member events and 1 rule are archived, smoke or audit named, or test named (13 of 17 slots and 18 of 26 groups hit the name rules; 4 of the 6 classes are "SMOKE2/SMOKE3/AUDIT-VERIFY"; the 2 "Professional Elective 1" ones are archived trial structure). A vNext elective offering must be backed by a course delivery of a real section, and a legacy GROUP_BACKED class has no cohort, so loading would mean guessing. They are rejected `ARCHIVED_ELECTIVE` (or by the name rule) and listed; any non-archived elective would stop as `ACTIVE_ELECTIVE_NEEDS_OWNER_REVIEW` (none remains after the name rule). The owner can overrule this for the two "Professional Elective 1" slots.
* **Grades and marks** have no table of their own in vNext: assignment points live on `assignment_submissions`, quiz scores on `quiz_attempts`.

#### Result on the NSRIT snapshot (counts only)

| vNext table | rows loaded | main legacy sources and rejections |
| --- | ---: | --- |
| `courses` | 19 | 23 legacy; 4 soft deleted |
| `course_offerings` / `course_section_deliveries` / `course_learning_paths` | 20 / 20 / 20 | derived (18 deliveries for the 50-learner section, 1 each for classes 6 and 10) |
| `course_teaching_assignments` / `faculty_course_associations` | 20 / 20 | 29 teaching assignments + 18 mappings: 18 mappings duplicate an assignment (`DUPLICATE_SOURCE`), 8 point at test classes of rejected sections (`PARENT_REJECTED`), 1 at an archived elective class |
| `course_lessons` | 68 | 74 legacy; 4 soft deleted, 2 test named; copies per offering |
| `lesson_contents` | 350 | 354 video/resource rows; 4 soft deleted; 221 videos as public references, 129 resources with file pending |
| `course_assignments` | 19 | 31 legacy; 2 soft deleted, 10 zero points |
| `course_quizzes` / `quiz_questions` / `quiz_options` | 89 / 439 / 1487 | 91 quizzes; 2 soft deleted |
| `assignment_submissions` | 0 | 146 legacy: 107 not submitted, 7 soft deleted, 1 on a rejected assignment, 31 deferred (files) |
| `learner_content_progress` | 20 | 167 legacy; 147 on assignment contents (`NO_VNEXT_TARGET`) |
| `quiz_attempts` / `quiz_attempt_answers` | 8 / 42 | all loaded |
| `section_schedule_events` / `attendance_sessions` / `attendance_records` | 0 / 0 / 0 | 20 demo-named schedule rows and 200 absentee rows rejected (see above) |
| `course_discussion_messages` | 2 | 3 legacy; 1 soft deleted |
| `announcements` | 1 | 1 legacy |
| electives (class, slot, offering, group, member, event, rule) | 0 | 6 + 17 + 24 + 26 + 36 + 45 + 1 rejected |
| provenance-only map rows (deferred submission files) | 31 | file references only |

Rounded decimals: 0 values in the real snapshot (the rule is exercised by synthetic tests: 2.5 -> 3, 7.5 -> 8, counted in `roundedToInteger`).

Derived-count reconciliation (`reconcile.ts`: legacy-computed from raw rows with the legacy rules, vNext-computed from the loaded tables): progress 50 of 50 learners match, marks 6 of 6 match (quiz scores; no graded assignments), attendance 0 compared in the real-data load and **50 of 50 match in the demo rehearsal**, 0 mismatches in either. `verify.ts` (through vNext's own services) also matched the legacy attendance percent for 5 of 5 sampled learners (the service rounds to a whole percent).

#### Rehearsal (disposable embedded Postgres 54329, migrations 0000-0098, fresh `db-test-prepare` database)

2a dry-run 1.4 s, 2a apply 1.6 s, 2a re-apply no-op. 2b-i: dry-run 2.5 s load (3.1 s with reads), first apply 2.6 s load (3.0 s), re-apply 0.2 s load (0.8 s, every table `unchanged`, 31 provenance rows unchanged), rollback of the 2b-i batch 7 s wall (all 2,675 map rows and loaded rows removed, 2a rows and college kept, batch `ROLLED_BACK`), apply again 3.2 s load with identical counts. Wall clock per process (node start included) 3 to 11 s. Validation checks all passed (mapped counts equal planned for every table, contents attached to a delivery of their own offering, one record per enrolled learner for every marked session, quiz total points equal question point sums). Export of the 40 tables took 9 s. Note on resources: free RAM was 2.3 to 2.6 GB (below the 3 GB rule) because other apps held the memory, so `mysqld` was started once for about 90 seconds with a 96 MB buffer pool and the performance schema off, and stopped right after the export (verified: no process, port 3310 closed). The embedded Postgres was stopped at the end.

#### vNext findings (none blocked the load; nothing in `src/` was changed)

1. `lesson_contents` cannot hold an external or CDN video as VIDEO (VIDEO requires `storage_key` and forbids `external_url`), so the 221 legacy videos are RESOURCE links and lose player semantics and duration until the files stage (or a model change that allows `VIDEO` with an external reference).
2. `quiz_attempts` has no status or in-progress state (legacy has `status`; NSRIT has only SUBMITTED, so nothing is lost today).
3. FILE submissions cannot exist without a READY, scan-attested file row, so migrated submitted files must go through the files stage with checksums and attestation; there is no "legacy import" attestation path.
4. `course_assignments.max_points` of 0 is not representable (CHECK 1..10000); 10 legacy zero-point assignments were rejected.
5. vNext attendance percent is a whole number (`Math.round`), legacy is a double; both count only held sessions, and only PRESENT as attended (legacy counts every `attend` row as an absence).
6. The `announcements` table is still described as a draft in `src/db/schema/db10-announcements.ts` although migration 0076 created it and the service reads it; the schema file header is stale.

Services exercised by `verify.ts` against the loaded data (all returned what the database holds: 18 checks OK, 0 errors): `listLearnerCourseDeliveries`, `getLearnerCourseWorkspace`, `getLearnerAssessmentOverview`, `getLearnerAttendanceWorkspace`, `listCourseDiscussionMessages`, `getFacultyCourseList`, `getFacultyPublishedGradebook`. Run it with `NODE_OPTIONS=--conditions=react-server` (some services import `server-only`).

### 9.6 What stage 2b-ii still needed (superseded by 9.7)

* Placements: companies and recruiter profiles (the 2 recruiters were rejected as test accounts; accepted ones are still reported as deferred by 2a), recruiter grants, jobs, rounds, applications, screenings, offers (`bond_amount` stays null), seasons, registrations, eligibility, TPO collaboration, placement announcements.
* Projects: workspaces, templates, sprints, tasks, members, resources, meetings, deliveries.
* Learner in-app notifications (synthesized `PLATFORM` activity events, never the outbox).
* Files and video assets (R2 dev prefix for keys): lesson resource files (129 contents flagged `filePending` in `legacy_id_map.metadata.unmapped`), the 31 FILE submissions (provenance rows wait under `new_entity_type = assignment_submissions`), assignment and resource attachments, profile files. Loading a file replaces the placeholder note with a real `storage_key` or, for submissions, creates the submission together with its READY file row.
* Owner decisions still open: the two archived "Professional Elective 1" structures (loaded or not), whether the 20 "Demo Attendance Session" rows and their 200 absences count as real (they are demo seed by name and timing), and the 10 zero-point assignments.
* Before any run on the dev cluster: unchanged from 9.4 (migrations through 0098 by the migrate Job, `OUTBOUND_ALLOWLIST_ONLY` in place, a database backup, the owner's go-ahead for the dev target flags).

### 9.7 Stage 2b-ii update (2026-10-16): placements, projects, notifications (local rehearsal only)

Code: `scripts/migrate/nsrit/` (`plan-placements.ts`, `plan-projects.ts`, `plan-2bii.ts`, `mappers-2bii.ts`, `db-2bii.ts`, `reconcile-2bii.ts`, `reports-2bii.ts`; `load.ts --stage=2bii`; `verify.ts` extended). Tests: `tests/unit/nsrit-migration-2bii.test.ts` (synthetic data only, 44 tests). Same export -> NDJSON snapshot -> idempotent loader pattern as 2a and 2b-i (deterministic UUIDv5 ids, `legacy_id_map` + `data_import_batches` with `loader_version nsrit-2b-2`, table allowlist, dry-run default, loopback guard unchanged). Nothing was run against the vNext dev cluster database. Roll back 2b-ii before 2b-i before 2a.

Export additions (40 tables in the 2b-ii group, 80 in the snapshot): `college_company`, `company_domain`, `company_alias`, `recruiter_college_access_capability`, `tpo_college_settings` (access validity and verification switches only), `app_setting` (college 6 `module.*` keys only), `placement_season`, `placement_batch`, `placement_registration`, `placement_eligibility(_event)`, `placement_debarment`, `external_placement`, `learner_saved_job`, `job_preferences`, `learner_academic_record`, `job`, `job_round`, `round_slot`, `round_assignment`, `round_result`, `job_application`, `application_screening`, `job_application_status_history`, `job_offer`, `interview`, the 13 `project_*` tables and `notification`. Contact columns (company and recruiter contact name, e-mail, phone, notes), interviewer names, free-text application notes, resume history, the denormalised JSON copies on `project_workspace` and every person display-name column are withheld at export time. The 2a `company` spec was widened (companies of college 6 from `college_company`, jobs and recruiters) and still exports name, site and flags only. Older snapshots still load (the 2b-ii tables are optional on read; the 2b-ii planner refuses to run without them).

#### How the legacy structure maps (decisions)

* **An application is decomposed.** vNext applications are only `SUBMITTED` or `WITHDRAWN`; shortlisting is the screening row, interview progress is round results, offered or hired is the offer. Legacy `APPLIED` = `SUBMITTED` + screening `PENDING`; `SHORTLISTED`, `INTERVIEW`, `OFFERED`, `HIRED` = screening `SHORTLISTED`; `REJECTED` = screening `SHORTLISTED` when a round was failed or an offer exists, else screening `REJECTED` with the legacy reason as candidate message; `WITHDRAWN` = application `WITHDRAWN`. The submission history row (null to `SUBMITTED`) is written for every application; only the first legacy decision (APPLIED to SHORTLISTED or REJECTED) becomes screening history, the later pipeline moves are derived in vNext (`NO_VNEXT_TARGET`). Legacy automated skill-match screening (58 rows) has no vNext target. Application role option = the offer's role name, else the job's only or primary option; one application per (role option, learner).
* **Jobs.** `REQUEST` (recruiter drive request) loads as `DRAFT` and keeps `wasRequest` in metadata; `PUBLISHED`, `CLOSED`, `CANCELLED` keep their meaning (published date = posted date, closed date = closed or cancelled date). A job without a season gets the college's current season (`jobSeasonDefaulted`). Work mode is only implied by the free-text location (`hybrid`, `remote`), `drive_mode` OFF_CAMPUS with an external apply link is `EXTERNAL_ONLY` only when the job has no internal application, else `HYBRID`. `category` DREAM sets `is_dream` (0088). The CTC range text becomes min/max annual INR (LPA x 100000, round half up); a monthly stipend is never converted (kept in map metadata). Role options use the 0096 pay breakdown columns (`fixed_lpa`, `variable_lpa`, `joining_bonus_lpa`, `bond_months`, `bond_amount`); **`bond_amount` is never written and the loader stops (`BondAmountPresentError`) if any role option or offer carries a value** (0 do).
* **Eligibility policy** (one per loaded job): minimum CGPA to hundredths, minimum percentages to basis points (0087, round half up, counted), `minPctThroughout` to `min_pct_throughout_basis_points`, `verifiedMarksOnly` to `require_verified_evidence` (0089), passing years, `batchIds` and `target_batch_id` to cohorts, `target_class_id` to sections (0086), `programIds`, `target_program_id` and branch names (whole-word match on program name or code) to programs; unmapped ids and branches are counted, gender, PG minimum and target department stay in metadata.
* **Rounds** are normalised so every vNext lifecycle check holds: a SCHEDULED round without a date or venue becomes PENDING, a COMPLETED round without a date takes the last update time and, without a venue, an on-campus placeholder venue text (counted); `IN_PERSON` is on campus. Slots keep capacity and a booked count taken from the per-learner assignment rows (the assignment rows themselves have no vNext table).
* **Round results** keep version order per (round, application); only the latest is current, earlier ones are `SUPERSEDED`; scores round half up to 0..100; a failing candidate gets the application's rejection reason, else a fixed text, as the required candidate message (counted).
* **Offers**: `RELEASED` = `ISSUED`, `ACCEPTED`, `DECLINED`, `REVOKED/CANCELLED` = `WITHDRAWN`; pay breakdown to the 0096 columns, headline `annual_ctc_inr` = CTC LPA x 100000; expiry, acceptance channel (0085/0096), disputable-until and cascade id are kept; a missing responder is the learner; two active offers on one application keep only the newest active (older = `WITHDRAWN`, counted); offer history rows (issued, accepted or declined or withdrawn) are written.
* **Recruiters and grants.** Both NSRIT recruiters were rejected as test accounts (test names), so 0 recruiter users, profiles or grants load (their 2 access rows and 6 capability rows are `PARENT_REJECTED`). The loader path is implemented and unit tested: platform user (no college membership) + `placement_recruiter_profiles` + `placement_recruiter_college_grants` with `valid_until` = the legacy value, else `granted_at` + the college `recruiter_access_months` (NSRIT: 6); `verification_status` from the legacy verification (VERIFIED and VERIFIED_DOMAIN are `VERIFIED`, anything else stays `PENDING` and is counted: **no ACTIVE grant is ever marked verified without a legacy verification, and a PENDING grant is inert in vNext until the TPO verifies it**); capabilities map DRIVE_REQUEST and DRIVE_WORK to DRIVES (COLLEGE_OVERVIEW has no vNext capability and is kept in metadata; a grant that maps to nothing gets the default DRIVES and is counted). A recruiter sharing a phone or e-mail with a loaded person is blocked, never merged.
* **Companies** are global in vNext: 11 of 12 load (1 test name), plus 2 synthesized from job company names when the job had no company id and no unique name match (`Infosys`, ambiguous between two legacy rows, and `TCS`, which matches no legacy row). Companies that already exist under another owner (by name or domain) are reused, not duplicated (`placement_companies_existing` provenance row, never written or deleted by the loader). Primary domain = first verified legacy domain, else the website host; a domain already owned by another company is dropped (counted). College relationships come from `college_company` (trusted flag, owner); contact details and notes are dropped by design.
* **Season, module switches, registration, decisions.** The season end date is missing in legacy (`start + 365 days`, counted). `module.placements.enabled` and `module.projects.enabled` load into `module_access_rules` (college scope; **without the placements rule vNext keeps the module off and every learner placements page fails**; an existing administrator rule for the same scope and module is left untouched). Registrations load as `source = BACKFILL` (a `SELF` registration needs an open registration window in vNext) and need consent for PLACEMENTS (`NO_CONSENT` otherwise); the batch lifecycle (invite and deadline) loads by cohort; eligibility decisions map BATCH to COHORT, CLASS to SECTION, LEARNER to MEMBERSHIP (INELIGIBLE needs a reason); the append-only eligibility events are not loaded (audit history).
* **Projects.** Every vNext instance needs a template version: when the workspace's own template is test data (all 46 NSRIT templates are soft deleted, E2E or test named) the loader creates a synthetic ARCHIVED `Legacy import: <title>` template with one version whose blueprint is built from the workspace's own loaded releases, sprints, tasks and resources and validated with the vNext blueprint schema. Releases, sprints (dense sequence per release, at most one ACTIVE, a "Backlog (legacy import)" sprint for tasks that had none), tasks (status, priority CRITICAL for URGENT, estimate 0..1000, assignee only when the learner is loaded, a BLOCKED task without reason gets a fixed reason), task comments, members (the legacy mentor of the workspace is the one primary mentor, other faculty are CO_MENTOR, removed members load as ended history, `can_mutate` true), resources (link resources keep the URL, file resources load as "Attachment pending file migration" with the legacy reference in metadata, visibility Mentor Only to MENTOR_ONLY, everything else TEAM), meetings (status SCHEDULED or COMPLETED needs a meeting URL in vNext and legacy NSRIT meetings carry none, so they load as REQUESTED with the legacy status in metadata; a missing end time is start + 30 minutes), final delivery (draft, submitted, changes requested, approved with its review and lock event) and template assignments. The real-data filter rejects soft-deleted, E2E, test-word and ARCHIVED workspaces (`ARCHIVED_WORKSPACE`; all 20 legacy ARCHIVED ones were already soft deleted, E2E named or test named, so the name and delete rules rejected them first). Children use a narrower name rule (E2E and markup only) because a real task is called "Add integration tests" and a real round "Written test".
* **Notifications.** Each learner notification gets one `activity_events` row (module `PLATFORM`, event type `legacy_import.notification`, importance LOW, subject = the legacy notification id, metadata = batch id and legacy id only, summary = the notification's own title, dedupe key `legacy-import:nsrit:notification:<id>`) and one `in_app_notifications` row with the legacy title and message, unread or read exactly as in legacy (read time = legacy update time; all 310 loaded rows are unread). **The loader never writes an outbox, delivery, campaign or messaging row** (static test over every loader source). Rows without a learner recipient (27, faculty or class addressed), soft-deleted rows (146), rows that mention an E2E token (80), rows that mention the title of a rejected workspace, job, company, task or template (388) and rows pointing at a rejected application are not loaded, each with a reason code.
* **Rollback of registrations.** Registration auto-audit rows are append-only (immutability trigger plus a restrict foreign key). The rollback therefore runs, inside the rollback transaction, exactly `ALTER TABLE placement_batch_registration_events DISABLE TRIGGER db08_registration_events_no_mutation`, the delete of the audit rows of the batch's mapped registrations, and the matching `ENABLE TRIGGER`; these three statements are whitelisted word for word in `guards.ts` (`ROLLBACK_ONLY_STATEMENTS`) and nothing else outside the table allowlist is possible. This needs table-owner rights; if the dev role lacks them the rollback stops and the recovery path is the backup. Debarments, external offers and learner academic evidence have 0 NSRIT rows and a loader that stops with `UnsupportedLegacyRowsError` if any appear (no silent drops); interviews (0 rows) likewise.

#### Result on the NSRIT snapshot (counts only)

Export `021ee160caf9` (exported 2026-10-16). Rows loaded (inserted on first apply) and legacy rows rejected, by reason:

| vNext table | loaded | legacy source and rejections |
| --- | ---: | --- |
| `module_access_rules` | 2 | 2 `app_setting` module switches |
| `placement_companies` / `placement_company_relationships` | 13 / 13 | 12 legacy: 1 `NAME_TESTWORD`; +2 synthesized from job company names; 11 `college_company` (1 `PARENT_REJECTED`) |
| recruiter users / profiles / grants | 0 / 0 / 0 | 2 recruiters rejected as test names in 2a; 2 grants and 6 capability rows `PARENT_REJECTED` |
| `placement_seasons` | 1 | 1 legacy (end date derived) |
| `placement_jobs` / role options / eligibility policies | 10 / 11 / 10 | 17 legacy: 6 `NAME_TESTWORD` (ids 44, 45, 46 and 52, 53, 54 whose company name is a test name), 1 `SOFT_DELETED` |
| `placement_job_rounds` / `placement_hr_interview_slots` | 9 / 0 | 15 rounds: 6 `PARENT_REJECTED`; 7 slots `PARENT_REJECTED`; 15 `round_assignment` rows `NO_VNEXT_TARGET` |
| `placement_applications` / status history | 30 / 30 | 61 legacy: 30 `PARENT_REJECTED` (drives rejected), 1 `SOFT_DELETED` |
| screenings / screening history | 30 / 16 | 58 automated screenings `NO_VNEXT_TARGET`; 82 legacy history rows: 16 mapped, 50 `PARENT_REJECTED`, 16 `NO_VNEXT_TARGET` (derived pipeline moves) |
| `placement_round_results` | 20 | 48 legacy: 28 `PARENT_REJECTED` |
| `placement_offers` / offer history | 5 / 10 | 9 legacy: 4 `PARENT_REJECTED`; 5 loaded are ACCEPTED (legacy 7 ACCEPTED, 1 DECLINED, 1 RELEASED in total) |
| `placement_batch_lifecycles` / `placement_batch_registrations` | 1 / 45 | 1 / 45 legacy, all loaded (40 PLACEMENTS with consent, 5 HIGHER_STUDIES) |
| `placement_eligibility_decisions` | 2 | 2 legacy; 2 append-only events `AUDIT_HISTORY_SKIPPED` |
| `placement_saved_jobs` / `placement_candidate_preferences` | 1 / 1 | all loaded |
| `project_templates` / versions | 2 / 2 | both synthetic; 46 legacy templates rejected (15 `SOFT_DELETED`, 29 `NAME_E2E`, 2 `NAME_TESTWORD`), 60 versions and 42 college assignments `PARENT_REJECTED` |
| `project_instances` | 2 | 40 legacy: 12 `SOFT_DELETED`, 23 `NAME_E2E`, 3 `NAME_TESTWORD` |
| releases / sprints / tasks | 13 / 50 / 198 | 49 sprints + 1 synthesized backlog; 256 tasks: 58 `PARENT_REJECTED` |
| task comments / members / resources / meetings | 25 / 6 / 2 / 1 | 90 / 95 / 45 / 40 legacy, the rest `PARENT_REJECTED` (1 meeting `SOFT_DELETED`); 1 meeting downgraded to REQUESTED |
| final deliveries and events | 0 / 0 | 10 / 10 legacy, all in rejected workspaces |
| `activity_events` / `in_app_notifications` | 310 / 310 | 952 legacy: 146 `SOFT_DELETED`, 388 `PARENT_REJECTED`, 80 `NAME_E2E`, 27 `NO_RECIPIENT`, 1 `PERSON_NOT_LOADED` |

First apply wrote 1,181 rows; the re-apply wrote 0 (every table `unchanged`).

Other notes (all counted in the report): 163 placement or project actions had no loaded actor and are attributed to the college admin (`actorFallback`; the legacy TPO account 26 and the legacy `created_by` of most drives was rejected as a test-named account in 2a), 3 tasks without a sprint went to the backlog sprint, 1 task assignee not loaded, 2 jobs defaulted to the current season, 1 round delivery detail defaulted, 2 resume references (applications) and 0 offer letters, 0 resource or delivery file references (files stay for a later stage).

**Derived numbers (legacy-computed vs vNext-computed, `reconcile-2bii.ts`)**: placed learners 5 vs 5; offers per application 30 of 30 applications match; applications per drive 5 of 5 drives match; accepted CTC total 3,136,000 INR vs 3,136,000 (5 of 5 drives match per drive); application stage consistent with the loaded screening, results and offers 30 of 30; project progress with the vNext formula (done tasks + completed sprints over tasks + sprints) 2 of 2 match. The legacy stored `project_workspace.progress` value is 0 for both loaded workspaces while the work is 17% and 96% done, so the two "legacy stored value" lines are listed as mismatches (informational: the legacy column is not maintained). The task text mentions 61 HIRED applications; the legacy data has 61 applications in total (7 HIRED, 5 of them on loaded drives, 5 distinct learners).

#### Services exercised by `verify.ts` (extended; same read-only rules)

On the final rehearsal database: 37 checks OK, 9 empty as expected, 0 errors, 0 mismatches. Services: `listOwnPlacementApplications`, `getOwnLearnerOfferBrowse`, `getLearnerPlacementJourney`, `getOwnLearnerNotificationHistory` (first page of 40 of 75 to 91), `listMyProjectInstances` (learner and primary mentor), `getProjectInstanceWorkspace` (12 releases, 48 sprints, 184 tasks, 2 resources equal the database), `listProjectAdminSnapshots`, and as college admin `listCollegeDrives` (10 of 10), `getCollegeDriveOverview`, `listCollegeDriveApplications` and `getPlacementReportWorkspace`. Not exercised: the recruiter pipeline (no recruiter loaded) and the TPO-only services (`getTpoApplicantPipeline` needs a TPO account; the legacy TPO was rejected). `verify.ts` now accepts `--allow-remote-dev` (same acknowledgement as the loader) for the dev cluster. Run with `NODE_OPTIONS=--conditions=react-server`.

#### vNext findings (nothing in `src/` was changed)

1. **Learner placements are off unless the placements module rule exists** (`module_access_rules`, default false): the loader loads the legacy switches, but a dev database restored without them shows no placements to learners.
2. **Registration audit is immutable**, so a loaded batch of registrations cannot be removed by plain deletes (see the rollback note above).
3. **`placement_job_cohort_targets` is a staged schema file with no migration**; cohort targeting is carried by `allowed_cohort_ids` on the eligibility policy.
4. **Meeting status SCHEDULED or COMPLETED requires a meeting URL** while legacy meetings carry only a provider name; legacy NSRIT meetings therefore load as REQUESTED.
5. **Season end date is mandatory** in vNext; legacy allows it to be empty.
6. **Time zone evidence**: legacy `job_round.scheduled_date` and `round_slot.starts_at` cluster at :30 offsets (04:30, 05:00, 08:30) that look like UTC rather than IST wall time. The loader follows the owner default (naive times are IST) for every column; if these are UTC the rounds and slots would show 5 h 30 min early. One-line change per column in `plan-placements.ts` once the owner confirms.
7. Applications of rejected drives, rounds of rejected drives and notifications about rejected entities are dropped as `PARENT_REJECTED`; the rejection report lists the legacy ids only.

#### Rehearsal (disposable embedded Postgres 54329, migrations 0000-0098, fresh `db-test-prepare` database)

`mysqld` was started for about 90 seconds (96 MB buffer pool, performance schema off, free RAM 2.9 GB) twice (once for the export, once for a one-table addition; the full export of 80 tables takes about 19 s) and stopped right after each export (verified: no process, port 3310 only in TIME_WAIT). Loader timings per process (wall, node start included, in the logs): 2a dry-run 1.8 s, 2a apply 1.5 s, 2a re-apply 0.7 s (no-op); 2b-i dry-run 3.7 s, apply 2.3 s, re-apply 0.7 s (no-op); **2b-ii dry-run 1.7 s (load 1.2 s), first apply 2.4 s (load 1.7 s), re-apply 1.0 s (load 0.3 s, 1,181 rows `unchanged`, 0 inserted or updated), rollback of the 2b-ii batch 4.3 s wall (all loaded rows removed in reverse dependency order, including the 45 registration audit rows and the 1,147 map rows of the batch; 2a and 2b-i rows untouched), apply again 1.6 s with identical counts**. Validation: 47 checks PASS, 0 FAIL on every apply. The embedded Postgres was stopped at the end.

#### What remains after stage 2b-ii

* Files (later stage, dev R2 prefix): the 129 lesson resource files, the 31 PDF submissions, 2 application resume references and any project attachment (0 in loaded projects).
* Not loaded by decision or for lack of a target (counts in `reports/rejected-rows-report-2bii.md`): audit history, the outbox, TPO CRM leads, TPO collaboration threads, placement announcements, campaigns, bells, saved views, drive change requests (see `NOT_LOADED` in `plan-2bii.ts`); debarments, external offers, academic evidence and interviews have 0 NSRIT rows and the loader stops if rows appear.
* Owner decisions: see the final report of the stage (real TPO account, UTC versus IST for rounds and slots, merge of the duplicate Infosys and TCS companies, whether jobs 44, 45 and 46 are real, whether the 11 soft-deleted real-looking project workspaces (ids 1 to 11) should load as ARCHIVED history, and faculty or class addressed notifications).

## 10. Dev load runbook (stages 2a, 2b-i and 2b-ii; runbook only, NOT executed)

Target: the vNext **dev** database `lms_vnext` (Cloud SQL `forty-two-prod-1`, namespace `lms-dev-2026`). Never the production namespaces, never the old LMS. Everything below needs the owner's explicit go-ahead for the day it runs; the local rehearsal in sections 9.3, 9.5 and 9.7 must have passed on the same snapshot.

1. **Pin the code.** Build and push the images for the git sha that contains migrations 0000-0098 and this loader (`gcloud builds submit`, isolated `CLOUDSDK_CONFIG`, PowerShell; `docs/` deployment notes). The migrator image must contain `scripts/migrate/nsrit/**`, `tsx`, and the repository `src/` (the verifier imports services).
2. **Cluster access.** Add the operator IP to the master authorized networks, use the isolated kubeconfig, and write down the removal step; remove the IP when finished.
3. **Migrate the dev database to the latest migration.** Run the migrate Job from the migrator image (`npm run db:migrate`). Confirm the last applied migration is 0098 (`drizzle.__drizzle_migrations` count equals the journal) before anything else. The loader preflight also checks the columns it needs and stops with a clear message otherwise.
4. **Backup.** `gcloud sql backups create --instance=forty-two-prod-1` (dev data lives in the same instance; daily backups and 7-day point-in-time recovery exist, an on-demand backup gives a named restore point) and note the backup id and the current time. Optional: `pg_dump` of database `lms_vnext` into a private bucket. The registration rollback needs table-owner rights; if the app role cannot disable the trigger the recovery path is this backup.
5. **Confirm messaging safety (before any real person exists in the database).** `src/modules/messaging/runtime-safety.ts` (`canContactRecipientAtRuntime`) allows a real contact only when `APP_ENV=production`; any other value, including unset, contacts only recipients on `AUTH_TEST_EMAILS` and `AUTH_TEST_PHONES`; the provider adapters call it for every send (`providers.ts`, `service.ts`). This default is the `OUTBOUND_ALLOWLIST_ONLY` safeguard named earlier in this plan. Check, without printing values: the `vnext-auth` secret has `APP_ENV=development`, the two lists contain only test recipients and none of the imported NSRIT contacts (compare counts, not values), no CronJob or Deployment other than `vnext-auth-purge` runs scheduled sends in `lms-dev-2026`, and `vnext-integrations` still points at the dev R2 bucket. Consequence to tell the owner: imported NSRIT users cannot receive a real OTP in dev unless their number is deliberately added to the allowlist. The loader itself writes no outbox, delivery, campaign or messaging row (static test) and stores notifications already delivered.
6. **Create the snapshot and deliver it.** Export locally with only `mysqld` on 3310 (96 MB buffer pool, performance schema off, free RAM above 2.5 GB, read-only session; stop `mysqld` and verify it is gone afterwards): `tsx scripts/migrate/nsrit/export.ts --out=<private dir outside the repo>`. Keep the directory private (it contains personal data), note `manifest.json` `snapshotSha256`, then `tar czf`. Start a loader pod from the migrator image with the dev `vnext-db` secret as `DATABASE_URL` (an `emptyDir` volume, `command: sleep`), `kubectl cp` the archive in (about 3 MB), extract, and let the loader verify every file hash against the manifest before it connects. Do not put the snapshot in an image, a ConfigMap, a bucket or the repository.
7. **Flags and acknowledgements (all three are required for a non-loopback target).** `--allow-remote-dev` on every command, `ALLOW_NSRIT_REMOTE_DEV=I_ACCEPT_DEV_ONLY_NSRIT` in the pod environment, and `ALLOW_NSRIT_IMPORT=I_ACCEPT` for `--apply` and `--rollback`. The loader refuses a database or host whose name contains `prod`.
8. **Dry-run, review, apply, reconcile per stage, in this order.** For each of `--stage=2a` (default), `--stage=2b`, `--stage=2bii`: first `load.ts --snapshot=<dir> --out=<report dir> --allow-remote-dev [--stage=...]` (dry-run, everything rolled back), read `reconciliation-*.md` and the rejected-rows reports (validation all PASS, rejections explained, derived mismatches only the documented ones), then the same command with `--apply`. Record the batch id printed for each stage. A second `--apply` with the same snapshot must report every table `unchanged` (idempotency check). After the last stage run `NODE_OPTIONS=--conditions=react-server tsx scripts/migrate/nsrit/verify.ts --snapshot=<dir> --allow-remote-dev --out=<report dir>`; any ERROR, MISMATCH or unexpected empty result is a finding, not something to patch around.
9. **Stop conditions.** Preflight failure (missing migration or stage), `BondAmountPresentError`, `UnsupportedLegacyRowsError`, a failed validation check, a derived-number mismatch outside the documented ones, or any guard error: stop, do not retry with other flags, report.
10. **Rollback.** `load.ts --snapshot=<dir> --allow-remote-dev --rollback=<batch id>` in reverse order: the 2b-ii batch, then the 2b-i batch, then the 2a batch (organization and college rows are kept). Roll back the batch that last touched the rows (rows updated by a later batch moved to it). Each rollback is one transaction. If the registration trigger statements are refused for lack of privileges, restore from the backup of step 4 instead.
11. **After the load.** Delete the snapshot and the loader pod, remove the operator IP from the authorized networks, keep the reports (counts, reason codes and legacy ids only) outside the repository, and update this document with the dev batch ids, counts and timings. Browser acceptance of the loaded college is a separate orchestrator step.

## 11. Dev load executed (2026-10-17)

Owner delegated the data work on 2026-10-17 and the load ran against the vNext **dev** database (`lms_vnext`, namespace `lms-dev-2026`; production untouched).

- Code: image tag `584000c7` (migrator, nsrit-loader) and web `5e656f0c`; migrations 0000-0132 applied (133 in the journal) by the migrate Job after an on-demand Cloud SQL backup (id `1792220812044`, taken 2026-10-17 07:06 UTC).
- Snapshot: `snapshot2bii-b` (sha256 `021ee160caf96e4f...`), delivered by `kubectl cp` into the loader pod, hashes verified by the loader before connecting.
- Batches: 2a `f88de14d-c8f6-45a4-a321-bc6518d89815`, 2b `a700c2f6-0972-49ec-986d-04eec63e6728`, 2bii `22bab432-08fe-4698-9694-dba8ee4ccf12`. Re-applying every stage left the row counts unchanged (idempotent).
- Result: college `nsrit42`, 152 memberships (147 learners), 10 drives, 30 applications, 2 projects, 310 notifications. Only the 2 documented project-progress mismatches remain.
- Verifier on dev: 37 checks OK, 9 empty as expected, 0 errors, 0 mismatches.
- Sign-in: imported people keep real contacts and cannot receive real codes in dev (allowlist only). `scripts/migrate/nsrit/qa-personas.ts` adds the college address `nsrit.development.42lms.com`, fictitious admin / TPO / recruiter accounts, and swaps the contacts of five representative real people for fictitious test contacts (originals kept in a private mapping outside the repo; `--restore` puts them back and removes the QA users; run it before cutover). `scripts/verify/nsrit-qa-login.mjs` signs every persona in against the live host (8 of 8 pass).
- Rollback: `load.ts --rollback=<batch id>` in reverse order (2bii, 2b, 2a), or restore the backup above.
