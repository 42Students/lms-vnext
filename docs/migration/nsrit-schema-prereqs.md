# NSRIT import: schema prerequisites (Stage 1)

Date 2026-10-16. Scope: schema only, no ETL. Companion to `nsrit-migration-plan.md` (sections 2, 4) and `docs/audit/db-parity-audit.md`. Owner defaults: `docs/decisions/2026-10-14-orchestrator-defaults.md` item 14.

Status key: REAL = in `drizzle/` migrations and the Drizzle schema; STAGED = only a draft under `scripts/sql/*.draft.sql` / `*-staging.sql` (NOT applied anywhere, no Drizzle export); MISSING = no draft and no table or column; ADDED = added by this stage (0096-0098).

Re-verified against `drizzle/0000-0095`: the plan (written when migrations ended at 0079) predates 0080-0095, which already made REAL: `assignment_submission_files` and storage/video assets (0080), project task assignee/details/resource visibility/final delivery/member kinds (0082-0084, 0090, 0091), `project_task_comments`, `project_delivery_events`, recruiter grant validity (0092), recruiter invite code (0093), external offers (0094), `placement_tpo_email_campaigns` + recipients (0095), job section targeting (0086), drive cancel/offer expired (0085).

## 1. Decisions

* **Offer pay breakdown = nullable typed columns, not jsonb.** Typed columns allow CHECKs (non-negative, bond months 0..120) and are what the staged DB-021 design (`db08-outcome-fidelity-staging.sql`) proposed. Units follow the legacy `DECIMAL(10,2)` lakh-per-annum columns (`*_lpa`, precision kept, no premature rounding). The existing single `annual_ctc_inr` keeps working and stays the headline figure; the breakdown columns are optional. Same breakdown added to `placement_job_role_options` (legacy `role_options_json` carries per-role package/bond). `bond_amount` has no unit suffix on purpose: the legacy unit is unverified and must be confirmed in the ETL discovery pass before load (do not guess).
* **Provenance = `data_import_batches` + college-scoped `legacy_id_map`.** The existing `legacy_id_map` (unique on legacy type + id + new type, global) is extended in place (no behaviour or code change; only a unit test touches it). Rows with a `college_id` are tenant scoped and unique per `(college, source_system, legacy_entity_type, legacy_id, new_entity_type)` because legacy ids collide across tables and colleges; rows without `college_id` keep the old global unique. `batch_id` is a composite same-college FK, and a trigger only allows attaching map rows to a RUNNING batch. Rollback = delete rows reachable from the batch's map rows in reverse dependency order, then the map rows, then mark the batch ROLLED_BACK. A batch cannot be re-opened: a re-run creates a new batch and updates `batch_id`/`source_hash` on existing map rows (idempotent through UUIDv5 ids plus `source_hash`).
* **No new `activity_events` module.** `in_app_notifications.event_id` is NOT NULL, so learner notification load needs a synthesized activity event; use module `PLATFORM` with `event_type` `legacy_import.*` (existing CHECK allows it). Not worth changing the module taxonomy for a one-off import. The batch row itself is the audit record.
* **Staged tables are not mass-registered in this stage.** Per owner defaults, profile detail goes in `profile_document` jsonb (legacy shape), so the staged learner-profile child tables (education, video intros, identity summaries, documents, images, import batches) are NOT needed. Audit history, outbox, OTP and AI tables are excluded by owner decision. The remaining STAGED items are listed with a fallback below; none of them blocks a correct, tenant-safe NSRIT load, but each is a documented fidelity loss until registered.
* **Unmapped legacy fields fallback.** Non-PII legacy columns that have no vNext column may be preserved under `legacy_id_map.metadata.unmapped` (jsonb, per mapped row). No PII, tokens or OTP values go there.

## 2. Need table

| Need | Source legacy table | vNext target | Status | Action |
| --- | --- | --- | --- | --- |
| Offer fixed/variable/joining bonus (LPA), bond months/amount | `job_offer` | `placement_offers.fixed_lpa, variable_lpa, joining_bonus_lpa, bond_months, bond_amount` | ADDED (0096) | none; ETL maps; confirm `bond_amount` unit |
| Offer acceptance channel, disputable window, cascade id, revoke reason | `job_offer` | `placement_offers.acceptance_channel, accepted_disputable_until, cascade_id, revoke_reason` | ADDED (0096) | none |
| Per-role package/bond | `job.role_options_json` | `placement_job_role_options` same breakdown columns | ADDED (0096) | none |
| Offer kind LOI/OFFER | `job_offer.kind` | `placement_offers.kind` | REAL (0060) | none |
| Offer respond_by / released_at / joining date | `job_offer` | `expires_at` / `issued_at` / `joining_date` | REAL | none |
| Offer `letter_url`, `expiring_notified_at`, `verified_by`, `joining_status` | `job_offer` | none (private letter belongs to receipts; joining via joining outcomes) | MISSING, accepted | skip letter URL (public link); map `joining_status` to existing joining outcomes in ETL if rows exist; others dropped |
| Import batch audit and rollback unit | n/a | `data_import_batches` | ADDED (0097) | none |
| Legacy id mapping, college scoped, per batch, per source hash | all | `legacy_id_map` (+college_id, batch_id, source_system, source_hash) | ADDED (0097) | none |
| Section capacity floor and description | `class.lower_limit, description` | `sections.min_size, description` | ADDED (0098) | `class.start_date/end_date` stay unmapped (sections are bound to an academic period) |
| Content progress first completion and attempt | `learner_content_progress.first_completed_at, attempt` | same columns | ADDED (0098) | `duration_seconds` already on `lesson_contents` |
| Assignment resubmission attempt, prior grade | `student_assignment.attempt_number, previous_points` | `assignment_submissions.attempt_number, previous_points` | ADDED (0098) | `points_awarded`/`previous_points` are integer: ETL must reject or round non-integer legacy points (report) |
| Quiz shuffle flags | `quizzes.shuffle_questions/options` | `course_quizzes.shuffle_questions, shuffle_options` | ADDED (0098) | none |
| Assignment submission files | `student_assignment.submission_assets` | `assignment_submission_files` | REAL (0080) | none |
| Project task comments | `project_task_comment` | `project_task_comments` | REAL | none |
| Project delivery events | `project_delivery_event` | `project_delivery_events` | REAL | none |
| Project resource audit | `project_resource_audit` | `project_resource_audit` (Drizzle file exists, no migration) | STAGED | not blocking: audit history is skipped by owner decision |
| Project meeting history | `project_meeting_history` | `project_meeting_history` (Drizzle file exists, no migration) | STAGED | not blocking (history); meetings themselves REAL |
| Project task assignee/details, resource visibility, member kinds, final delivery | `project_task`, `project_resource`, `project_member`, `project_delivery` | `project_tasks`, `project_resources`, `project_members`, `project_submissions` | REAL (0082-0084, 0090, 0091) | none |
| Recruiter grant validity / invite code | `recruiter_college_access` | `placement_recruiter_college_grants` | REAL (0092, 0093) | do not copy legacy invite tokens |
| Recruiter capabilities (6 rows) | `recruiter_college_access_capability` | none | MISSING | accepted: preserve under `legacy_id_map.metadata.unmapped`; revisit if recruiter permissions need parity |
| Email campaigns | `tpo_email_campaign(+recipient)` | `placement_tpo_email_campaigns(+recipients)` | REAL (0095) | none |
| Placement announcements with fan-out | `placement_announcement(+recipient,+read)` | none (college `announcements` has no per-recipient read) | MISSING | not blocking; load as college announcements or skip (6 rows); decide at ETL |
| `tpo_bell` | `tpo_bell` | `in_app_notifications` | REAL (target), event synthesized | see decision above |
| Team asks/mentions/decisions | `tpo_team_ask`, `tpo_team_mention` | none | MISSING | not blocking (4 rows); threads/messages are REAL |
| College-company contact/notes | `college_company.contact_*, internal_notes` | `placement_tpo_leads` / relationship notes | MISSING | unmapped metadata fallback |
| Job `evaluation_config`, `candidate_preferences`, `important_dates`, `category`, `drive_mode` | `job` | none | MISSING | unmapped metadata fallback (non-PII) |
| Application `external_ref/public_ref/pap_requested` | `job_application` | none | MISSING | unmapped metadata fallback |
| Lesson content settings / materials / delivery sequences (html, due raw, thumbnail, per-class order) | `lesson_contents.content_data` | `lesson_content_settings`, `lesson_content_materials`, `lesson_content_delivery_sequences` | STAGED | not registered here (large guarded drafts, `db05-*`); ETL maps what fits `lesson_contents` (storage_key, external_url, starts/ends, visible) and keeps html/due raw under unmapped metadata; revisit before content-heavy parity checks |
| Lesson content discussions | `discussions` | `lesson_content_discussions` | STAGED | no NSRIT rows (all college 2); not needed |
| Course display facets (slug, short/formal title, subscription days, parent) | `course` | `course_display_contents`, course identity drafts | STAGED | not registered; unmapped metadata fallback |
| Assignment grade events | `grade_audit_log` | `assignment_grade_events` | STAGED | no NSRIT rows; not needed |
| Attendance record events, quiz lifecycle events | none | `attendance_record_events`, `course_quiz_lifecycle_events` | STAGED | not needed for import |
| Learner education, video intro, identity summary, docs, images, import batches | `qualification`, `learner.video_intro_url`, `identity` | `learner_profile_*` | STAGED | NOT needed: owner default = `profile_document` jsonb legacy shape; photos and Aadhaar/PAN skipped |
| Skills catalog | `skills*` | `skills*` | STAGED | platform-wide, not NSRIT; skip |
| Notification outbox, `outbound_messages` | `notification_outbox` | `outbound_messages` | STAGED | never load; excluded by owner decision |
| Audit history (`admin_audit_log`, `tpo_audit_log`) | n/a | `activity_events` | REAL (table) | skipped by owner decision |
| OTP / verification / token tables | `*_acct_verification`, `mobile_login_attempt`, tokens | none | MISSING by design | do not add (owner decision) |
| AI features | none | none | MISSING by design | do not add (guard test `no-ai-features`) |
| Outbound allowlist switch (`OUTBOUND_ALLOWLIST_ONLY`) | n/a | code, not schema | MISSING (code) | separate behaviour change; owner approved allowlist-only messaging, required before real PII load; not in this schema stage |
| Class-level faculty/department joins, teaching assignments | `faculty_*`, `class` | `course_teaching_assignments`, `section_faculty_assignments` | REAL | ETL derives offering+delivery |

## 3. Remaining gaps after Stage 1

1. STAGED `lesson_content_*`, course display facets and project audit tables: fidelity loss only (see table); register as migrations if parity checks on content detail are required.
2. Placement fields without a column (recruiter capabilities, job evaluation config/important dates, application refs, company contact notes, announcements fan-out, team asks/mentions): preserved only through `legacy_id_map.metadata.unmapped`.
3. `points_awarded` is integer (legacy is decimal): ETL guard needed.
4. `OUTBOUND_ALLOWLIST_ONLY` code switch must exist before the real-PII load.
5. `job_offer.bond_amount` unit: RESOLVED in section 4.1 (never populated, bond removed 8 Oct 2026; the import maps it to null).
6. Migrations must still be run on the dev DB through the normal migrate Job (not done here).

## 4. Resolved questions (Stage 2a, 2026-10-16)

### 4.1 `job_offer.bond_amount` unit

Read from the legacy source (`42LMS-BACKEND/lms/src/main/java/com/_42students/lms/model/tpo/JobOffer.java`, `JobRoleOption.java`, migration `V161__tpo_v1_drives.sql`) and the local dev copy:

* The column is `DECIMAL(10,2)` and, unlike its siblings `ctc_lpa`, `fixed_lpa`, `variable_lpa` and `joining_bonus_lpa`, carries no `_lpa` suffix and no comment. No Java code, controller mapping or frontend file reads or writes it (the only mentions are the entity comment and the role-option JSON key `bondAmount`).
* `JobOffer.java` states: "bond_months / bond_amount: the columns stay (never filled); the bond was removed on 8 Oct 2026." `JobRoleOption.java` says older role options "may still carry bondNone/bondMonths/bondAmount, which are ignored".
* Data check on the legacy dev copy: 118 `job_offer` rows in total, 0 with `bond_amount` set and 0 with `bond_months` set; 0 drives whose `role_options_json` carries a non-null `bondAmount`.

Decision: the unit is **undefined in legacy** (the feature never shipped and was removed), so the offer loader (stage 2b) must NOT convert it. It maps `bond_months` and `bond_amount` to null and counts non-null source values in the reconciliation; if a non-null value ever appears the load stops and asks the owner, because guessing a unit (lakh per annum versus rupees) would silently change money. The vNext columns (`placement_offers.bond_amount`, `placement_job_role_options.bond_amount`, `numeric(12, 2)`, no unit suffix) stay as added in 0096 and are unused by the import.

### 4.2 Rounding rule for decimal points to integer columns

Legacy stores some quantities as decimals (`points_obtained`, `total_credits` read as decimals by some drivers, `duration_years`, class limits) where vNext uses integer columns. Rule, implemented in `scripts/migrate/nsrit/mappers.ts` (`toIntRoundHalfUp`) and unit tested:

* round half up (2.5 -> 3, 2.4 -> 2; for the non-negative values in scope this equals `Math.round`);
* a value that actually changes by rounding is counted in the reconciliation note `roundedToInteger`; an unchanged integer is not counted;
* null, empty or non-numeric input maps to null (never to 0);
* a value that violates the target CHECK after rounding (negative credits, capacity out of range) rejects the row with `INVALID_VALUE`, it is never clamped silently.

Stage 2a rounded 0 values on the NSRIT snapshot (all source values are already integers). Stage 2b applies the same helper to assignment points and quiz scores; `points_awarded` and `previous_points` are integer in vNext, so a fractional legacy score is rounded half up and counted rather than rejected.
