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
