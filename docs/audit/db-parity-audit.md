# DB parity and logic audit: legacy LMS vs vNext

Date 2026-10-16. Read-only. Companion to `nsrit-migration-plan.md`. Legacy = Spring/MySQL (`lms-dev-2026`, 9993beec; DB copy `lms_click`, 228 tables, no triggers/views/routines/events). vNext = Next/Drizzle/Postgres (migrations 0000-0079 plus staged drafts under `scripts/sql`).

Summary counts: rule/parity rows 73 (S1 5, S2 28, S3 22, S4 19, other n/a), vNext logical defects 11 (academics) + 3 (placements: no accept cascade, imported eligibility keys, missing allowlist), schema migrations 5 groups (A-E below, ~40 tables/columns), loader transformations 22, legacy defects not to copy 10. Coverage: academics/attendance/grades/progress/quizzes/groups/notifications audited in depth by a sub-agent; placements, identity/auth verified for the main rules only (Part 3 lists what is NOT yet audited: interviews, TPO CRM/campaigns, projects, profile verification).

## Prioritised fix list

### A. Schema migrations needed (proposed, numbering from 0080)
1. Register staged tables: `lesson_content_settings`, `lesson_content_materials`, `lesson_content_delivery_sequences`, `lesson_content_discussions`, `course_display_contents`, `assignment_submission_files`, `assignment_grade_events` (fixes b3), `attendance_record_events`, `course_quiz_lifecycle_events`, learner profile education/identity/video/images/private-doc tables, `learner_import_batches(+members)`, project audit tables, skills catalog, `outbound_messages` and `general_notification_outbox` (fixes h4), `scheduled_job_leases` (h3).
2. Columns: `learner_content_progress.attempt/first_completed_at/duration_seconds` (c4); `course_quizzes.shuffle_questions/shuffle_options` (d7); `assignment_submissions.is_late/attempt_number/previous_points` (e1, b3); `sections.min_size/description` (f5); course identity/metadata facets (slug, short/formal title, subscription days, parent); lesson content `deleted`/`deleted_with_lesson` tombstone.
3. Placements: policy columns (gender, PG %, throughout %, verified-only, CGPA conversion rule); offer compensation breakdown + disputable window + cascade id + acceptance channel; recruiter capability and access fields; announcements/bells/campaigns/asks; relationship contact notes; job `evaluation_config`, `important_dates`, REQUEST lifecycle value.
4. Projects: instance progress/phase/blocker/dates/sprint length/estimation unit/readiness override; sprint dates/goal/timestamps; task assignee/due/estimate/type/blocker/approach; resource visibility/pin/link; meeting attendees/action items/retro/reminder; delivery lock/file metadata.
5. Import support: `legacy_id_map` batch id (or metadata convention), `activity_events` modules `data_import`/`legacy_audit`.
Also: a CHECK or trigger that `lms_groups.capacity` equals `elective_offerings.capacity` (f11).

### B. vNext logic fixes (grouped so builder lanes can take them)
* Attendance lane: a6 (S1), a5, a4, a12, a14, a7, a8, a9 notification, a11 (12 h cap), a13 college at-risk query.
* Course content / learner reads lane: g1 (S1 visible_to_students filter in learner joins, progress scope, downloads), c2, c4, g2.
* Assessment lane: e1 deadline decision + late flag, d2 duplicate/empty answers, d4 due_at required, d8 transition predicate, d6 auto-close, d7 shuffle, b3 grade history, b2.
* Academics/groups lane: f2 year rollover, f3 end teaching assignments on promotion, f7 waitlist promotion on capacity increase, f8 elective term check, f9 move semantics, f5 limits, f1 graduate execute.
* Notifications lane: h1, h2 fan-out, h3 due-reminder job, h4 outbound queue; add `OUTBOUND_ALLOWLIST_ONLY` for non-production (i8).
* Placements lane: p6 accept cascade + `max_held_offers`/`min_response_hours` enforcement (S1/S2), p1 missing criteria, p2 policy default for imports, p5 transition table diff, p7 debarment drive counting, p10 REQUEST status.
* Auth/identity lane: i1/i2 collision handling in any importer or admin flow; keep OTP stricter-than-legacy rules.
* Not yet audited: interviews, TPO CRM/campaigns, projects, profile verification (see Part 3).

### C. Data-load transformations needed (for the NSRIT loader)
1. UUIDv5 ids + `legacy_id_map`. 2. Phone E.164 / email lowercase; identity collapse (1 shared-phone group manual). 3. `faculty_type` ordinal -> membership roles + employment type. 4. `is_deleted` -> archived/deleted timestamps or skip. 5. Naive UTC vs IST per column; date-only deadlines -> 23:59 IST. 6. Attendance expansion (absentee-only rows -> per-learner records for MARKED sessions; NULL -> ABSENT; reject orphans). 7. `content_data` JSON unpack (file_dto, link, html, due_date, time_zone). 8. Assignment grading status map; `points` precision. 9. Quiz answers snapshot rebuild; MCQ -> SINGLE_CHOICE. 10. CTC LPA -> INR; CGPA x100; pct x100. 11. Application/offer/job/round status maps; HIRED -> accepted offer. 12. `eligibility_json` -> policy columns (drop ignored backlog keys; branches by name). 13. `ctc_range` text parse. 14. class -> cohort/section/delivery derivation; GROUP_BACKED -> groups. 15. batch -> cohort + academic period + progression state. 16. profile columns -> `profile_document`; `identity` -> last4 only. 17. project JSON blobs reconciled with child tables. 18. announcement receivers -> ids. 19. notification -> in_app_notifications + synthesized activity events. 20. never import OTP/token/handoff/blocklist/outbox/invite hashes. 21. file keys -> R2 prefix. 22. junk filter option (`--fidelity=clean`).

# Part 1: Schema parity (legacy MySQL `lms_click` vs vNext Drizzle/Postgres)

Sources: legacy column inventory `legacy-columns.txt` (information_schema), legacy Java enums/entities (branch lms-dev-2026, 9993beec), vNext `src/db/schema/*.ts`, `vnext-columns.txt`, `drizzle/0000-0079`, staged drafts `scripts/sql/*.draft.sql`.

## 1.1 Cross-cutting conventions

| Topic | Legacy | vNext | Difference / severity | Fix |
| --- | --- | --- | --- | --- |
| Primary keys | `int`/`bigint` auto-increment; numeric ids reused across tables (learner 6, faculty 6, class 6) | `uuid` (`defaultRandom`) | S3: need deterministic UUIDv5 + `legacy_id_map` | loader (plan section 3.3) |
| Identity | three account tables (`learner`, `faculty`, `recruiter`), phone is the join key, `user`/`login_user`/`role` tables empty | `users` (unique `phone_e164`, unique `lower(email)`, `identity_uid` NOT NULL unique) + `college_memberships` + `membership_roles` | S2: same phone for two different people cannot exist; no password anywhere | collapse rules, manual review (plan 3.2) |
| Faculty role | `faculty.faculty_type` stored as enum ORDINAL (0..14), mixes employment type and auth roles | `membership_roles` (LEARNER, FACULTY, COLLEGE_ADMIN, MENTOR, TPO) + `faculty_profiles.employment_type/academic_title` | S1 if loader reads ordinal wrong (ADMIN=4, MENTOR=13, TPO=14; do not reorder) | ordinal lookup table in loader, test pinned to Java enum |
| Soft delete | `is_deleted` bit/tinyint, nullable (NULL treated as false); partially inconsistent (`workspace.status ARCHIVED` also used) | `archived_at` / `deleted_at` timestamps per table, `status` enums | S3 | map `is_deleted=1` to `archived_at = updated_at`; tables lacking the column: skip + report |
| Timestamps | `datetime(6)` naive. Audit columns are UTC wall time (JVM UTC), schedule/deadline columns are IST wall time (evidence: hour histograms) | `timestamptz` everywhere; some tables carry explicit `timezone` text | S1 if converted wrongly (5h30m shift on schedules/deadlines) | per-column timezone table (below) |
| Booleans | `tinyint(1)`/`bit(1)` nullable, default 0/1 | `boolean NOT NULL` | S3: NULL -> false | loader coalesce |
| JSON | long `text`/`json` blobs (`content_data`, `eligibility_json`, `profile fields`, project `overview/sprints/tasks/...`) | normalized child tables + `jsonb` for a few documents (`profile_document`, `blueprint`, `criteria_json`) | S2: project JSON blobs duplicate child tables (two sources of truth in legacy) | take child tables as truth; verify blob/child agreement during dry run |
| Numeric marks | `student_assignment.points/points_obtained` and quizzes score columns (type: see column list) | `assignment_submissions.points_awarded`, `quiz_attempts.score/max_score` | S2 precision: confirm `numeric` scale in drizzle/0xxx.sql vs legacy decimals | check types before load; use `numeric(8,2)` |
| Money/percent | CTC `decimal` LPA (`ctc_lpa`, `fixed_lpa`...), CGPA/pct decimals | `annual_ctc_inr` integer; `cgpa_hundredths`, `*_basis_points` integers | S2: unit conversion | LPA x 100000 rounded; CGPA x100; pct x100 |
| Text limits | mostly `varchar(255)`; large text for JSON; department name has a 200-char row | `varchar(N)` / `text` varies | S3: reject long values or truncate with report | preflight length check |
| FKs | only 65 DB FKs in 228 tables; no FK to college | FKs `ON DELETE restrict` everywhere, `college_id` on most tenant tables, composite same-college guards in staged drafts | S2: legacy orphans (23 `attend` rows) violate vNext FKs | orphan reject list |
| Status sets | free-form strings (`application_status`, `lifecycle_status`, `task_status` DONE/COMPLETED duplicates, `question_type` MCQ/SINGLE_CHOICE) | pg enums from `src/modules/*/constants.ts` | S2: unknown value = insert failure | explicit lookup maps |
| Version/optimistic lock | `version` columns (Hibernate `@Version`) on many tables | `version` on selected tables | S4 | start at 1 |
| Derived/aggregate columns | `batch.current_students`, `lms_group.active_count`, `class` limits, `usage_count`, `job.counts`, `recruiter_lead` counters, `progress` on workspace | `lms_groups.active_count` only | S3: recompute after load | validation queries |

### Timezone rule table (verified by hour histograms on the legacy copy)

| Column(s) | Interpretation | Evidence |
| --- | --- | --- |
| `*.created_at`, `updated_at`, `submitted_at`, `graded_at`, `applied_at`, `status_updated_at`, notification times | naive UTC | JVM runs UTC; hours spread across 24h (`notification.created_at` peaks at 02:xx/20:xx/13:xx/09:xx) |
| `class_schedule.start_time/end_time` | naive IST | 09-11h dominate (class hours) |
| `quizzes.due_at` | naive IST | 09-15h only |
| `lesson_contents.deadline` | naive IST, 23:59 | all at 23:xx |
| `content_data.due_date` | mixed: date-only (13), ISO `...Z` UTC (29), 4-char year-like junk (1) | string lengths 10/24/4 |
| `job.application_deadline`, `job_round.scheduled_date`, `interview.scheduled_date` | to verify per column (suspect IST) | not yet histogrammed |

## 1.2 Entity-level schema gaps (legacy columns vNext lacks or stores differently)

| Entity | Legacy columns with no vNext equivalent | Stored differently | Constraint/enum notes | Sev |
| --- | --- | --- | --- | --- |
| college | chair/vice-chair ids, `landmark` kept, `logo` string | `code`=`unique_id`, status enum | `unique_id` unique in both | S4 (intentional) |
| department | `dept_chair_id`, `dept_vice_chair_id` | `archived_at` | legacy no unique(name,college); 80 NSRIT departments with duplicates by design | S4 |
| program | `end_year`/`start_year` (legacy table) | `new_program.duration_years` -> `programs.duration_terms` | `code` required in vNext (legacy none) | S3 |
| batch | `current_semester`, `academic_year`, `current_students`, `start/end_date`, `status` | `cohorts` + `academic_periods` + `cohort_progression_state(current_term_number,current_academic_year_start,version)` | progression events table is new | S2 |
| class | `lower_limit`, `upper_limit`, `description`, dates, `class_type`, `roster_group_id` | `sections.capacity` only | no floor limit | S2 |
| learner | ~30 profile columns (`achievements`, `hobbies`, `identity`, `portfolio`, `projects`, `coding_profiles`, `video_intro_*`, addresses current/permanent, `blood_group`...) | `learner_profiles.profile_document` jsonb + staged child tables | documented shape needed; `identity` must not be copied raw | S2 |
| faculty | `awards`, `publications`, `research_gate`, `google_scholar`, addresses... | `faculty_profiles.profile_document` jsonb | `organizations` json dropped | S3 |
| course | `slug`, `formal_title`, `short_title`, `default_subscription_days`, `parent_course_id`, `version`, `allowed_for_display`, `enabled`, `active`, `contents` json, `*_key` normalised keys | `courses(department_id,name,code,description,status)` | staged drafts add facets | S2 |
| lesson | `active`, `enabled`, `version`, `lesson_name_key` | `course_lessons.status` | merge active+enabled into status | S3 |
| lesson_contents | `class_id`, `faculty_id`, `points`, `deadline`, `course_name`, `deleted_with_lesson`, JSON blob | `lesson_id`+`delivery_id`, `visible_to_students`, `starts_at/ends_at`, materials/settings staged | blob has file_dto/link/html/time_zone | S2 |
| learner_content_progress | `duration_seconds`, `first_completed_at`, `attempt` | `last_position_seconds`, `completed_at` | staged draft adds attempts | S2 |
| student_assignment | `attempt_number`, `previous_points`, `graded_by`, `html_content`, `submission_assets`, `submission_type` values, `semester_number`, name snapshots | `assignment_submissions` (submission_type enum, `version`, `grading_status`, `grade_published`) | legacy `grading_status` NOT_GRADED/AUTO_GRADED/... | S2 |
| quizzes | `shuffle_*`, `faculty_id`, `class_id`, `active`, `enabled` | `course_quizzes.results_published`, delivery scoped | `status` only PUBLISHED in data | S3 |
| quiz_attempts/answers | `status`, `selected_option_ids` | answers hold prompt/options snapshots (vNext richer) | reconstruct snapshots | S2 |
| attend | row = absentee only; `drop_class_reason`; `attendance_status` NULL/EXCUSED/MEDICAL/LATE | `attendance_records` per learner per marked session with status enum; `attendance_sessions` | semantic inversion (see logic part) | S1 if mis-mapped |
| class_schedule | `attendance_marked_at`, `lecture_hall_id`, `course_id` | `section_schedule_events` + `section_schedule_event_courses` + `attendance_sessions` | | S3 |
| notification | `notification_type`, `context_label`, `application_id/job_id/interview_id`, `scheduled_at`, `delivery_*` | `in_app_notifications(title,body,action_href,read_at)` + `activity_events` | | S3 |
| project_workspace | progress, phase, blocker, next_action, due_label, class_id, readiness override, sprint length, estimation unit, JSON blobs | `project_instances` minimal | | S2 |
| project_task/sprint/meeting/resource/delivery | see plan section 2 | `project_*` minimal; staged audit tables | | S2 |
| job | `eligibility_json`, `evaluation_config`, `role_options_json`, `drive_mode`, `category`, `important_dates`, `host_college_name`, `requires_external_registration`, ... | `placement_jobs` + role options + eligibility policy + cohort targets | lifecycle enum differs | S2 |
| job_application | `resume_history`, `external_ref`, `public_ref`, `pap_requested`, `applied_by_college*`, `current_round_id`, `ineligible_flag_at` | `placement_applications(channel,status,eligibility_status,eligibility_snapshot)` | | S2 |
| job_offer | fixed/variable/bonus/bond, `respond_by`, `accepted_disputable_until`, `cascade_id`, `acceptance_channel`, `joining_status`, `verified_by` | `placement_offers(annual_ctc_inr, expires_at)` + joining outcomes | | S2 |
| recruiter_college_access | `valid_until`, `verification`, `hiring_for_company_id`, `agency_for_company_name`, capability rows | `placement_recruiter_college_grants(status)` | | S2 |
| TPO | campaigns, bells, announcements, asks/mentions | partial | | S2 |

## 1.3 Constraints and indexes that matter for behaviour

* Legacy: unique `college.unique_id`; unique keys on `course_name_key`, `short_title_key`, `lesson_name_key`, `active_course_key` (elective_offering) used to enforce naming/duplicate rules; `attend` presumably unique (class_schedule_id, student_id) (verify); `lms_group_member` unique (group, member). vNext: staged drafts carry stronger triggers (same-college guards, tombstone version invariants, ancestry guards) that are not yet in `drizzle/`, so on dev today those protections are absent (see schema migration list).
* Not-null/default differences to check before load: `colleges.code` NOT NULL, `programs.code` NOT NULL, `courses.code`, `learner_profiles.roll_number` nullable.

# Part 2: Business-rule / logic parity (academics, assessment, attendance, groups, notifications)

Legacy paths are under `42LMS-BACKEND/lms/src/main/java/com/_42students/lms/` (abbrev `L/`); vNext under `lms-vnext/src/modules/` (abbrev `V/`). Line numbers approximate (+-5). Severity: S1 wrong results/data loss, S2 behaviour differs, S3 minor, S4 improvement. Legacy has no triggers, views, routines or events (verified in `information_schema`), so every rule is in Java. Rows marked "VERIFY" were reported by the sub-audit and should be confirmed by the builder lane when fixing.

## 2.1 Attendance

Model fact: legacy `attend` stores absentees only (row = absent whatever the status; NULL/EXCUSED/MEDICAL/LATE); vNext `attendance_records` is also absence-only in practice (constraint allows PRESENT, writers delete instead).

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| a1 | % denominator | `L/service/impl/LearnerServiceImpl.java:835-882`, `ClassScheduleRepository.java:31-43`: started non-deleted sessions; unmarked counted present | `V/attendance/model.ts:55-84` MARKED sessions only | vNext stricter, avoids phantom 100% | S4 | keep vNext; do not copy legacy |
| a2 | Threshold | per-college setting, default 75 (`ClassScheduleController.java:502-513`, `AdminAttendancePolicyController.java:49`) | `attendance_policies.eligibility_threshold_percent` default 75; exact integer compare `learner-attendance-threshold-model.ts` | consistent | S4 | none; import `app_setting attendance.eligibilityThresholdPercent` if set (0 rows for NSRIT) |
| a3 | Excused/medical/late | all count absent | `model.ts:72` counts only PRESENT as present; two different "absent" definitions (`model.ts` vs `learner-course-attendance-summary-model.ts:8`) | same policy, inconsistent labels | S3 | product decision; unify definitions |
| a4 | Faculty re-mark | revives soft-deleted row (`LearnerServiceImpl.attend` L520-631) | `V/attendance/faculty-service.ts:557-600` delete + reinsert absentees | admin-set EXCUSED/MEDICAL/LATE rows are dropped when faculty resubmits | S2 | apply the delta only; keep non-ABSENT rows |
| a5 | Admin correction window | admin bypasses window (`attend(dto,true)`) | `V/attendance/admin-service.ts:512-526` applies faculty window to admin; comment in `faculty-marking-window.ts:3-5` says it is not gated | admin cannot correct late | S2 | skip OPEN check for admin in `correctAdminAttendance` |
| a6 | Single-learner admin correction | does not mark session | `admin-service.ts:~630-650` upserts session to MARKED | marks whole session; all others become PRESENT; stale optimistic token | S1/S2 | do not auto-MARK; require MARKED first |
| a7 | Late joiner | implicit present | MARKED event + no record = PRESENT even if enrolled later (`model.ts:41`) | roster not snapshotted | S3 | exclude events ended before `section_enrollments.started_at` |
| a8 | drop_class_reason | `attend.drop_class_reason` | `attendance_records.note` varchar(1000) never populated by faculty/admin paths | reason not captured | S3 | accept optional note in `bulkInputSchema` |
| a9 | Parent SMS on absence | `LearnerServiceImpl.java:603-629, 649-677` | ABSENT | | S2 | emit via outbound contract (`V/operations/outbound-delivery-*`) |
| a10 | Marking window | not before start; after end + N h (default 24, per college) `LearnerServiceImpl.java:539-557` | `V/attendance/faculty-marking-window.ts` equivalent; policy bounds 1-168 h (migration 0033) | tighter bounds only | S3 | none |
| a11 | Schedule validation | start<end, max 12 h, same-college faculty/hall/course, conflict locks (`ClassScheduleServiceImpl`) | `V/attendance/faculty-service.ts:355-432` end>start only; DB exclusion constraint 0052 | no 12 h cap, past booking allowed | S3 | add cap to `sessionInputSchema` |
| a12 | Period boundary | n/a | `faculty-service.ts:367-373` builds `T00:00:00.000Z` (UTC) | boundary is 05:30 IST; 00:00-05:30 IST on first day rejected | S3 | use +05:30 construction or `indiaAttendanceMonthWindow` |
| a13 | At-risk list | `AdminCollegeDashboardController.java:157-175` (30 days, marked only) | ABSENT at college level | | S2 | add college query on `attendance_sessions MARKED` + policy |
| a14 | Multi-course event | one course per schedule row | `faculty-service.ts:~484` join `section_schedule_event_courses` `limit(1)` | may match wrong delivery | S3 | add `deliveryId` to WHERE |

Legacy defects not to copy: unmarked = present; numerator/denominator filter mismatch with clamp at 0; unique key ignoring soft delete forcing row revival.

## 2.2 Marks and grades

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| b1 | Grading status | NOT_GRADED/AUTO_GRADED/MANUALLY_GRADED + `graded` 0/1 | `V/courses/constants.ts:79` NOT_GRADED, GRADED (check `assessments.ts:221-236`) | import maps AUTO/MANUAL -> GRADED | S4 | loader map |
| b2 | Points bounds | 0..max (`L/service/impl/AssignmentServiceImpl.java:822-835`) | integer 0..max, `max_points` 1..10000 (`assessments.ts:112`) | legacy allowed `points=0` assignments | S3 | relax check to >=0 if needed |
| b3 | Grade audit trail | `GradeAuditLog` (`AssignmentServiceImpl.java:1093-1108`, table V47) | none; `db06-history-staged.ts` not migrated | regrade history lost | S2 | migration `assignment_grade_events` (staged) + write in same tx |
| b4 | Re-grade unpublishes | `updatePoints` sets `is_grade_published=false` (L841) | same, plus feedback required on re-grade | equivalent | S4 | none |
| b5 | Publish | requires graded, notification (L718-749) | `publishAssignmentGrade` requires GRADED + `expectedVersion`; no notification | notification missing | S2 | see h2 |
| b6 | Aggregates | `calculateAssignmentAveragePercentage` (L863-890) published only; `LearnerCourseHomeStatsServiceImpl.computeAssignmentAvg` (L372-390) counts ungraded as 0 | `V/courses/faculty-gradebook-model.ts` published+GRADED, unknown flagged | vNext correct | S4 | do not copy legacy home-stats |
| b7 | Rank | none exists | none | nothing to port | n/a | |
| b9/b10 | Learner masking, quiz grades in gradebook | `hideUnpublishedGrade` L702; latest attempt | `toLearnerSubmission`; `faculty-gradebook-service.ts:~55` latest + resultsPublished | equivalent | S4 | none |

## 2.3 Progress and completion

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| c1 | Timed completion | `L/service/impl/LearnerContentProgressServiceImpl.java:~75-130` 90% (setting), clamps position, client `completed` ignored for video | `V/courses/progress-service.ts:~340-395` constant 90 | threshold hard-coded | S3 | read from platform settings |
| c2 | Resume position | last write wins | `progress-service.ts:234` `greatest()` | rewind not honoured | S3 | store latest + separate max |
| c4 | Retakes | `first_completed_at`, `attempt` (V123, V132): per-attempt rows | ABSENT: one row per (membership, content) | retake concept lost | S2 | add columns (staged `db05-version-progress-attempts`) |
| c5 | Lesson completion | lesson with no trackable content counts complete (`LearnerCourseHomeStatsServiceImpl.java:~165`) | `learner-course-service.ts:1190` requires >0 items | vNext correct | S4 | do not copy |
| c6 | Overall percent | count based, `Math.round`; lesson uses `(int)` truncation | partial-credit `progressPoints` | formula differs | S3 | product confirm |
| c7/c8 | Quiz/assignment completion, start gate | submission = complete; no `starts_at` gate | MISSED state; `CONTENT_NOT_STARTED` | improvements | S4 | none |
| c3 | Un-complete | `completed:false` clears | one-way | | S4 | none |

## 2.4 Quizzes

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| d1 | Scoring | `L/service/impl/QuizServiceImpl.java:529-630` all-or-nothing, set equality | `V/courses/quiz-attempt-service.ts:168-258` same | same | S4 | none |
| d2 | Completeness | exactly one answer per question; rejects empty/dup | `quiz-attempt-service.ts:172` Map keeps last duplicate; missing = [] score 0; empty single-choice accepted | partial/dup submissions pass | S2 | reject duplicates/empty |
| d3 | max_attempts | 1-20 | DB check 1-20 + advisory lock | vNext race-safe | S4 | none |
| d4 | Due date required | required to publish/submit (L224, L541), IST | `due_at` nullable | quiz may never close | S2 | require `due_at` on PUBLISH (`quiz-service.ts:611`) |
| d6 | Result visibility | grade published AND past due (L1169) | CLOSED AND `results_published` (L442); nothing auto-closes | manual CLOSE needed | S3 | auto-close job |
| d7 | Shuffle | `shuffle_questions/options` (`QuizServiceImpl.java:925`) | ABSENT | | S2 | add columns + seeded shuffle |
| d8 | Transition TOCTOU | blocked if attempts/after due | `quiz-service.ts:611-680` update WHERE lacks `status = current` | race | S3 | add predicate |

## 2.5 Assignment deadlines and resubmission

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| e1 | Deadline | required; submission after deadline rejected, IST (`AssignmentServiceImpl.java:502-516`, `DEADLINE_ZONE` L546) | `V/courses/assignment-submission-service.ts:209-211` no gate, no late marker; comment wrongly claims legacy parity | late submissions accepted silently | S2 | decide: hard gate or `is_late` flag; fix comment |
| e2 | Resubmission | one per learner/assignment (`attempt_number` unused) | unique (assignment, membership) | same | S4 | none |
| e3 | Null due | required | nullable | | S3 | require at publish |

## 2.6 Batch/cohort progression, class limits, electives

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| f1 | Promotion | `L/service/impl/BatchServiceImpl.promoteBatch` L155-195, +1 term, max `durationYears*2`, CAS | `V/academics/college-batch-promotion-*.ts` version CAS + blockers | equivalent+; GRADUATE only previewed | S3 | add graduate execute |
| f2 | Academic year rollover | auto suggested on even->odd move (L169) | never advanced unless admin passes `yearStart` | | S2 | compute suggestion |
| f3 | End teaching assignments on promotion | `deactivateAssignmentsForBatchSemester` same tx (L173) | not done | faculty keep access to old term | S2 | end open `course_teaching_assignments` in `executeCollegeBatchPromotion` |
| f5 | Class limits | upper 1..500, lower >=0 (`ClassServiceImpl.java:183-196`) | `sections.capacity` 1..10000, no lower | | S3 | add `min_size`, enforce on enrolment path |
| f6 | Seat claim / waitlist | atomic `claimSeat` | `V/groups/service.ts:211-290` locks + check constraint | equivalent | S4 | none |
| f7 | Capacity increase promotes waitlist | `ElectiveService.java:370-374` | `college-group-management-service.ts:145-176` does not | learners stay waitlisted | S2 | loop `promoteEligibleWaitlist` |
| f8 | Elective eligibility by term | program + `current_semester == slot.semester_number` (`classEligibilityError` L556-575) | `V/groups/elective-eligibility.ts:19-47` ignores slot term when no period | any term may join | S2 | compare `cohort_progression_state.current_term_number` |
| f9 | Elective move into full offering | removes source first | `groups/service.ts:446-566` demotes ACTIVE to waitlist | | S3 | fail unless `allowWaitlist` |
| f11 | Two capacity columns | offering.capacity mirrors class upper_limit | `elective_offerings.capacity` and `lms_groups.capacity` | drift | S3 | single source |

## 2.7 Access/visibility

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| g1 | Hidden lesson content | `enabled`/`active` filters (`LessonContentsRepository.java:66-111,168,212-264`) | `lesson_contents.visible_to_students` (`courses.ts:390`) set by `college-content-visibility-service.ts` but NOT filtered in learner reads (`learner-course-service.ts:566-610`, `progress-service.ts`) | hidden content still visible and completable by learners | S1/S2 | add filter in learner join, `requireLearnerProgressScope`, downloads |
| g2 | Course `allowed_for_display` | hides card (`StudentCourseServiceImpl.java:222,298`) | staged `course-display-staged.ts` not live | | S3 | wire display model |
| g3/g4 | Faculty/learner scoping | `AccessControlService` | `hasFacultyDeliveryAccess`, `hasLearnerDeliveryAccess` | equal or stronger (see f3) | S4 | none |

## 2.8 Notifications

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| h1 | Class scheduled / absence notice | `ClassScheduleServiceImpl.notifyClassScheduled` L394 | activity events only; `deliverInAppNotification` used only in `V/placements/offer-service.ts` | learners get no in-app notice | S2 | fan out with `deliverInAppNotificationInTransaction` |
| h2 | Grade published / submission events | `COURSE_GRADE_PUBLISHED` (`AssignmentServiceImpl.java:1024-1090`) | none | | S2 | same |
| h3 | Due reminders | `NotificationSchedulerService.sendAssignmentDueReminders` L282 daily 09:00 IST, locked; interview reminders L180; scheduled release every minute L102 | ABSENT (lease runner exists `V/operations/scheduled-job-*`; schema drafts only) | | S2 | job on `scheduled-job-runner.ts` with idempotency key |
| h4 | Outbox | `notification_outbox` (V161/V193) | draft only (`db10-outbound-messages.draft.ts`) | no durable outbound channel | S2 | promote draft migration |
| h5 | Announcements | `announcements` receiver_type/value, schedule/expiry/pin | `V/announcements/service.ts` UUID receivers, checks | equivalent | S4 | import must map string receivers to ids |

## 2.9 vNext logical defects found (this part)

1. `V/attendance/admin-service.ts:~630-650` single correction marks whole session MARKED (a6).
2. `V/attendance/faculty-service.ts:367-373` UTC midnight boundary instead of IST (a12).
3. `V/attendance/faculty-service.ts:557-600` delete+insert drops admin statuses (a4).
4. `V/courses/quiz-attempt-service.ts:172` duplicate answers collapse; empty single-choice accepted (d2).
5. `V/courses/quiz-service.ts:611-680` transition update lacks current-status predicate (d8).
6. `V/courses/assignment-submission-service.ts:209-211` incorrect parity comment and unguarded late submit (e1).
7. `V/courses/learner-course-service.ts:566-610` no `visible_to_students` filter (g1).
8. `V/groups/service.ts:446-566` move into full offering demotes to waitlist (f9).
9. `V/academics/college-batch-promotion-*.ts` year not rolled, teaching assignments not ended (f2, f3).
10. `V/groups/college-group-management-service.ts:145-176` capacity increase does not promote waitlist (f7).
11. `V/courses/progress-service.ts:234` `greatest()` resume (c2).

## 2.10 Legacy defects NOT to copy

Unmarked sessions counted as present; soft-delete-blind numerator/denominator filters and clamp at 0; lesson with no trackable content counted complete; home-stats averages counting ungraded as 0; `Math.round` vs `(int)` mix; client-asserted `completed=true` for video; elective move removing source seat before checking target; fire-and-forget notifications with swallowed exceptions; per-row transactions via self-proxy; ordinal-stored enums (`faculty.faculty_type`); duplicated JSON state in project workspace; two program tables (`program` vs `new_program`).

# Part 3: Placements, TPO, projects, profile verification, identity/auth

Coverage note: the delegated deep audit of these areas did not return in time. The items below were verified by direct code reads by the coordinating agent (file:line given); everything under "NOT YET AUDITED" still needs a builder-lane review. Do not treat absence from this part as parity.

## 3.1 Placements (verified items)

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| p1 | Eligibility criteria set | `L/service/tpo/EligibilityService.java:324-380`: branches (by name), program ids, batch ids, passing years, min CGPA (converted to % by the college CGPA rule `MarksConversion.toPercent` when degree is graded in %), min % throughout, 10th/12th/diploma/UG/PG min %, `verifiedMarksOnly`, gender (diversity drive). **No backlog rule** (`JobEligibility.java:28`; old `maxActiveBacklogs` keys ignored) | `V/placements/eligibility-service.ts` + `placement_job_eligibility_policies`: allowed program ids, cohort ids, min CGPA, max active/past backlogs, 10th/12th/diploma/UG %, max gap years, passing years, `missing_evidence_policy` | vNext lacks: gender rule, PG %, "% throughout", branch-by-name, verified-marks-only flag, CGPA-to-percent conversion; vNext adds backlog and gap-year rules the legacy never enforced | S2 | add `min_pg_pct`, `allowed_gender`, `verified_only`, conversion rule columns to the policy table; on import map `branches` -> programs by name, drop ignored backlog keys, keep `minPctThroughout` in a new column |
| p2 | Missing data | missing marks = "Not provided" and PASSES (unless verified-only) (`EligibilityService.pctRule` L304-319) | `eligibility-service.ts:~740-760,1040-1050`: MISSING check; policy `REQUIRE_COMPLETE` -> NEEDS_DATA else ELIGIBLE_WITH_MISSING_EVIDENCE | vNext default depends on policy; imported drives should use the permissive policy to preserve legacy results | S2 | loader sets `missing_evidence_policy` = ALLOW_MISSING (name per enum) for imported jobs |
| p3 | Comparison | `>=` min (L350) | `actual >= required` / `<=` (L753) | same | S4 | none |
| p4 | Finished batch excluded | a finished placement batch makes learners ineligible unless override (`EligibilityService` L340) | `placement_batch_lifecycles.finished_at` exists (`batch-eligibility-policy.ts`) | VERIFY equivalence | S3 | confirm in builder lane |
| p5 | Application status machine | `L/util/JobApplicationStatusValidator.java:19-57`: APPLIED->SHORTLISTED/REJECTED/WITHDRAWN; SHORTLISTED->ASSESSMENT/INTERVIEW/REJECTED/APPLIED/WITHDRAWN/WAITLISTED; ASSESSMENT->INTERVIEW/...; INTERVIEW->SHORTLISTED/ASSESSMENT/OFFERED/WAITLISTED/REJECTED/WITHDRAWN; OFFERED->HIRED/REJECTED/INTERVIEW/WITHDRAWN; WAITLISTED->OFFERED/REJECTED/WITHDRAWN; REJECTED->APPLIED; WITHDRAWN terminal (re-apply path bypasses); HIRED->OFFERED | `V/placements/application-service.ts` and `placement_applications.status` enum | VERIFY the enum and transition table; NSRIT data uses APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, HIRED, REJECTED only | S2 | builder lane: diff transition tables; import maps HIRED -> vNext accepted-offer state |
| p6 | Accepting an offer cascades | `L/service/impl/JobServiceImpl.java:1140-1152,1419`: accept withdraws/declines the learner's other open applications ("accepted another offer"), with 48h reversal window (`L/service/tpo/TpoOfferService.java:203-219,290-331`, `accepted_disputable_until`, `cascade_id`) | `V/placements/offer-service.ts` accept path (L570-660) has no cascade over other applications and no disputable window | one learner can hold several accepted offers; `max_held_offers` policy field exists (`V/placements/tpo-policy-service.ts`) but VERIFY it is enforced on accept | S1/S2 | implement cascade + reversal in the accept transaction; enforce `max_held_offers`, `counts_as_placed_at`, `min_response_hours` (default 48), `uplift_pct` (default 40) |
| p7 | Debarment | `PlacementDebarment.java:38-59`: active while `lifted_at IS NULL` and (`until_drives` null or `drives_counted < until_drives`) and date not passed; `drives_counted` incremented per drive | `V/placements/debarment-service.ts` + tables `placement_debarments`, `_drive_events`, `_history`; `untilDrives` 1..10000 | VERIFY that drive counting increments and expiry is evaluated on apply; NSRIT has 0 debarments | S3 | builder lane |
| p8 | Offer money | fixed/variable/bonus/bond/respond_by | `annual_ctc_inr`, `expires_at` only | data loss | S2 | schema migration (plan 4C) |
| p9 | Placement registration | per season, choice PLACEMENTS/HIGHER_STUDIES, outcome label | per cohort (`placement_batch_registrations`) | keying differs (season vs cohort) | S2 | loader maps via learner class -> batch -> cohort |
| p10 | Drive lifecycle values | DRAFT, REQUEST, PUBLISHED, CLOSED, CANCELLED | `placement_jobs.status` + archived/closed timestamps | map REQUEST (college-requested drive pending approval) | S2 | VERIFY enum covers REQUEST; add if not |
| p11 | Dates | `job_round.scheduled_date` etc. naive IST | `scheduled_at` timestamptz + `timezone` | S1 if loaded as UTC | S1 | convert IST |

## 3.2 Identity and auth (verified)

| # | Rule | Legacy | vNext | Difference | Sev | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| i1 | Accounts per phone | several accounts per phone (learner + faculty) resolved by `AccountChoice`/`OrgMembershipService` | one `users` row per phone (`phone_e164` unique) + memberships | two different people on one phone cannot coexist | S2 | collapse rules / manual review (plan 3.2); NSRIT: 1 shared group |
| i2 | Email | not unique; may be blank | unique `lower(email)`; nullable | duplicate emails across accounts would fail insert | S2 | NSRIT: 0 duplicates inside NSRIT, 2 emails shared with non-NSRIT accounts |
| i3 | Phone placeholder | `PublicMobileAuthController.EMAIL_FIRST_PHONE = ""` (login attempts only, line 383) | n/a | accounts never carry a placeholder; attempts do | S3 | not imported |
| i4 | OTP lifetime/limits | 5 min expiry (L327, 511), attempts limit with "Too many verification attempts" (L637, 689), resend gap (L416) | 5 min, 5 tries shared SMS/email, 5 sends / 10 min, 30 s gap (`docs/architecture/first-party-login.md`) | equivalent or stricter | S4 | none |
| i5 | OTP storage | plaintext `otp`, `email_otp` columns in `mobile_login_attempt` and `*_acct_verification` | HMAC only | legacy defect | S1 (security) | never import; do not copy |
| i6 | Session revocation | `token_version` + `refresh_token_blocklist` | opaque device sessions server-side | different model | S4 | drop legacy |
| i7 | Super admin | principal id 0 | `system_roles` SUPER_ADMIN | | S4 | n/a |
| i8 | Non-prod send safety | test OTP service (`service/TestOtpService`) | `AUTH_TEST_*` fixed code for listed contacts; no allowlist for other recipients | real SMS to any registered number in dev | S2 | add `OUTBOUND_ALLOWLIST_ONLY` for non-production |

## 3.3 NOT YET AUDITED (builder lanes must review before claiming parity)

* Interview scheduling/feedback/reschedule rules (`interview.*`, `reschedule_request`), round results application (`round_result.applied_at/superseded_by`, auto-apply `results_auto_apply`), waitlist ranking.
* TPO: recruiter lead stages and `not_now_until`, campaigns (no vNext target), share-link staged columns, saved views, team thread asks, bell notifications, announcement fan-out (`PlacementAnnouncementService`), `ProfileVerificationService` (legacy `profile_verification` tables are empty for NSRIT).
* Projects: workspace readiness, sprint start/complete rules, task status machine (legacy has both `DONE` (187) and `COMPLETED` (10) for the same state; `BLOCKED`, `IN_REVIEW`), progress calculation (`project_workspace.progress` cached %), delivery review/lock, template versioning; `ProjectWorkspaceServiceImpl` is ~7000 lines.
* Learner profile completeness and verification sections.
