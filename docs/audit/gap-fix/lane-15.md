# Lane chat-15 wave 1 proof

- `src_db_schema_placements.ts.part1of15.md` | Applied schema foundations for G2-3-011-034, G2-15-019-007/014/028, G2-10-004-019/087/088, G2-15-022-047, G2-1-009-055; existing academic basis point fields checked. Created migration 0138. | Skipped/deferred: G2-15-022-032 fail-closed policy conflict; G2-1-009-009/010/011 learner UI, G2-10-004-081 directory projection, G2-12-020-005/020/037 another schema owner, G2-12-019-001/005/007 application service/role policy; all handoffs recorded. 0138 NOT RUN.
- `src_db_schema_placements.ts.part2of15.md` | Applied storage foundations for G2-12-019-011/012/014/017/020/021/022/026/029/040/042/046/053/054/056 through migration 0139, including version, public ref and private application artifacts. Reviewed distinct joining outcomes/history G2-16-031-040. | Deferred service wiring and lineage: G2-12-019-059/060, G2-16-031-059/060 and application CAS/secure attachments. Retained vNext per-role cardinality; handoffs recorded. 0139 NOT RUN.

## Application legacy crosswalk
- learner_id → membership_id; job_id → job_id; organization_id → placement_jobs.college_id; old unique learner/job → intentionally per-role member, pending TPO decision.
- application_status → SUBMITTED/WITHDRAWN plus screening/college stages/rounds/offers/joining; applied_at → submitted_at; status_updated_at/by → new fields and status/stage events.
- source → channel + source_provider; pap_requested → new flag; resume_url/history → staff-only legacy_resume_url/object_path and JSON history; assessment_url → staff-only artifacts.
- internal_notes → staff-only artifacts; internal_reason and rejection_reason → staff-stage/screening fields. withdrawn reason/prior status/opt-out and appliedByCollege → new columns.
- offer letter URL/sentAt → separate placement offers, pending service crosswalk; transient screening score/partial → screening projection, not stored on core.
- @Version → application.version with transactional CAS required; current_round_id → same-job FK; external_ref → new column; public_ref → A + random 32-character UUID hexadecimal (DB default).
- Company: two distinct domains may have same company name; college relationship notes private. Academic source metadata preserves import provenance; null unverified scores remain null.

## Packet 3 — placements part 3/15
- `src_db_schema_placements.ts.part3of15.md` | Applied schema storage: G2-13-014-059 organization-scoped job/submitted index (0140); G2-13-015-008/013/014 nullable legacy source offer role/CTC and provenance/independent rowVersion (0141). Verified already present: G2-16-031-062 result unique/current/waitlist/applied guards, G2-16-031-063 separate joining and offer history, G2-13-015-001 selection/verification in placement_drive_selections. | Service/ETL handoff: G2-16-031-061, G2-13-014-028/056/057, G2-13-010-006/055/058/059, G2-13-015-002/007/012/028/030. 0140-0141 NOT EXECUTED.

## Packet 4 — placements part 4/15
- `src_db_schema_placements.ts.part4of15.md` | Applied G2-13-015-033/058/059 offer source actor role, verifier, release date, independent CAS version (0141); verified existing ACCEPTED→ISSUED history reversal. Kept import-only source fallback explicit, not a DB default. | Deferred G2-13-015-039/053/055, G2-14-010-044, G2-14-011-010/012/022/044/078/079/080/081, G2-14-015-003/004/008/022/028 to service/workflow owners; handoffs recorded. 0141 NOT EXECUTED.

### Applicant nine-state projection crosswalk
- APPLIED = SUBMITTED plus pending screening; SHORTLISTED = applied screening or stage; ASSESSMENT = active TEST/VENDOR_TEST round; INTERVIEW = active INTERVIEW round.
- WAITLISTED = applied round WAITLIST result, not an application lifecycle state; OFFERED = released ISSUED offer; HIRED = ACCEPTED offer, separately tracked from JOINED.
- REJECTED = screening/round rejection with student-safe reason; WITHDRAWN = lifecycle WITHDRAWN plus preceding stage. Retain full legacy status actor/date/message in migration history; do not silently flatten stage changes.
- Legacy offer SELECTED→selection SELECTED; PENDING_VERIFICATION→pre-release selection verification; RELEASED→selection RELEASED + offer ISSUED; REVOKED→withdrawn/revoked audit. Joining is a separate outcome.
- Offer CTC must preserve original decimal LPA and explicitly round to INR (1 lakh = 100000 INR) with overflow check before populating integer annualCtcInr. Legacy IDs require controlled UUID crosswalk. Job REQUEST/SENT_BACK/REJECTED belong to approval requests, not learner-visible placement_jobs lifecycle.

## Packet 5 — placements part 5/15
- `src_db_schema_placements.ts.part5of15.md` | Added legacyImportMetadata object-only audit field to grants and revoke reason max500 constraint (0142) for G2-14-016-009/011/021/062/063/065. Confirmed grants already scoped by recruiter user plus company college relationship and unique ACTIVE pair, capability allowlist, numeric CAS version and actor type fields. | G2-14-015-029/046/048/050 legacy draft/active/status flags intentionally derived (no duplicates), G2-14-016-004/012/037/064 capability mapping and NULL indefinite conflict to import/grant services; G2-14-019-002/003/007/008/010/037 to interview services. Existing NULL validUntil remains fail-closed, no authority silently granted. 0142 NOT EXECUTED.

## Packet 6 — placements part 6/15
- `src_db_schema_placements.ts.part6of15.md` | Added `placementInterviewPrivateEvents` private append-only event ledger and composite same-job foreign keys for G2-14-019-041/065/066, enabling NO_SHOW/reschedule/feedback provenance without changing booking or learner DTO (0143). Verified G2-14-020-009 contact fields already in relationship and G2-14-020-011/038/055/056 hashed public-join links, counters and unique hash already in `placement-public-joins.ts` (no duplicative tokens). | G2-14-020-003/008/034/060/062 CRM tenant projection, legacy ID/owner crosswalk; G2-15-015-009/010/062 eligibility override ID/null actor/IST; G2-15-014-009/011/066/067 round ID and IST import conversion handed off. No migration needed for old numeric IDs: greenfield owner explicitly ruled out data migration; document legacy mapping only. 0143 NOT EXECUTED.

### Legacy mappings / safe policy decisions
- Legacy recruiterId and collegeId → recruiterUserId + companyRelationshipId scoped to college; legacy unknown capabilities never become live grants, captured only as audit metadata. Legacy nullable validUntil is *not* indefinite in vNext; explicit owner decision needed before import.
- Legacy Interview id/organizationId/jobId/applicationId/learnerId → immutable legacyInterviewId audit + placement job, round, application, membership; NO_SHOW → private audit event + authoritative applied ABSENT round result; interview private feedback never returned to learners.
- Legacy CollegeCompany's private contact/notes → per-college relationship, ownerFacultyId → matched college membership (not guessed), invite hash/time/counters → `placement_public_join_links` COMPANY rows. Tokens hashed, counters increment atomically and no raw token stored. Legacy org-wide listing is a permissioned aggregation, not a shared CRM notes view.
- Legacy JobRound numeric id/jobId, sequence, timezone-less schedule → UUID job/round and sequence with explicitly interpreted Asia/Kolkata scheduledAt timestamptz; original source IDs/time zone stay import documentation. Null creator of legacy eligibility override must be quarantined pending trusted actor attribution (do not insert dummy user).

## Packet 7 — placements part 7/15
- `src_db_schema_placements.ts.part7of15.md` | Applied G2-16-015-008: added nullable postgraduate percentage evidence and minPostgraduate threshold, basis-point validation and migration 0144. Preserved safe model: no gender eligibility column because of privacy / discrimination concerns (G2-16-015-020). Existing grant actor/version/expiry metadata and pre-release selections, application/offer history verified. | Handoff G2-15-014-068, G2-15-016-012/034/040/043/067/068, G2-15-002-079/081/082, G2-16-014-008/022/023, G2-16-031-093/094/095, G2-18-011-006/011. Indefinite legacy recruiter access unresolved, fail-closed intentional. 0144 NOT EXECUTED.

## Packet 8 — placements part 8/15
- `src_db_schema_placements.ts.part8of15.md` | Added published-deadline filtered index for G2-19-011-009/018/031 to support efficient scheduled expiry without touching draft/cancelled/archived (0145); corrected grant revokeReason schema/SQL type consistency with existing TEXT + length check from 0142. Existing secure per-application resume artifact storage from packet 2 retained. | Service handoffs for G2-18-011-014/020/037/045/047/052/060/069/070/071, G2-19-011-005/056, G2-20-011-008/022/037, G2-3-013-017/026: preserve distinct app/offer/round histories and transactional expiry, exact stage labels; never widen application lifecycle enum to legacy status names. 0145 NOT EXECUTED.

### Application/offer/expiry transition contract
- SUBMITTED always persists through screening failure; screening, round and offer histories are separately auditable. A declined offer remains DECLINED in offer history while base application stays SUBMITTED, with no active accept action; HIRED is an offer acceptance label and does not imply joined.
- For a published drive past deadline, atomic status PUBLISHED→CLOSED and closedAt stamp only if unchanged with WHERE status='PUBLISHED'; leave DRAFT/CANCELLED/ARCHIVED untouched. Keep deadline original; never close an already manually closed job twice.
- Previous role-option uniqueness is deliberate vNext membership model; legacy one-job-per-learner data is a future import mapping decision, not a reason to insert a new global job/member unique constraint now. Source stage copy `Not shortlisted`, `Not cleared: Assessment`, `Waitlist ended` must be derived from applied screening and round outcomes.

## Packet 9 — placements part 9/15
- `src_db_schema_placements.ts.part9of15.md` | Added G2-3-015-049 source job version for CAS, G2-13-019-007 recordedOutside and G2-13-019-030 JD object-path/legacy source URL (0146). Existing job per-drive countsAsPlaced from packet1, tenant association, recruiter request model separation, normalized application/history checked. | Handed off G2-3-013-044, G2-3-015-002/007/024/047, G2-3-011-050/052, G2-11-019-075, G2-11-022-075, G2-12-014-013/064, G2-13-019-001/002/020/022/023/035; legacy numeric IDs/slug, evaluationConfig privacy and request statuses not forced into job row. 0146 NOT EXECUTED.

## Packet 10 — placements part 10/15
- `src_db_schema_placements.ts.part10of15.md` | Applied G2-12-015-008/012/023: role package exact CTC LPA (4 decimals), monthly stipend (2 decimals) and positive duration (0147), retained fixed/variable and bounded numeric checks. | G2-13-019-045/047/048/050, G2-3-026-078, G2-3-031-068, G2-4-015-003/016/038/062/064, G2-12-010-043, G2-12-015-001/015/026/027/036 deferred to write/read/ETL owners. Bond fields remain as historical schema, not approval for new editing after legacy 8 Oct retirement. 0147 NOT EXECUTED.

### Job / package migration dispositions
- Legacy numeric Job.id → new UUID, organizationId through college's organization, old jobSlug requires explicit redirect alias mapping if bookmarks matter. Legacy isDeleted → archived/status disposition (not hard-delete), old recruiter REQUEST/SENT_BACK/REJECTED → separate recruiter request workflow.
- Legacy @Version → placement_jobs.version with UPDATE WHERE version=? and atomic version+1, do not rely only on updatedAt.
- Legacy jdUrl → legacyJobDescriptionUrl for import evidence or signed URL from jobDescriptionObjectPath. Legacy assessmentUrl/evaluationConfig are sensitive and must remain outside recruiter or learner projections unless expressly authorized.
- Legacy job_type/counts_as_placed → per-college jobTypeLabel and countsAsPlaced policy (other lane migration coordination unresolved); recordedOutside keeps external-job suppression independently of job type.
- Role packages: name/title blank → `Default` through validation on create; per-package ctcLpa kept to 4 decimals, stipend INR/month + positive months; require at least one active primary pay package before publish, not through a row-level DB constraint. Existing bond amounts should not be reintroduced to form without owner approval.

## Packet 11 — placements part 11/15
- `src_db_schema_placements.ts.part11of15.md` | Added G2-13-020-015/047/049, G2-4-023-072 `placementCompanyMergeHistory` with immutable source→target references, one source redirect and actor/date audit (0148); 2000-char college-scoped note check (G2-13-020-012/033). Already fixed G2-12-015-040 stipend/duration in packet10; global domains/aliases remain existing `placement-company-identities.ts`. | G2-12-015-039, G2-13-020-007/034, G2-13-030-004/028/031/032/042/045 handed to UI/service; G2-13-021-009/010/011/012 legacy auto screening intentionally not added, no AI functionality per owner. 0148 NOT EXECUTED.

## Packet 12 — placements part 12/15
- `src_db_schema_placements.ts.part12of15.md` | Added G2-5-013-024 validated assessment URL DB length and HTTP(S) prefix for staff-private application artifact table (0149). Already present normalized application status, screening decisions, staff-private URL, offer letters and status history. | G2-13-021-019/020/031/032/034/049 auto scoring excluded by vNext no-AI decision; G2-5-013-009/010/038/048/053/059/085/086/087/089, G2-5-015-007/008/019 require service/UI join logic. 0149 NOT EXECUTED.

### Redaction / legacy model crosswalk
- Canonical Company merge: source company remains addressable through redirect chain; canonical target must be domain verified and acyclic by service policy. Private internalNotes/contact remain under college relationship only; merges must not expose another college's notes.
- Legacy screeningStatus PENDING/COMPLETED/FAILED and 0..1 automated score/skills/exclusions were a distinct automated scoring subsystem. vNext retains explicit manual screening decisions and stage/round history; no AI scoring tables or enrichment are introduced.
- Legacy assessmentUrl belongs in `placement_application_private_artifacts.assessment_url`, validated as http(s) max2048; offer letter in `placement_offers.offer_letter_url`; resume history in private object-path sidecar; application timeline is union of lifecycle, screening, rounds, stages, offers and joining sorted chronologically.

## Packet 16 (P0) — inbound mail
- `src_db_schema_inbound-mail.ts.md` | Added schema/storage for G2-5-026-052 and G2-10-009-087/108/115/117/119, G2-5-026-007/008/034/049, G2-13-024-007/031/052/054: explicit REPLY/OTHER, exact eight routing statuses, raw/processed bodies and preview, thread/posted IDs, scoped recruiter/learner, handler audit, bounded retention and retry metadata/index (0150). Existing provider Message-ID UNIQUE for dedupe checked (G2-10-009-073/106). | P0 ingestion worker/webhook and Super Admin UI are outside schema scope and **NOT IMPLEMENTED**; handed off with security requirements; original from/to bounds and receivedAt remain. 0150 NOT EXECUTED.

## Packet 17 — academics part 1/3
- `src_db_schema_academics.ts.part1of3.md` | Added G2-18-015-002/005/008/018/033/035/036 `groupBackedClassOfferings` linking existing group roster (not a synthetic section) with period/dates plus optional class-specific section dates (0151). Existing sections, teaching grants and half-open schedule time checks verified. | G2-18-015-012/032, G2-18-020-008/009/016/032/034/044/047/048/049, G2-19-019-002, G2-13-018-001 to academics/calendar/course-delivery/attendance services. Database exclusion constraints deferred pending checking existing conflicting schedule rows and indexes; never declare unique time indexes equivalent. 0151 NOT EXECUTED.

## Packet 18 — academics part 2/3
- `src_db_schema_academics.ts.part2of3.md` | Verified existing program department FK/name/code/durationTerms, cohort progression state, classes/periods, and class explicit dates from packet17. Recorded precise legacy NewProgram/Batch/Class/ClassSchedule numeric→UUID and years→terms crosswalk below; no user data migration required for greenfield deployment. | Service handoff G2-13-018-007/011/054, G2-18-006-065/067, G2-2-029-018/060/099, G2-2-031-084, G2-18-026-055/057, G2-20-029-071, G2-14-026-010/052, G2-3-025-066, G2-5-003-049/077, G2-5-010-076, G2-5-014-009/078. Intentionally retain PLANNED default vs legacy ACTIVE to require approved activation.

## Packet 19 — academics part 3/3
- `src_db_schema_academics.ts.part3of3.md` | Applied G2-5-021-016/050: case-insensitive cohort name uniqueness per program excluding ARCHIVED, preserving code uniqueness (0152). Existing 0098 date order check, sections minSize and period/time rules verified. | G2-5-021-002/019/049, G2-14-031-012/019/054/055, G2-9-018-070/071, G2-9-028-064/G2-9-022-064, G2-9-029-066/G2-9-023-066, G2-2-031-033, G2-5-021-022, G2-18-015-013 handed to API/frontend/service; legacy hard delete is intentionally replaced by archive/restore with preserved references. 0152 NOT EXECUTED.

### Academic legacy source → vNext identifiers/attributes (no migration performed)
- legacy new_program.id INT → programs.id UUID; dept_id→departmentId via department crosswalk; name→name; duration_years→durationTerms = years * 2 for two-term calendar; generated unique code requires a deterministic slug+collision suffix; deleted→ARCHIVED; audit timestamps retained if imported.
- legacy Batch.id INT→cohorts.id UUID; programId→programId via program map; batchName→name/code; startDate/endDate→date fields; isDeleted→ARCHIVED; ACTIVE on historical existing batches, new vNext creates PLANNED pending activation; currentSemester/academicYear→cohort progression state+year and event history, do not guess missing progression.
- legacy _Class.id INT→sections.id for SECTION classType, else `group_backed_class_offerings` for GROUP_BACKED; batchId→cohortId, programId via cohort; upper/lower→capacity/minSize, start/end dates override academic period if provided; section code generated uniquely; inactive/deleted→ARCHIVED preserving enrolments.
- ClassSchedule.id INT→section_schedule_events.id UUID; classId→sectionId, courseId→courseSectionDelivery link, facultyId→collegeMembershipId, hallId→lectureHallId, text date times parsed in Asia/Kolkata then persisted as UTC-aware instants; attendance_marked_at belongs to attendance session completion, not event status.
- Legacy Semester.ordinal/credit total→program term ordinal and course mapping, academicPeriodId via calendar alignment; no assumption that program-term ordinal equals calendar period number.

## Packet 20 — placements part 13/15
- `src_db_schema_placements.ts.part13of15.md` | Applied G2-6-019-013/048 private PAP interest with exact three choices (0153); legacy application status event archive G2-5-015-028/049, G2-8-019-007/008/009/011/031/051/053/054/056 (0154), nullable actor, source deletion/ID, length50 statuses and 500 reason, no relaxation of live status. Existing company private notes, recruiter job/offer crosswalk and IST round timezone checked. | Remaining service joins G2-8-019-019, G2-8-015-004, G2-15-026-062/063, G2-18-022-051, G2-9-004-051/084. Both migrations NOT EXECUTED.

## Packet 21 — placements part 14/15
- `src_db_schema_placements.ts.part14of15.md` | Verified already fixed G2-9-004-085, G2-9-015-100/101, G2-9-013-021/097/098/099/100 (job version, status/provenance), G2-17-023-009/010/038/059/061 (offer lineage, normalized joining). Existing grant lifecycle preserves proper REVOKED attribution and reason. | Pending invite UI/accept/decline API G2-13-025-002/006/012/023/044 and job/source DTO service G2-9-013-063, G2-9-013-099, G2-18-013-054 delegated. No new migration necessary beyond common source archive 0154.

## Packet 22 — placements part 15/15
- `src_db_schema_placements.ts.part15of15.md` | Verified name-global uniqueness removed in packet1 G2-9-033-013/052/053 and G2-9-034-012/047/053/097, domain-based identity and per-college contacts retained. Immutable company/ATS publicRef generated and indexed; job CAS/recruiter grants already present. | G2-12-019-028/030/031, G2-18-011-025, G2-20-011-013/014, G2-3-013-016, G2-13-019-015/016/017, G2-13-025-016/017/018 handed to validation, applicant, recruiter-invites and editor services. No schema duplication introduced.

## Packet 23 — memberships part 1/2
- `src_db_schema_memberships.ts.part1of2.md` | Added collegeMemberships.version positive CAS and membershipRoles.assignedByUserId attribution (0155). Canonical user→college membership→role model preserved. | G2-1-001-046, G2-13-016-019/043/044, G2-18-031-050/052/079/081/082, G2-19-001-087, G2-2-036-060, G2-3-032-041/069, G2-4-020-009/012/013/039/041/064/065 handed off as auth, legacy ordinal/department/identity crosswalk. No legacy tokenVersion duplicated; platform device sessions must revoke tokens immediately on status change. 0155 NOT EXECUTED.

### Membership/role authority boundary
- Legacy single Learner/Faculty integer row→global user UUID plus one college membership UUID per college; protected STAFF role classes (ADMIN/TPO/MENTOR) must be trusted, explicitly assigned as membershipRoles, never inferred from historical facultyType ordinal without verified mapping.
- Global SYSTEM role does not grant automatic college actor identity. Membership suspension is college scoped, platform suspension all-college, ENDED retains audit rather than hard delete. Before mutating staff roles verify college scope and department FK belongs to that college; revoke active device/session scopes after suspension.

## Packet 24 — memberships part 2/2
- `src_db_schema_memberships.ts.part2of2.md` | Reviewed G2-5-019-003/008/009/011/050/067/068, G2-5-027-081, G2-5-031-065, G2-6-002-088, G2-6-003-049, G2-15-027-010/068: existing user UUID + college-scoped membership + explicit membershipRoles + learner/faculty profiles already replaces legacy single person row. Membership.version from 0155 supports CAS; no redundant tokenVersion added. | Trusted legacy ID maps, department/college checks, multi-tenant suspension, session revocation and protected role conversions are not schema-only changes; detailed handoff below. No legacy data migration (greenfield decision).

## Packet 25 — profiles part 1/2
- `src_db_schema_profiles.ts.part1of2.md` | Added learner resumeObjectPath and learner profileDocumentVersion CAS, faculty avatarObjectPath using stable bounded storage keys, migration 0156. Retained faculty profileDocumentVersion CAS and JSONB sections. G2-1-003-076, G2-1-004-037/061, G2-19-030-061, G2-18-031-018/019/079/081, G2-15-002-078/080, G2-19-001-087, G2-20-030-084/085, G2-4-020-008/009/011/012/013/023/028 are mapped to separate user/membership/profile/academic domains; no PII migration performed. | Owner-scoped signed reference verification, faculty legacy ordinal mapping and detailed JSON validators remain service responsibility. New columns do not enable uploads automatically. 0156 NOT EXECUTED.

### People/profile crosswalk (no data copied)
- Old Learner.id/Faculty.id INT -> verified source ID map -> users.id (canonical identity) plus collegeMemberships.id (college scope), never blindly merge duplicate names/phone numbers. Learner.uniqueId is not rollNumber or global auth UID; map it as private college-scoped lookup only after confirmation.
- Old firstName/lastName/mobile/email -> users.displayName/phoneE164/email as verified; collegeId -> membership.collegeId; orgId -> college.org; departmentId -> facultyProfiles.primaryDepartmentId checked against same college.
- Roll/registration -> learnerProfiles.rollNumber/registrationNumber; class/program/batch/semester -> learner program enrolment, cohort, section and period relations (not untrusted JSON); demographic and profile sections -> profileDocument validated by existing Zod section models. Resume/intro-video legacy refs may be absent, and secure object key migration is intentionally deferred.
- Legacy FacultyType ordinal -> trusted explicit mapping dictionary: employment category/title vs protected role membership separately. Faculty sections education, publications, skills, awards, certifications, identity data -> staff-authorized profileDocument, photo key -> private avatarObjectPath. Legacy @Version -> membership CAS and profileDocumentVersion, login tokenVersion -> revocable auth device sessions (not same mechanism).

## Packet 26 — profiles part 2/2
- `src_db_schema_profiles.ts.part2of2.md` | Added per-membership legacyUniqueId and legacyFacultyCode (0157) to distinguish old student unique code from roll and faculty staff code from auth UID (G2-5-019-006). Existing profile document/version, role/membership split and scoped storage references verified. | G2-4-020-029/059/064/065, G2-5-019-001/003/067, G2-6-001-072/G2-6-002-086/088/G2-6-003-049 are authorization, service CAS and legacy ordinal crosswalk, not global role definitions; no imports performed. 0157 NOT EXECUTED.

## Packet 27 — assessments part 1/2
- `src_db_schema_assessments.ts.part1of2.md` | Added optional historical semesterNumber and legacySubmissionSnapshot, legacyGradingKind for AUTO/MANUAL/PARTIAL source without reviving AI grading; added DB bounds and restored default allowed methods WRITTEN_RESPONSE only (0158). G2-2-026-062/096/097/099, G2-3-016-007/011/016/033/034/050/053, G2-4-012-031 mapped. Existing mixed multipart links/files and grade pub fields inspected. | UI create maxPoints 0 vs >=1, per-term multiple attempts (unique per member remains deliberate vNext), faculty publish DRAFT vs legacy instantly published, mixed multipart write/read and child material projections handed off. 0158 NOT EXECUTED.

### Submission and grading mapping (no ETL)
- StudentAssignment JPA assignment_name, student_name, faculty_name are optional source snapshot in private legacySubmissionSnapshot; live display should join assigned course and membership; old semester_number→semesterNumber nullable, NULL legacy rows excluded from per-semester attempt count.
- Old assignment_contents/submission_assets array→typed textContent, assignment_submission_links and assignment_submission_files, not embedded upload URLs. Old pointsPrevious→previousPoints; status AUTO_GRADED/MANUALLY_GRADED/PARTIALLY_GRADED→legacyGradingKind only, live gradingStatus NOT_GRADED/GRADED plus pointsAwarded, gradedAt/by and publication.
- Existing unique assignment/member preserves vNext current-attempt aggregate; to reintroduce one submission per term requires a separate approved versioned per-term table or uniqueness migration plus service rewrite. Do not falsely claim semester attempt resets are working from a nullable column.
- Faculty legacy create enabled/active maps to intentional vNext DRAFT until PUBLISH, unless owner approves reversing lifecycle; zero maxPoints is valid in DB (0..10000), so form must accept zero.

## Packet 28 — assessments part 2/2
- `src_db_schema_assessments.ts.part2of2.md` | Confirmed G2-4-012-089 default changed to WRITTEN_RESPONSE only in packet27 + migration 0158, not a blanket UPDATE of existing authored records. G2-4-012-092 legacy publishes on create, while vNext DRAFT→PUBLISHED remains a deliberate review-first workflow; only owner can reverse it. No extra schema/migration needed. | Faculty creation UI, resource/allowed methods, preexisting rows and publish/live-check handed to faculty owner.

## Packet 29 — tenant domains
- `src_db_schema_tenant-domains.ts.md` | Added lastFoundValues bounded diagnostic and deletedAt tombstone, active-only unique domain and primary indexes (0159) for G2-19-025-044/046, G2-19-015-003/008/050/052, G2-5-024-010/058/062 and related. Existing verified-only primary check intentionally retained as security hardening. | Historic numeric ID crosswalk, deletion service, redacted TXT logic, verified-only URL fallback, Cloudflare/HMAC and IST conversion are not fixed by schema. No legacy records imported. 0159 NOT EXECUTED.

### Tenant domain safety contract
- Legacy tenant_domain.id INT→UUID (if migration approved), college_id INT→verified college UUID, host→lowercase punycode DNS validation before insert, is_primary/is_verified→booleans, verified_at LocalDateTime interpreted with verified source zone (Asia/Kolkata only if known), last_found_values→redacted diagnostic max512, is_deleted→deletedAt without changing existing canonical college identity.
- Domain lookup for outbound links must select VERIFIED active hosts only; if none verified use canonical configured public origin, never an unverified tenant domain. Deleted records must not resolve or display. Do not overwrite verification state during a legacy import without validating proofs.

## Packet 30 — project audit staged
- `src_db_schema_project-audit-staged.ts.md` | Edited SOURCE-ONLY project meeting/resource candidates for arbitrary changedFields JSON, updatedAt/deletedAt chronology, orphan-safe resource key; staged delivery event attachmentObjectPath and revisionCount default0. Existing staged task comments already have progressValue 0..100 and task status snapshot (G2-12-017-013/015), not currently promoted. | G2-19-017-008/010/011/016/031/032/048/050, G2-3-018-009/044, G2-4-029-063, G2-15-017-031/046/047/048: promotion to live `projects.ts` must be owned by DB07 lane; NEVER create duplicate task comment or delivery event tables, staged is not runtime.

## Packet 31 — discussions
- `src_db_schema_discussions.ts.md` | Added nullable server-provided senderNameSnapshot, deletedAt and chronology CHECK (0160) covering G2-17-020-008/015/046, G2-2-033-076/077, G2-12-009-075. Existing delivery scoped membership/sender/pin invariants kept. | Existing lesson discussions staged DB05 is distinct from classroom delivery thread (G2-19-031-023/128, G2-17-027-047, G2-5-020-007/010/045); service hard deletes still need cutover to tombstones, exact `Message cannot be empty` belongs in UI and service. 0160 NOT EXECUTED.

## Packet 32 — bug tracker schema
- `src_db_schema_db10-bug-tracker.ts.md` | Reviewed existing source and 0076: hashed unique sessions, mutable active access, UUID bugReports/activity/attachment with CAS and scoped metadata; no unsafe name-based identity changes. G2-19-020-041/052/058, G2-16-002-086/088/089, G2-16-003-080, G2-3-021-041, G2-4-021-001/040/062/029 are primarily record identity/import and service/runtime readiness. | DB10 tracker marked draft in source, while prior migration exists; no extra unregistered columns or duplicate CREATE introduced. External reporter access intentionally remains disabled without approved authenticated access; ID/PII backfill not required for greenfield. Service handoff recorded; no migration applied.

## Packet 33 — colleges
- `src_db_schema_colleges.ts.md` | Added optional chairMembershipId/viceChairMembershipId with composite (membershipId,collegeId) FK enforcing same-college selection in DB (0161), G2-16-020-002/008/034/036/038, G2-4-014-012/016/077. Existing code/org/status/logo/address/postalCode fields retained. | G2-3-028-080, G2-4-014-015/079 DTO legacy integer/slug, full-text ranking and old logo path need service/API migrations; protected leadership permission and membership ACTIVE checks cannot be delegated to FK alone. 0161 NOT EXECUTED.

### College DTO field crosswalk
- Legacy College.id/organizationId/chairId/viceChairId INT → UUID college/org and nullable chair/vice membership UUID via audited college scoped maps; uniqueId→code; pinCode→postalCode; logo URL→authorized logoObjectPath; address1/2/landmark/city/state/country directly, soft-deleted→status ARCHIVED preserving history. Never assume all old faculty chairs are valid memberships or grant role automatically.

## Packet 34 — messaging receipts
- `src_db_schema_messaging-receipts.ts.md` | Added nullable-tenancy SMS append-only provider attempt ledger with HMAC recipient key, max-four-digit suffix, purpose/providerMessageId, truthful PROVIDER_ACCEPTED/FAILED/SUPPRESSED, bounded safe errorCode and time/suffix+purpose/college indexes (0162). G2-4-016-002/011/012/013/015/035/041/045/060, G2-8-018-056 schema foundation. Kept generic campaign receipts scoped to college and unchanged. | OTP/attendance/job/general dispatch instrumentation remains unimplemented by schema alone, so handoff to all sender owners including Exotel+DLT rejection, notification trace. 0162 NOT EXECUTED.

## Packet 35 — college application stage history
- `src_db_schema_placement-college-application-stages.ts.md` | Verified existing stage and immutable stageHistory models already cover G2-10-008-119, G2-10-011-055/084, G2-5-015-047, G2-9-010-058, G2-9-014-093/095/096. Application lifecycle SUBMITTED/WITHDRAWN, screening, stage, offers and joining intentionally separate; stage row already CAS version with timestamp/actor, history indexed by stage+time. Earlier packet2 added application statusUpdatedAt/by and version and private notes. | Unified timeline, status labels, shortlisting funnel, transactional CAS across stage/application and legacy history import are service-owned. No redundant applicationStatus column or duplicate migration.

## Packet 36 — platform-setting overrides
- `src_db_schema_platform-setting-overrides.ts.md` | Added createdAt and optional createdByUserId provenance (0163) to row with existing scoped PK, CAS version and latest editor. G2-17-029-058, G2-14-021-003/007/051 legacy mapping captured. | G2-14-021-001/018/052 and G2-9-036-137 are intentional/future policy change: vNext only GLOBAL and COLLEGE; old ORGANIZATION/DEPARTMENT/PROGRAM/BATCH/CLASS/LEARNER and miscellaneous runtime settings must not silently become module policy or broaden permissions. No old data migration (empty vNext). 0163 NOT EXECUTED.

## Packet 37 — DB10 log-alert draft
- `src_db_schema_db10-log-alerts.draft.ts.md` | Reviewed G2-15-018-001/006/044/049, G2-14-018-050, G2-15-018-018: draft already uses UUID signature ID, environment+hash unique, FIXED timestamp check, state key unique plus poll/view cursor fields, bigint-safe occurrence count and verified hash-of-typed-identity. | DRAFT ONLY: own log-alerting lane must register/export correct migration, fixStatus legacy unknowns quarantined, map old BIGINT IDs only if authorized historical import, runtime producer and readiness verification outside this schema lane. No duplicate live tables or migration introduced.


## Packet 38 — DB10 global email suppression / outbound storage
- `src_db_schema_db10-outbound-messages.draft.ts.md` | Registered schema exports, composite college/org integrity and staged, privacy-safe SQL migration 0164 for encrypted outbox, tenant-local suppression and global EMAIL-only HMAC suppression. Existing queue and public unsubscribe use the same stable domain-separated global recipient HMAC and active-only unique index (G2-18-014-002/005/039/041, G2-17-015-001/044). | Greenfield, no legacy data import: future email_norm → canonical normalized email → dedicated keyed HMAC only in privileged/offline importer, collision verification, plaintext disposal; global sender coverage, DB privileges, replay and pre-send race checks handed off; NOT EXECUTED and runtime flags NOT ENABLED.

## Packet 39 — TPO job type canonical bridge
- `src_db_schema_tpo-configuration.ts.md` | Verified existing case-insensitive per-college type uniqueness and explicit countsAsPlaced on types; added missing placementJobs.jobTypeLabel snapshot plus college/label index and registered 0165 for canonical type label, sorting, legacy unknown-count defaults on TYPE rows, casefold uniqueness and safe collision preflight (G2-3-011-046/050/052, G2-6-011-011/045/046). Existing TPO service transactionally cascades label and answer changes across same-college drive copies. | Virtual built-ins cannot have unconditional type-row FK. Existing unjournaled 0138_job_type_drive_policy.sql overlaps registered 0138_lane15_placement_foundations and must NOT be applied together; migration integration handoff. No JSON legacy records imported in greenfield vNext. Per-drive NULL placement counts remain unverified; do not force a blanket placed answer. 0165 NOT EXECUTED.


## Packet 40 — typed module access / legacy crosswalk
- `src_db_schema_module-access.ts.md` | Applied explicit documentation crosswalk for G2-10-007-088/G2-10-019-103/G2-4-030-078/G2-9-036-088/G2-9-036-136: LEARNER→MEMBERSHIP, CLASS→SECTION only where real, BATCH→COHORT, remaining scopes tenant-verified. Typed keys restricted to projects/placements/electives and booleans; unknown AppSetting keys rejected. | No historic AppSetting import under greenfield owner decision; runtime UI aliases and verified integer→UUID crosswalk require authenticated service owner. No schema change or migration needed.

## Packet 41 — immutable 0076 DB10 access grants
- `drizzle_0076_db10_announcements_bug_tracker.sql.md` | Reviewed G2-19-020-041/057/058/059 against registered UUID access grants, role/hash checks and reporter FK. Historic LONG IDs can be imported only with audited UUID crosswalk in referential order (access grants→reports→events), and legacy token hashes never seeded into live credentials. | Existing migration 0076 deliberately UNMODIFIED (lane invariant); greenfield vNext contains no legacy bug-tracker records; invalid role/hash and unknown reporter must be quarantined rather than guessed. No migration executed.


## Packet 42 — elective-backed class equivalence
- `src_db_schema_electives.ts.md` | Added optional backedClassOfferingId to preserve distinct GROUP_BACKED class identity alongside required courseSectionDelivery, and same-roster composite FK + unique class link (0166). G2-10-006-077/G2-4-024-074/G2-9-007-075 crosswalk: old backed_class_id→group_backed_class_offerings.id (same rosterGroupId, correct academicPeriod), course+section delivery separately; old capacity=NULL remains unlimited in schema, no arbitrary cap. | G2-4-024-013/074 form and service currently force capacity and do not bind class; handed to electives owner. Existing vNext group uniqueness across archived offerings intentionally preserves old group_id uniqueness. 0166 NOT EXECUTED.

## Packet 43 — faculty/course association history
- `src_db_schema_faculty-course-associations.ts.md` | Documented verified source ID mapping and active int→endedAt lifecycle semantics for G2-3-020-007/027/040/043. Existing active-only unique membership/course index protects current associations; historical ended rows stay possible and must be kept during imports. | No legacy rows in greenfield, no DDL/data copy; for future approved import resolve faculty/course ID UUID crosswalk and de-dupe active source records after role/college check. Service owner must enforce ACTIVE membership and teaching grant on writes. No migration needed.


## Packet 44 — learner import lineage
- `src_db_schema_db02-learner-import-batches.staged.ts.md` | Registered storage/export and migration 0167 for scoped import batch provenance and immutable membership links, with college-matching composite FKs and membership-once constraint (G2-5-019-010/046/069). | G2-5-019-055 generic bulk undo intentionally NOT enabled: must inspect downstream attendance, projects, applications, assignments and auth dependencies and use individually auditable reversals. Greenfield has no legacy IDs or batch rows to backfill. 0167 NOT EXECUTED.

## Packet 45 — tracker audit finding source fidelity
- `src_db_schema_db10-audit-findings.draft.ts.md` | Added roles, reportedSeverity, environment, sourceCommitSha, agent actor kind/label, file/commit and structured from/to evidence; sync repo, lastCommit, lastError and lastSuccessAt, preserving externalId+internal UUID. Registered migration 0168/export for G2-16-001-066/067/069. | Actual sync worker/status endpoint must record failures and last successful run truthfully, sanitize commits and sensitive notes, and honor DB10_AUDIT_FINDINGS_READY. No sync run occurred; migration NOT EXECUTED.


## Packet 46 — DB06 grade audit immutability
- `src_db_schema_db06-history-staged.ts.md` | G2-17-019-038/043/044: reviewed exact scoped composite FK, before/after grade fields, CAS versions, staged append-only triggers and legacy LONG/status/timestamp mapping; documented strict cutover prerequisite. | PROMOTION CONFLICT: source contract expressly prohibits registering event table/triggers before gradeAssignmentSubmission/publishAssignmentGrade and attendance producers write matching events in same transaction. Existing producer uses activityEvents; enabling deferred completeness first would break grading. Left source-only, no SQL migration or schema barrel registration. Requires coordinated application+DB cutover and owner-approved PostgreSQL replay; no migration executed.

## Packet 47 — department ID/archive crosswalk
- `src_db_schema_departments.ts.md` | G2-18-027-010/052, G2-9-024-066: documented legacy numeric college/department → verified UUID and isDeleted→archivedAt mapping. Existing UUID FK, soft archive and timestamps already preserve current vNext model. | No historic department records by greenfield policy; an actual data migration requires tenant-verified crosswalk and original timezone. No new schema DDL or migration.


## Packet 48 — recruiter drive request/group identity
- `src_db_schema_placement-drive-requests.ts.md` | Documented G2-12-025-009/029/050: submissionId identifies an idempotent per-college request and can correlate authorized same-recruiter group responses; requestId is not a jobId, approvedJobId exists only after approval, all college copies retain separate authorization/status. | Legacy numeric drive_group and immediate Job request are intentionally NOT transplanted into vNext request-first model. No historic data to import. Response compatibility groupId/colleges array and client downstream mapping handed to service owners; no schema migration needed.

## Packet 49 — immutable round results migration
- `drizzle_0024_placements_p6c_results.sql.md` | G2-12-022-009/059: reviewed old Long ID/result double→vNext round/result UUID, outcome status, source, score_percent integral 0..100, reason/comment privacy. Historic source score must be finite and in [0,100] before explicit half-up whole-percent rounding; preserve original score and actor/source in restricted provenance or quarantine. TPO/HR/IMPORT mapping must be explicit, public candidate_message separated from private internal_comment. | Existing migration 0024 NOT MODIFIED. No historic imports under greenfield plan; old Double precision, actor and nullable category cannot be inferred from current schema. Import/status service handoff; no SQL executed.


## Packet 50 — immutable lesson SQL legacy crosswalk
- `drizzle_0004_courses_c2_learning.sql.md` | G2-13-013-054/G2-18-002-120: original Lesson.id/course_id ints→verified UUID lesson/learningPath ancestry; active→course_lessons.status, enabled→visibleToStudents, is_deleted→deletedAt independent of status, sequence LONG→nonnegative integer checked overflow, version LONG→bigint optimistic CAS. Old course-wide casefold name and sequence uniqueness must be preflighted across all learning paths and offering/course duplicates; don't silently delete colliding lessons. | Existing migration 0004 immutable, no legacy data import required in greenfield. Import must resolve course/learning path before placement, reject ambiguous names and duplicate sequence; service owner handoff. No SQL executed.

## Packet 51 — saved job ownership integrity
- `src_db_schema_placement-external.ts.md` | G2-19-012-048/G2-3-019-042: added same-college composite references for placementSavedJobs membership and job, with preflight migration 0169 (reject existing mismatches). Documented int learner/job→tenant verified membership/job UUID crosswalk, savedAt from known source timezone, preserved member+job uniqueness. | No historic MySQL saved jobs in greenfield; source ID remap and original createdAt provenance for future approved import. 0169 NOT EXECUTED.


## Packet 52 — schema barrel and historical bug activity
- `src_db_schema_index.ts.md` | G2-19-017-048/G2-3-021-041: existing DB07 staged projectMeetingAuditHistory is NOT promoted separately; it needs project owner migration, audit writer and scope FK replay alongside live project_task_comments/project_delivery_events to avoid duplicate tables. DB10 bug_report_activities already registered with UUID and restrict retention, activity actor provenance; old integer IDs need audited crosswalk if ever imported. | No legacy project meeting or bug activity data in greenfield; strict staged DB07 cutover. Registered project tables must not be redefined. Handoff, no DDL migration and no old migration edits.

## Packet 53 — OTP account identity/preuser isolation
- `src_db_schema_identity-auth-attempts.ts.md` | G2-20-018-023/036: retained existing real user FK, HMAC-only OTP fingerprints, five-minute expiry and bounded attempts; documented proposed isolated pre-registration proof intent rather than legacy learnerId=0 bypass or fake users. Deliberately retire old plaintext code/roll-number data, do not import raw OTPs. | Public pre-registration challenge workflow requires auth owner review, HMAC keyed nonce, rate cap and verified binding before user provisioning; no auto-migration of secrets. No SQL changes/activation.


## Packet 54 — placement registration season/cohort/consent
- `src_db_schema_placement-registration.ts.md` | G2-15-023-008/051: documented legacy seasonId≠current academic cohortId, numeric learner→same-college membership, verified cohort enrollment, old consent source/time and stale consent quarantine. Existing typed source SELF/TPO/BACKFILL and conditional consent CHECK prevent inferring new legal consent. | No historical season→cohort mapping in greenfield; services must not auto-consent or silently move old registration into a new academic batch. Current vNext model intentionally batch-first; no data migration.

## Packet 55 — course upload ownership and multi-file producer
- `src_db_schema_course-upload-receipts-staged.ts.md` | G2-12-021-007/027: reviewed per-file receipt sequence, attestation, object scope and unique guards; documented old numeric owner_user_id/type→verified college membership/role mapping. Existing relation can represent multiple ordered files, but the live producer only uses index zero. | Staged schema intentionally NOT exported or registered due existing live assignment_submission_files overlap and incomplete scanner/storage authorization cutover. Implement multi-file selection/consumption at service/UI with per-file CLEAN attestation. No SQL migration, no project code executed.

## Packet 56 — attendance correction hours DDL drift
- `drizzle_0033_attendance_foundation.sql.md` | G2-14-009-082: registered original migration 0033 caps correctionWindowHours 1..168 while active TS schema allows 1..8760. Added registered additive migration 0170 to replace that CHECK with 1..8760, preserving older SQL immutability and existing default 24. | Policy service must verify permitted maximum is intentional per college and bounded correction grant; no database migration executed or tested.

## Packet 57 — quiz question points cap mismatch
- `drizzle_0007_courses_c4b_quizzes.sql.md` | G2-16-016-035: original 0007/active quizzes.ts and generic quiz-validation.ts allow 1..1000, but old QuizQuestionRequestDTO cap is 100 and faculty-quiz-authoring-model already imposes <=100. | Coordinated change REQUIRED: lowering only SQL/schema would let generic validator admit 101..1000 and cause DB rejects. Immutable 0007 unmodified; handoff to quiz validation owner to align model+API+schema in one release after checking stored questions. No history import required in greenfield; no SQL executed.

## Packet 58 — semester curriculum credits
- `drizzle_0050_db02_program_terms_curriculum.sql.md` | G2-17-002-086: legacy service and registered DB allow nullable or 0..30 credits; existing vNext college-term-mapping-model accepts only 1..10 for writes. Historical read-only values 0, 11..30 must survive if imported; no truncation or implicit correction. | Existing 0050 immutable, DB upper bound should remain 30 for legitimate past credits. Coordinate writer/API to permit approved 0..30 or explicitly keep legacy values read-only with a warning and block stale overwrites. No migration needed for greenfield and none executed.

## Packet 59 — recruiter email state registered migration
- `src_db_schema_recruiter-message-email.ts.md` | G2-20-010-053: confirmed BOTH email state and inbound hash-idempotency tables, relevant checks, indexes and delivery_channel are already registered in 0135_lanes_round_3.sql (not just proposed), and dispatch/inbound sources gate on enabled env, readiness tables, signed sender/provider, reply token expiry and HMAC. Updated schema documentation rather than duplicate migration. | Runtime enablement and trustworthy provider acceptance NOT verified, legacy raw-token/email records intentionally retired. Existing 0135 left unchanged; no new migration, no worker run.

## Packet 60 — learner notice membership/receipt
- `src_db_schema_placement-tpo-notice-audiences.ts.md` | G2-19-023-055: documented old numeric studentID→verified college membership UUID, frozen scoped recipients and distinction between membership audience and user-based notification read state. Existing 0106 relational notice audiences and recipients already registered; college scope enforced by delivery trigger. | Historic read receipts cannot be silently inferred and no legacy data imported. Service must resolve authenticated learner membership, preserve exact announcement scope and mark only those matching unread IDs. No duplicate SQL, no migration executed.

## Packet 61 — college sign-in method legacy mapping
- `src_db_schema_college-signin.ts.md` | G2-4-031-072: explicit nullable legacy college_branding.login_methods map EMAIL_PHONE→EMAIL_AND_PHONE, PHONE_EMAIL→PHONE_AND_EMAIL, EMAIL_ONLY/PHONE_ONLY direct. Legacy NULL leaves inherited email-first fallback (no college_signin_policies row); per-college explicit override remains versioned and UUID scoped. | No historical tenant settings in greenfield vNext. Auth policy owner must perform authenticated explicit transition and reject unknown legacy enum, never assume absence means opt-out/unsafe permissive mode. Immutable original 0066 unchanged.

## Packet 62 — TPO canonical job types / historical JSON
- `drizzle_0131_placement_tpo_job_types_canonical.sql.md` | G2-6-011-045: confirmed registered original 0131 adds counts_as_placed and is_builtin to canonical per-college placement_tpo_job_types. Existing TPO builtin definitions retain the exact five legacy labels and placed-answer defaults. Registered 0165 handles casefold label collisions, type defaults, sorting and per-drive job_type_label snapshots without editing 0131. | Greenfield vNext has no tpo_college_settings.job_types_json to import. If a legacy import is later approved, parse hidden[] and custom[] strictly, validate IDs/labels, dedupe per-college casefold names, preserve built-in fixed countsAsPlaced and hidden→active=false, quarantine invalid custom JSON and historic drive label collisions. Do NOT silently mark unknown offers placed. 0131 untouched; 0165 NOT EXECUTED.

## Lane-15 queue disposition
- All 59 per-file work packets are ticked in `docs/orchestrator/queues/clone/lane-15-work.md`; each handled as either scoped schema/migration change, already-fixed verification, immutable-existing-SQL disposition, or documented conflicting staged cutover handoff. No code, TypeScript compiler, tests, CI or SQL replay executed. New migrations 0164–0170 remain UNVERIFIED and must pass migration integration before use.

- work2 #1 `src/modules/placements/tpo-student-notes-service.ts` | G2-4-022-028: return legacy `ok:true` acknowledgment while preserving accurate added/skipped/member IDs. No change to authorization or partial-skip semantics.
- work2 #2 `src/app/api/placements/recruiter/bell/route.ts` | G2-10-025-037: POST retains counted `marked` and adds legacy `ok:true` acknowledgment; GET untouched.

- work2 #3 `tpo-public-placement-content-editor.tsx` | G2-17-022-018: legacy load failure copy and Retry using Next router refresh; save failure retains dirty draft and explanatory retry text. No invented content GET route.
- work2 #4 `placements/recruiter/profile/details/route.ts` | G2-10-025-030: valid JSON null body now returns HTTP 400 `BODY_REQUIRED`; malformed JSON/oversized body still retains security error contract.

- work2 #5 `campaign-unsubscribe-confirm.tsx` | G2-20-031-023 confirmation result exact success title and message already exist at confirmed page, POST-only control preserved; G2-1-025-018 restored typographic apostrophe in error.
- work2 #6 `tpo-crm-validation.ts` | G2-14-022-021/022/025 restored exact activity type, recruiter-name, and follow-up date validation wording through Zod4 field errors; existing shape, authorization, phone normalization preserved.

- work2 #7 `recruiter-calendar-model.ts` | G2-5-005-067: documented stable type/ID/start/end/where/status/authorization mapping ROUND/SLOT/DEADLINE/RESULTS_DUE to new calendar plus separate results reminders. No unintended change in event visibility.
- work2 #8 `tpo-team-asks-service.ts` | G2-3-022-014: verified same-college ACTIVE assignee now yields typed ADD_PEOPLE conflict with only safe membership ID if absent from private thread; actor/nonmember remains 404. HTTP serialization of typed 409 to existing route handed off since route not in this packet.

- work2 #9 `tpo-draft-drive-model.ts` | G2-3-011-033: constrained canonical label syntax; added scoped picker helper allowing all active configured labels and hidden saved historical choice only in its existing edit context. Employment category remains separate; createPlacementJob already verifies tenant status/built-ins. UI sourcing of all five choices handed off.
- work2 #10 `public-page/publication-service.ts` | G2-17-022-026: added live publish eligibility signal requiring explicit enabled/published state and current >=5 consented active learners; historical snapshot not treated as live approval. 12-month metric aggregation remains in scoped public-read service and is handed off.

- work2 #11 `placements/offers/[offerId]/actions/route.ts` | G2-17-023-026: retained authenticated vNext `{offer}` client contract, documented direct-object legacy response adapter instead of breaking current consumers.
- work2 #12 `college-drive-archive-action.tsx` | G2-9-013-047: explicitly announces accurate `Drive archived` on confirmed successful request before returning to archived drives, not legacy false deletion claim.

- work2 #13 `college-drive-row-lifecycle-action.tsx` | G2-9-015-049: failed close/reopen impact preview now explicitly reassures that nothing changed; legacy deletion copy deliberately not misapplied because this control has no delete path.
- work2 #14 `bug-tracker/admin-validation.ts` | G2-17-024-017: explicit human-readable Zod status/resolution labels for admin listing and workflow updates, while retaining strict enum checks.

- work2 #15 `learner-notification-membership-service.ts` | G2-18-004-037: retained active college membership requirement without imposing current section/class prerequisite; exported classless notice hint. UI handoff for display rather than hiding college/direct notices.
- work2 #16 `api/activity/route.ts` | G2-18-024-025: provided legacy-compatible actorNames/targetNames dictionaries from authorized response items; retained truthful vNext cursor. Skipped page/size/global total since unbounded offset totals cannot be derived accurately from cursor response; adapter handoff.

- work2 #17 `tpo-company-detail-read-service.ts` | G2-11-007-066: preserved strict canonical UUID/relationship detail route while documenting separate job-only college-scoped company-memory route. No unsafe synthetic recruiter relationship; route owner handoff for name-based legacy bookmark.
- work2 #18 `tpo-builtin-job-types-editor.tsx` | G2-3-011-023: exact `Job types were not saved` failure, server reason, dismiss and Retry with fresh version via router.refresh; retains controls and no stale blind resubmission.

- work2 #19 `learner-support-request-model.ts` | G2-14-023-026: added discriminated, chronologically ordered personal request history projection across placement and general request kinds without fake Job references. Authenticated dual-table service and combined post-merge filtering/pagination handed off.
- work2 #20 `mentor/not-found.tsx` | G2-12-004-009/010: verified 404 fallback is not the dynamic legacy bookmark handler; did NOT redirect all unknown mentor routes (conflicting behavior). Documented exact dynamic route handoff for silent redirect without toast or UUID validation.

- work2 #21 `college/jobs/[jobId]/archive/route.ts` | G2-9-013-055: documented explicit legacy soft-delete→confirmed archive translation, preview impact GET, same-origin POST and preserved downstream application/event history. Physical DELETE intentionally unavailable.
- work2 #22 `tpo/team/[threadId]/page.tsx` | G2-3-022-017/018: documented exact verified action outcome mapping. Server page is not a mutation result surface, so fake toast on load skipped; child interactive controls must announce verified operation results, handoff recorded.

- work2 #23 `college-shortlisted-query.ts` | G2-9-014-005/024: typed ASSESSMENT default and URL stage/status/source/department/program/batch UUID filters; deep-link HREF retains active filters and ignores defaults. Existing page already uses canonical driveApplicationsParams; form/query wiring for department/program/batch handed off.
- work2 #24 `tpo/profile/error.tsx` | G2-19-030-023/024: restored legacy error heading and in-place Retry, no unsupported assertion that faculty record actually missing. Stale-profile warning only when real retained card exists, so handed to profile data component rather than claiming nonexistent cache.

- work2 #25 `project-template-catalogue-model.ts` | G2-7-006-038: restores exact Title/Version/Summary CSV headers and filename remains caller-owned; optional summary field additive to avoid breaking existing consumers. Template loader must populate real summary, handed off.
- work2 #26 `learner-application-detail-model.ts` | G2-5-015-025/037: immutable latest REJECTED transition uses prior recorded stage for exact Not shortlisted, Not cleared: Assessment/Interview, Waitlist ended labels; unknown stage neutral and no inferred rejection.

- work2 #27 `faculty-content-edit-model.ts` | G2-12-008-022: exported exact historical YouTube deletion success/failure copy and 2-second toast duration; component must show only on verified API result, handed off.
- work2 #28 `mobile-navigation.tsx` | G2-3-033-029: matched concise Open/Close menu accessible labels, disabled duplicate opening while native Drawer handles focus/Back/Escape/route close. Blocked link navigation feedback belongs shared SidebarNav handler; handed off rather than falsely claim success.

- work2 #29 `super-admin-company-verification-service.ts` | G2-9-034-093: global verification audit now snapshots canonical primaryDomain and explicitly records that independent domain ownership is NOT inferred from company flag. Domain-proof consistency cannot be auto-propagated without separate verified domain evidence; handoff for approved schema/service migration.
- work2 #30 `api/projects/reassign-mentor/route.ts` | G2-6-028-036: rejects obsolete numeric mentorId body with 400 MENTOR_MEMBERSHIP_ID_REQUIRED, retains membership-scoped bulk reassignment authority and roleLabel. Legacy tenant-checked ID crosswalk handed to adapter owner.

- work2 #31 `learner-placement-notification-model.ts` | G2-4-015-020/025: added strict nullable legacy toggle adapter merging only explicitly non-null fields into live baseline; current confirmed CAS schema unchanged for safe writes. Endpoint integration handed off.
- work2 #32 `faculty-assessment-route-boundary.ts` | G2-3-007-024/G2-4-013-032: distinct hidden/invalid report "Report not found." (no Retry) vs transient fetch "Couldn't load the report." with Retry, without revealing scoped resource existence. Render in report pages/error boundaries handed off.

- work2 #33 `learn/my-placements/interviews/error.tsx` | G2-17-005-016: exact historical "We could not load your schedule" error copy with same Retry control and explicit failure-not-empty guidance retained.
- work2 #34 `placements/season-service.ts` | G2-8-022-030: documented old season endpoint crosswalk and added scoped current ACTIVE season resolver. Legacy open-registration intentionally not conflated with season creation; requires batch-invitation route, handed off.

- work2 #35 `api/projects/[projectId]/route.ts` | G2-2-020-023: preserved CAS project summary PATCH and explicit 400 USE_VERSIONED_SECTION_ENDPOINTS for unsupported legacy nested releases/sprints/tasks/resources/sectionTokens instead of silently discarding updates. Authenticated section API adapter handoff.
- work2 #36 `tpo-outcome-label-settings-service.ts` | G2-2-030-035/026: added fixed-only, ACTIVE-account catalog reader for recruiter/no-college sessions; dynamic custom labels remain strict college/TPO auth. Endpoint owner must use safe fallback without swallowing database outage.

- work2 #37 `learner-course-discussion.tsx` | 11 findings G2-2-033-029..033, G2-12-009-027..030, G2-19-031-051, G2-2-037-020: checked POST acknowledgment before draft reset, retained 409 draft; exact 2-second post/delete/pin error toasts, delete confirmation stays open on failure, history refresh warning exact two-line copy and Retry. Confirmed server POST refetch then scroll/focus; stale refresh keeps last messages.
- work2 #38 `admin/people/page.tsx` | G2-8-002-019 restored exact no-college heading and detail while retaining global browsing link.

- work2 #39 `tpo-drive-cancel-service.ts` | G2-8-011-001: explicit safe legacy lifecycle projection that keeps REQUEST/SENT_BACK/REJECTED in request domain and DRAFT/PUBLISHED/CLOSED/CANCELLED in Job domain; cancellation's immutable effects untouched; combined UI action mapping handed off.
- work2 #40 `learner-attention-service.ts` | G2-15-004-065: typed projection maps persisted project status/progress, actual mentor membership start, delivery submit/review instants and due date to legacy learner view; no inferred review timestamp. Fixture/service integration handed off.

- work2 #41 `learner-career-rounds-workspace.tsx` | G2-17-005-014/025: added legacy ahead/past/month alias mapping and initial upcoming default for interview schedule, URL Back/Forward adaptation. Combined standalone interviews, vendor tests and rounds must be supplied by authorized parent loader; not invented from per-kind prop.
- work2 #42 `super-admin-content-authoring-service.ts` | G2-9-025-063: replaced fixed first-500 lesson limit with bounded searchable 50-per-page result, acting-college scope retained. Per-section delivery choices and content creation API must be wired to authorized delivery rather than blanket null; handoff.

- work2 #43 `api/admin/faculty-assignment/batch/route.ts` | G2-14-027-016/020: kept 401 session error vs 403 CSRF integrity and added exact single-association success message while preserving atomic batch and counted plural success.
- work2 #44 `tracker-cloud-logs.ts` | G2-12-024-006: explicit safe log detail projection of redacted/whitelisted identifier, time, event, message, path, request ID, component. Raw provider JSON omitted intentionally to prevent authentication/PII leakage.

- work2 #45 `project-audit-page-export.tsx` | G2-7-036-012/017: switched export to legacy Action/Entity type/Entity ID/Actor/When headers; row inputs represent ungrouped authorized activity events, optional missing actor/entity IDs left blank rather than invented. Parent audit page source mapping handoff.
- work2 #46 `public-work-email-policy.ts` | G2-13-012-028/G2-12-012-007: added known legacy academic suffixes and rejected IPv4 shorthand/numeric octal/hex/IPv6 address forms before invalid-host path. Full legacy resource-backed personal/disposable blocklists unavailable in source snapshot: owner must restore centrally refreshed rules; marked partial.

- work2 #47 `lesson-content-order-service.ts` | G2-3-027-083: documented authenticated old class/content integer→verified delivery/content UUID crosswalk and active staged per-delivery order; existing full-order enforcement and runtime gate preserved. Migration/replay and group-backed class mapping handoff.
- work2 #48 `faculty-student-detail-service.ts` | G2-3-009-054: mapped historical learner/class numeric IDs to authorized membership/section delivery UUIDs and name, roll, contact fields; existing active faculty + roster checks already restrict scope, no unsafe identity coercion. Future data import handoff.

- work2 #49 `learner-course-card-search-model.ts` | G2-3-014-012: added bounded weighted ranking (exact 100/prefix 80/substring 60/edit distance <=2 40) with optional authorized usage boost and deterministic tie breaker for local course autocomplete. Full global synonym dictionary and cross-module usage unavailable; handoff for scoped source.
- work2 #50 `api/courses/quiz-attempts/route.ts` | G2-3-001-049: explicit nextPage and deliveryId to permit reliable iteration across all section-scoped attempt pages, without truncating results silently or allowing unbounded cross-college query. Legacy college-wide consolidation remains authenticated consumer responsibility.

- work2 #51 `learner-placement-job-detail.tsx` | G2-18-023-005/020: shows primary persisted application denial before generic availability, supplies REGISTER and RULES destinations derived from existing blockers; no eligibility-only OPEN assertion added. Need typed actionCode from apply service for exact parity.
- work2 #52 `admin-readiness-overrides-service.ts` | G2-7-004-043/G2-7-032-078: includes archived projects in existing active override audit listing (chooser remains separate); exports active/clear, value, note, actor and timestamp event mapping; CLEAR remains excluded from active list.

- work2 #53 `session-response-guard.tsx` | G2-1-037-028: root sign-in already shows session expired/revoked notice from validated auth query; replaced history entry to prevent Back loops after failed API auth and retained returnTo.
- work2 #54 `mentor-notifications-service.ts` | G2-7-026-086: explicit legacy created_at/createdAt, type/title/message, receiverType, readAt projection into event plus authenticated recipient receipt; malformed timestamps and non-mentor audiences rejected. Persistence import/historical crosswalk requires authorized import service.

- work2 #55 `admin-directory-query-model.ts` | G2-4-014-017: added strict legacy /search query/state/city/orgId/limit default15 validator without altering current admin directory default25; old numeric orgId requires verified scoped crosswalk.
- work2 #56 `tracker/issues/[publicId]/retest/route.ts` | G2-17-024-020: still returns persisted refreshed issue envelope, now explicit status/version receipt and private no-store; UI must reread latest ticket on mutation completion.

- work2 #57 `college-live-classes-directory.tsx` | G2-18-007-018: guarded Join rendering for validated HTTPS no-credentials meeting URL, Invalid link/No link when authorized data explicitly provides value, no guessing when aggregate intentionally omits links. Authorized source handoff required to populate meetingUrl.
- work2 #58 `college-drive-bulk-actions.tsx` | G2-9-015-068/051/052: separated close from archival, documented scheduled-round and issued-offer consequences; exact single Job opened/closed success, verb-specific bulk result and failed selection retained for retry.

- work2 #59 `mentor-release-editor.tsx` | G2-17-017-005/015: optional authoritative readiness totals (sprints, completed/committed points), Ship disabled until at least one/all linked sprints completed, versioned POST ship with confirmation and success/error states; parent rollup input remains integration handoff.
- work2 #60 `faculty-profile-repeatable.tsx` | G2-1-003-040: exact 'Remove this entry?' confirmation title and delayed-save explanation moved into ConfirmDialog description; unsaved draft deletion only after confirmation.

- work2 #61 `tpo/reports/failure-reasons/page.tsx` | G2-13-031-090: plotted applied FAIL shares using applied-decision denominator (not total adverse events), excluded unknown denominator from percentage chart instead of reporting zero, and explicitly named absent reasons.
- work2 #62 `api/college/departments/[departmentId]/route.ts` | G2-18-027-017: documented standardized 409 DEPARTMENT_HAS_DEPENDENCIES mapping with safe message/usage/requestId and no-store archive response. Did not leak raw legacy exception text.

- work2 #63 `app/globals.css` | G2-3-033-032: removed unsupported 26px mobile page title override; now inherits base 30px. Old shell's phone rules address header/nav only; alternate mobile typography awaits rendered legacy measurement.
- work2 #64 `project-admin-collection-controls.tsx` | G2-10-028-020/G2-7-019-027: documented five historical labels and avoided false Ready=COMPLETED or Blocked=ARCHIVED aliases; authorized at-risk link exposes Blocked workbench, while canonical status filter remains accurate. Full legacy filter query needs domain rollup.

- work2 #65 `tpo/reports/ctc/page.tsx` | G2-13-031-087: explicitly validates five legacy INR cutoffs 0/4/6/10/20 lakh and warns when the current 0–3/3–6/6–10/10–20/20+ aggregation cannot be truthfully split; no fabricated 3–4 counts. Raw-offer model reaggregation is a cross-file handoff.
- work2 #66 `college/lessons/error.tsx` | G2-17-007-033: exact refresh-failure state and Retry plus list return, explicitly avoids claiming empty results or stale rows not actually mounted. Parent partial-fetch cache must retain verified rows; handoff.

- work2 #67 `api/academics/schedule-events/route.ts` | G2-2-032-046: additive legacy `OK` status/message after confirmed create, while retaining vNext `{event}`, HTTP 201, and private no-store. Success-toast duration requires UI mutation handler integration.
