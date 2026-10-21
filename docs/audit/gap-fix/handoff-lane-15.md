# Lane 15 handoffs — wave 1, placements
- `src/modules/placements/tpo-recruiter-access-model.ts`, grant authorization: G2-15-022-032/047. Existing fail-closed NULL valid_until conflicts with old indefinite access; retain safety and obtain owner decision. Map grant actor types, version CAS and grant/relation provenance.
- `src/modules/placements/tpo-job-type-write-service.ts`, drive create/edit, report-service, eligibility: G2-3-011-034. Populate per-drive counts_as_placed from canonical per-college job type, propagate approved changes, audit historical NULLs; never infer from employment_type.
- `src/modules/placements/admin-company-directory-service.ts` and global company mutations: G2-15-019-007/014/028, G2-10-004-019/081/088, G2-16-031-059. Company version CAS, distinct same-name companies, domain-based identity, deduped list independent of college relationships.
- College relationship read/write services: G2-10-004-087. New notes/contact fields are private per college; enforce tenant permission and do not return on shared company read.
- `src/db/schema/placement-company-identities.ts` (other schema owner), company-domain services and badges: G2-12-020-005/020/037. Add per-domain verified_by_42 NOT NULL DEFAULT false, verifier and timestamp, explicit verification only; never inherit company verifiedAt.
- `src/app/(authenticated)/learn/profile/academic-record/page.tsx`: G2-1-009-009/010/011. Render existing tenth/twelfth/diploma basis points as % (divide by 100) with verified source and null placeholder.
- Academic importer and read services: G2-1-009-055. Preserve all 13 legacy values in canonical per-member academic evidence; use new source_metadata/imported_at, migration only after crosswalk verification.
- `src/modules/placements/application-service.ts`, role offer/export: G2-12-019-001/007/060. Preserve deliberate vNext one-per-role uniqueness, ask owner about legacy one-per-job requirement; prevent accidental duplicate company submissions.
- Applicant stages/list/badges/notifications: G2-12-019-005/059. Derive legacy statuses from separate screening, stage, offer and joining; SUBMITTED/WITHDRAWN is not an interview stage.
- `src/modules/placements/application-service.ts` and college stages/offer service/recruiter views: G2-12-019-011/012/014/017/020/021/022/026/029/040/042/046/053/054/056. Wire provider/PAP, prior stage/withdrawal details, ATS reference, durable resumes, signed URL origins and history; enforce version CAS atomically with changes to stages/offers. Staff-only private-artifact queries must enforce membership and college scope.
- `src/modules/placements/learner-application-detail-service.ts` and company sharing: G2-12-019-060. Expose public_ref, not internal UUID, to ATS; maintain per-role guarantees.
- Joining and offer service: G2-16-031-040. Keep reversibility and joining history independent of ACCEPTED.
- Drive/season importer and TPO drive service: G2-16-031-060. Crosswalk legacy Job fields/status to scoped season, job and company relationship; verify migrations.

- `src/modules/placements/tpo-applicant-pipeline-service.ts`, status import/projector and search: G2-16-031-061, G2-13-014-028/056/057/059, G2-13-010-006/055/058/059, G2-14-011-010/012/079/080. Join placement_jobs.college_id; preserve imported soft-delete distinct from withdrawn, reconstruct nine-state label timeline and actor/date/messages, CAS reapply.
- Round result service: G2-16-031-062. Existing round/application/version, current-result index and applied timestamp guards are present; enforce transactional waitlist/supersede semantics.
- Offer selection/release/expiry/dispute service: G2-16-031-063, G2-13-015-001/002/007/008/012/013/014/028/030/033/039/053/055/058/059, G2-14-011-044. Use selection for pre-release, offer for release/response; atomically populate createdByType/verifiedByUserId/releasedAt, CAS rowVersion separately from issuance version, durable expiry sweep and EXTERNAL_IMPORT 48h dispute, reversal rollback. Preserve legacy money exact LPA/rounding policy and old ID crosswalk.
- Import source validator: G2-14-010-044. Malformed legacy application source maps EXTERNAL only during import; never silently default incoming new rows.
- Drive services/job status projection: G2-14-011-022/078/081, G2-14-015-003/004/008/022/028. Legacy EXTERNAL_ONLY targeting constraints and DRAFT_LIKE request workflow statuses must be handled outside learner-visible job lifecycle.
- `drizzle/0138_job_type_drive_policy.sql` (separate lane's file on main, not ours): appears to have an unterminated regex SQL literal and malformed duplicated unique-index statement. DO NOT run migrations until its owner validates/corrects it. Lane 15 did not modify existing migration.

- Recruiter grant model/write endpoints: G2-14-016-004/009/011/012/021/037/062/063/064/065. Versioned grant already permission scoped; add revoke reason input max 500, audit actor type and provenance; accept only reviewed capability names. Unmapped legacy names in `legacy_import_metadata` are NOT privileges; leave indefinite validUntil invalid until explicit policy decision.
- Jobs lifecycle/API projections: G2-14-015-029/046/048/050. Recreate old isDraft/isActive display flags from new lifecycle plus recruiter request states, not extra live SQL status columns. Never backfill legacy DRAFT_LIKE as PUBLISHED; greenfield means no historic import.
- Interview workbench, result/slot and private audit services: G2-14-019-002/003/007/008/010/037/041/065/066. `placement_interview_private_events` is additive, not a substitute for source-of-truth candidate slot/round result. Write events for confirm/reschedule/no-show/private feedback with same-job scope, map learner-facing NO_SHOW to ABSENT only after result applies, and NEVER expose privateFeedback.
- College-company CRM and public company join services: G2-14-020-003/008/009/011/034/038/055/056/060/062. Relationship fields contain private notes/contact; existing `placement_public_join_links` stores hashed invite token, createdAt, opensCount/joinsCount and unique hash. Map old token/counters to scoped COMPANY link without duplicate token columns; increment counts atomically with dedupe and require email-domain verification. Org-level company listing must not expose another college's notes.
- Eligibility override/round import services: G2-15-015-009/010/062, G2-15-014-009/011/066/067. Legacy integer IDs map to UUID via scoped lookup; missing historical actor must be quarantined rather than fabricated; convert LocalDateTime to timestamptz with explicit Asia/Kolkata and preserve job/round sequence and metadata. No data migration needed for empty vNext deployments.

- Academic verification/eligibility read/write (G2-16-015-008/020): PG evidence is nullable basis points, apply minPostgraduate threshold only when actual PG qualification is verified. Non-PG applicants must not be penalized by a PG-only rule. No gender eligibility fields added; if diversity eligibility is ever approved, it must be isolated from company export with explicit review.
- Recruiter legacy identity/grants and platform auth/session: G2-15-014-068, G2-15-016-012/034/040/043/067/068, G2-16-031-094. Do not invent missing recruiter/company IDs, suspend/revoke sessions via the canonical auth mechanism. Old NULL expiry remains fail-closed, defer explicit conversion policy to owner.
- Learner/student placement lookup, TPO offer expiry/dispute scheduler: G2-15-002-079/081/082, G2-16-014-008/022/023, G2-18-011-006/011. Use one aggregated offer per application and exact nine-stage labels; exclude pre-release selections from expiry; defer acceptance cascade while EXTERNAL_IMPORT is disputable.
- Drive / eligibility/registration importer: G2-16-031-093/095, G2-18-011-069/070/071. Map old IDs via college-scoped UUIDs, pre-invite registration, visibility and targeting; greenfield has no legacy records to import now.
- Applicant apply/offer flow, status timeline and report UI: G2-18-011-014/020/037/045/047/052/060, G2-20-011-008/022/037, G2-3-013-017/026. Use private resume object path and signed access + profile fallback, stage history joins, screening result and exact legacy status text. Preserve independent audit atomicity choice and do not silently swallow malformed writes.
- Published-drive expiry worker: G2-19-011-005/009/018/031/056. New partial index enables PUBLISHED-only cutoff sweep; still require CAS and status/recent update guards, stamp closedAt, preserve deadline and historical reporting. Do not expire drafts or archived jobs.

- Job write, legacy bookmark aliases, job-type policy and recruiter request workflows: G2-3-015-002/007/024/047/049, G2-3-011-050/052, G2-13-019-001/002/007/020/022/030/035, G2-13-019-045/047/048/050. Use version CAS and stamp job scope atomically, route role/type rename through canonical persisted jobTypeLabel, signed JD files, separately authorize assessmentUrl/evaluationConfig. recordedOutside suppresses campus placement metrics, not offer history. Reconcile main 0138 job type migration clash before running migrations.
- Recruiter-lead, application search and placement reports: G2-11-019-075, G2-11-022-075, G2-12-014-013/064. Migrate numeric IDs only via scoped explicit UUID bridge, aggregate unique placed learners across role-option applications, preserve chronology and student-safe reasons.
- Legacy recruiter invite and superadmin account services: G2-3-026-078, G2-3-031-068. PENDING_HR recruiter numeric source maps to users + profiles + college relationship grants, with actor/audit provenance; never auto-grant unverified permissions.
- Candidate notification prefs/read services: G2-4-015-003/016/038/062/064, G2-12-010-043. Legacy opt-out false → BOTH notifyMatchingJobs=false and notifyApplicationUpdates=false per resolved college membership. New separate flags remain independently editable after migration; check college before notification dispatch.
- HR/TPO pay-package builder and publish validation: G2-12-015-001/008/012/015/023/026/027/036. Source of truth role package ctcLpa/stipendPerMonthInr/stipendMonths and pay components; support multiple ACTIVE packages, blank label defaults `Default`, enforce at least one primary with CTC or stipend before publishing. Full LPA→INR rounding and overflow review required; do not expose obsolete bond editing without owner signoff.

- Company directory merge and logo owner: G2-13-020-007/015/034/047/049, G2-4-023-072. Use `placement_company_merge_history` to resolve redirects and enforce acyclic/verified company merges; keep original job foreign keys/audit, update aliases/domains with uniqueness constraints; do not expose source college-private notes. Enforce logo HTTPS/object path validation; long signed URLs may legitimately exceed legacy varchar500.
- Company relationship CRM writer: G2-13-020-012/033. Length <=2000 for internalNotes; preserve per-college privacy with explicit tenant authorization, no global company notes.
- Interview feedback screen/service: G2-13-030-004/028/031/032/042/045. Submitted rating 1-5/comment/action goes in private interview event provenance and versioned round result; final state read-only unless explicit resubmit, preserve both versions; synchronously disable duplicate submit and audit event.
- Manual screening and service: G2-13-021-009/010/011/012/019/020/031/032/034/049. Legacy AI/automated overall/skill/education score/excluded-attributes not carried into no-AI vNext. Preserve manual screening status, decidedAt/by and public candidate message; avoid fabricating zero score when no criteria. If owner explicitly reinstates deterministic scoring later, build separate permissioned data model.
- TPO/admin job/application timeline, assessment and package service: G2-12-015-039, G2-5-013-009/010/024/038/048/053/059/085/086/087/089, G2-5-015-007/008/019. Store assessment URLs only in private sidecar (HTTP(S), <=2048 and Zod validation); combine stages/rounds/offers with deterministic timestamps; preserve exact stage text and non-duplicated status history, and do not leak external-only jobs by default.

- **P0 inbound mail, global Super Admin all-mail intake**: G2-5-026-052, G2-10-009-073/087/106/108/115/117/119, G2-5-026-007/008/030/034/049, G2-13-024-007/031/052/054. New inbound_mail_messages fields store entire accepted email even if reply routing fails; MUST add trusted webhook/worker ingest with upstream signature, explicit text/body size limit, Message-ID ON CONFLICT idempotency, POSTED/STORED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/ACCESS_ENDED/FAILED outcomes, bounded failed retry and security audit. Unauthenticated or NOT_OURS messages must not be stored/trusted. Update `src/modules/inbound-mail/admin-service.ts` triage to persist handledAt/by on both completion and reopening and expose eight exact legacy badge words without another college's scopes. **Schema alone does not close P0**; do not claim full intake deployed.
- Academics course audience/group-backed offering and schedule services: G2-18-015-002/005/008/012/018/032/033/035/036, G2-18-020-008/009/016/032/034/044/047/048/049, G2-19-019-002, G2-13-018-001. Use `group_backed_class_offerings` and ACTIVE lmsGroupMembers for elective audience, no fake section; actual section dates override period only if explicitly set. Calendar conflict services should enforce half-open [start,end) with row locks and tenant scope, and attendance denominator must exclude cancelled/future; DB exclusion strategy needs existing-data audit.

- Programs, cohorts and section mutation/progression UI: G2-13-018-007/011/054, G2-18-026-055/057, G2-20-029-071, G2-14-026-010/052, G2-2-029-018/060/099, G2-5-021-002/016/019/049/050, G2-2-031-084, G2-5-003-049/077, G2-5-010-076, G2-5-014-009/078, G2-9-018-070/071, G2-9-029-066, G2-9-023-066. Keep PLANNED default as intentional activation workflow, apply case-insensitive name conflict and display legacy date-order text. Legacy names cannot collide within one active program; archive frees name but retains row/refs.
- Calendar, schedule import, attendance counts: G2-18-006-065/067, G2-18-020-016/032/048. Source time zone Asia/Kolkata for legacy wall times; half-open overlap and exact touching permitted; do not count future/cancelled sessions. Legacy attendance_marked_at belongs to attendance session.
- Program semester structure and migration: G2-14-031-012/019/054/055, G2-9-028-064, G2-9-022-064. Semester ordinal/totalCredits and program course maps must use term/course-delivery associations, not academicPeriod alone; preserve dual display of academic year and term progression.
- Class deletion and historic link handling: G2-2-031-033, G2-5-021-022, G2-18-015-013, G2-9-018-071. New archive/restore intentionally replaces physical delete; ensure history stable, check linked assignments before archival and strict name/code reuse behavior, exact old error text in UI.

- TPO/learner application timeline, college reports: G2-5-015-028/049, G2-8-019-007/008/009/011/019/031/051/053/054/056, G2-15-026-063. `placement_legacy_application_status_events` is imported historical evidence only. New statuses remain SUBMITTED/WITHDRAWN; build merged chronological read model with screening, applied round results, offer/joining. Do not create unknown synthetic legacy actors; preserve nullable imported attribution. PAP preference must not leak to recruiter DTOs.
- Legacy recruiter pending invite authenticated view: G2-13-025-002/006/012/023/044. Add pending invites per company relationship with server-resolved college permission; Accept/Decline one-click. Decline must set REVOKED, timestamp, recruiter as revoker and exact `Declined by the recruiter` reason. Refresh scope and show success/error states; no new grant schema needed.
- TPO job/offer and company list mapping: G2-9-004-085, G2-9-015-100/101, G2-9-013-021/063/097/098/099/100, G2-17-023-009/010/038/059/061, G2-18-013-054. Job dynamic type/CTC and application deadlines/read DTOs derive from canonical relationship and source details, preserve LPA/INR conversion and status booleans; neither pre-release selection nor joining is an offer status.

- Role and identity auth/session owners: G2-1-001-046, G2-13-016-019/043/044, G2-18-031-050/052/079/081/082, G2-19-001-087, G2-2-036-060, G2-3-032-041/069, G2-4-020-009/012/013/039/041/064/065. New membership CAS version is for consistency only; no tokenVersion clones. Invalidate sessions on suspension and revoke college role without affecting other colleges, prove saved device session and workspace switch auth; map legacy Learner/Faculty/FacultyType in trusted source identity resolver; compare department.collegeId against selected membership college.
- Company/ATS/job offer identity, applicant validation, recruiter pending invite: G2-9-033-013/052/053, G2-9-034-012/047/053/097, G2-12-019-028/030/031, G2-18-011-025, G2-20-011-013/014, G2-3-013-016, G2-13-019-015/016/017, G2-13-025-016/017/018. Treat earlier placement schema fixes as foundations only: publicRef uniqueness, name duplicates, version; enforce exact field-level copy/validate resume URL max2048, job saved-by attribution, duplicate application transitions as idempotent; implement authenticated recruiter pending invite view/notifications.

- **Membership identity and faculty department scope**: G2-5-019-003/008/009/011/050/067/068, G2-5-027-081, G2-5-031-065, G2-6-002-088/G2-6-003-049, G2-15-027-010/068. Continue to authorize by active chosen college membership, not just global user; verify primaryDepartment.collegeId equals membership.collegeId and audit a mismatch. Legacy facultyType ordinal must map through explicit frozen enum positions to typed roles/title; no implicit ADMIN/TPO/MENTOR grants. Ended vs suspended vs global platform suspension have distinct scope. Revoke active session/refresh grants after suspension.
- **Learner/faculty profile write/read and storage API**: G2-1-003-076, G2-1-004-037/061, G2-19-030-061, G2-18-031-018/019, G2-15-002-078/080, G2-20-030-084/085, G2-4-020-011/023/028. Require server-issued signed URLs, validate owned object receipt and never accept caller-selected storage path; secure privacy on identity documents and resume. Wire learnerProfiles.profileDocumentVersion atomic CAS, facultyProfile.profileDocumentVersion existing CAS, keep profileDocument JSON Zod-valid; compare stale writes across admin/self. Staff photo uses avatarObjectPath not untrusted legacy website. No data import needed as vNext greenfield.

- Learner/faculty profile migration and service owners: G2-4-020-029/059/064/065, G2-5-019-001/003/006/067, G2-6-001-072/G2-6-002-086/088/G2-6-003-049. Legacy student uniqueId is not roll or auth UID; faculty code is not global identity; enforce college-scoped lookup and authorization without blanket global unique index. Map FacultyType enum ordinals by fixed source table and field-by-field import; verify primary department's college and profile CAS across devices.
- Faculty assignment creation/student submission services: G2-2-026-062/096/097/099, G2-3-016-007/011/016/033/034/050/053, G2-4-004-062/G2-4-007-058/G2-4-010-062/132, G2-4-012-031/042/057/086/088. `allowedSubmissionMethods` now defaults to WRITTEN_RESPONSE, but faculty create form and inbound parser must expose five choices and mixed multipart assets; accept zero-point assignments in forms; retain DRAFT/PUBLISH until owner approves old instant activation; add per-term attempt policy only with a future deliberate uniqueness change; old grading statuses are read-only import metadata, no AI grading.

- Faculty assignment create/preview owner: G2-4-012-089/092. New default is only WRITTEN_RESPONSE but old rows remain unchanged; reset allowed methods only on explicit author edit. vNext DRAFT/PUBLISH remains intentional approval-first until user signs off on legacy auto-publish. Keep authored resource attachments and exact labels.
- Tenant domain service/repository, public tenant resolver, TPO mail URLs: G2-19-025-044/046, G2-19-015-003/008/010/018/048/050/052, G2-3-032-016/068, G2-5-024-010/040/058/062, G2-18-010-019/044/066, G2-19-015-017. Switch hard-delete to deletedAt tombstone with actual write CAS and skip deletedAt non-null in all auth/login and domain queries; redact TXT token values before persisting bounded lastFoundValues. Verified-only public link origin with safe canonical fallback. Primary must stay verified (owner-approved hardening); document manual wildcard DNS verification. No old numeric migration unless owner changes greenfield decision.

- Project DB07 registered schema owner: G2-12-017-013/015, G2-19-017-008/010/011/016/031/032/048/050, G2-3-018-009/044, G2-4-029-063, G2-15-017-031/046/047/048. `project-audit-staged.ts` remains SOURCE ONLY, not imported. Promote into existing project comment/delivery event tables using distinct migrations after audit, preserve private-note redaction and tenant scope; do not create same-name duplicate tables. New orphan-safe project resource history requires explicit authorization even without a resource FK.
- Classroom/course lesson discussion service owner: G2-19-031-023/128, G2-17-020-008/015/046/047, G2-2-033-076/077, G2-12-009-075, G2-17-027-047, G2-5-020-007/010/045, G2-17-020-018. Server must populate senderNameSnapshot from trusted identity and use soft-delete/tombstone instead of DELETE; filter deletedAt on all reads. Promote separate staged lesson discussion schema with lesson content FK, author snapshot and per-lesson sequence. Use exact empty-body validation message.

- DB10 bug tracker reporter/workflow owners: G2-19-020-041/052/058, G2-16-002-086/088/089, G2-16-003-080, G2-3-021-041, G2-4-021-001/040/062/029. Existing 0076 schema/report services need truly stable reporter access, idempotent access without creating inactive access row on each report, no displayName ownership, signed thumbnail access and correct readiness/status confirmation. Do not seed predictable tracker tokens or issue unverified external access; no historical import planned.
- College metadata and leadership owners: G2-16-020-002/008/034/036/038, G2-3-028-080, G2-4-014-012/015/016/077/079. Optional chair/viceChairMembershipId must belong to same college via composite FK and have ACTIVE membership/approved faculty role at service boundary; chair edit must recheck authorization, prevent cross-tenant actor injection. Update DTO/search to expose scoped chairs, postalCode alias pinCode and safe signed logo; legacy IDs must be audited UUID crosswalk. Add scoped prefix/search index only if later performance/UX evidence requires it.

- **SMS sender event ledger**: G2-4-016-002/011/012/013/015/035/041/045/060, G2-8-018-056. Wire every Exotel OTP, attendance parent outbox, job and general notification and TPO campaign sender to `messaging_sms_delivery_attempts` with truthful PROVIDER_ACCEPTED (not handset DELIVERED) or FAILED on DLT rejection; mask only suffix1..4, optional HMAC key, no plaintext phone/response body, provider SID max64, safe code. Support NULL college for pre-login OTP without fake tenant. Use privileged support search only, idempotent append operation and outbox retries.
- **Application stage status projection**: G2-10-008-119, G2-10-011-055/084, G2-5-015-047, G2-9-010-058, G2-9-014-093/095/096. Stage rows and history already exist; authoritative SUBMITTED/WITHDRAWN and screening/rounds/offers/joining from their source tables. Build one ordered timeline with historical source events, deny cross-tenant joins, derive funnel/time-to-shortlist from stageHistory and CAS application+stage in one transaction. Never falsely overwrite current application status to OFFERED/HIRED.

- Platform settings policy and editor service: G2-17-029-058, G2-14-021-001/003/007/018/051/052, G2-9-036-137. Existing module policy override remains only GLOBAL and COLLEGE. All eight legacy scopes and arbitrary OTP/SMS/course progress settings require typed consumer-by-consumer consent before import; do not fall through conflicting duplicate old settings (fail closed). Persist createdByUserId from trusted actor on creation and CAS updated editor. Old isDeleted means restore inherited default, not a live tombstone override.
- DB10 log-alert lane owner: G2-15-018-001/006/044/049, G2-14-018-050, G2-15-018-018. `db10-log-alerts.draft.ts` remains source-only with no registered migration producer; export/register once, map old signature/state BIGINT through trusted UUID crosswalk if migration approved; validate CHECK for fixed timestamp after legacy backfill; quarantine unexpected fixStatus, do not invent recognition for untrusted actor log markers.

- DB10 outbound/email sender owners: G2-18-014-002/005/039/041, G2-17-015-001/044. Migration 0164 registers HMAC-only global suppression, but enforce cross-college gate in EVERY EMAIL campaign/transactional sender, privileged global opt-out/bounce writes, stable HMAC secret rotation procedure, safe offline legacy email_norm crosswalk, pre-send race protection; no provider activation until disposable PostgreSQL replay and role checks pass.
- TPO job-type service/drive owners: G2-3-011-050/052, G2-6-011-011/045/046. Migration 0165 supplies casefold type uniqueness and drive job_type_label mirror; ensure create/edit, rename, answer-change and report reads use the canonical college-scoped label, preserve historic hidden/custom choices, audit legacy JSON map, and reject unaudited per-drive countsAsPlaced rather than silently count placements.
- Migration integrator: Obsolete `drizzle/0138_job_type_drive_policy.sql` is NOT in journal but overlaps `0138_lane15_placement_foundations.sql` (duplicate `placement_jobs.counts_as_placed`). Do not register/apply both; review 0165 canonical replacement and migration-order consistency. 0164 and 0165 NOT RUN; do not turn on DB10_OUTBOUND_READY or DB10_OUTBOUND_DISPATCH_READY without sender/privilege replay.

- Module editor/auth services: G2-10-007-088/G2-10-019-103/G2-4-030-078/G2-9-036-088/G2-9-036-136. If legacy migration later approved, import only allowlisted typed module keys; present LEARNER→MEMBERSHIP, CLASS→SECTION, BATCH→COHORT aliases and verified tenant-scoped UUID crosswalk. Quarantine raw unknown AppSetting keys and ambiguous class/group-backed mappings.
- DB10 bug tracker integration: G2-19-020-041/057/058/059. Do not edit migration 0076. Any later authorized historical import must map Long IDs to UUID before reporter/activities, reconcile 64-hex credentials and REPORTER/MANAGER role, discard seeded token grants, quarantine unknown reporter; none applies to empty vNext today.

- Elective service and faculty/attendance/grade owners: G2-10-006-077/G2-4-024-013/074/G2-9-007-075. vNext 0166 records optional groupBackedClassOfferingId with same group ID; bind it from real academicPeriod+GROUP_BACKED class before grade/attendance, never use delivery UUID as legacy class UUID. Allow capacity=null as unlimited (not merely integer with max100000). Preserve active/archived uniqueness and vNext roster authority.
- Course teaching assignment/auth owner: G2-3-020-007/027/040/043. Only a trusted tenant-scoped facultyMembershipId with active role/delivery may create an active association. For future historical import map old faculty/course IDs to UUID, 0→endedAt, 1→active after deduping collisions; no import required in greenfield.

- Learner import/College Admin people service: G2-5-019-010/046/055/069. Tables registered in 0167 but no new endpoint writes lineage until verified college actor + created membership in same transaction. Bulk undo forbidden without authoritative dependency scan and per-member reversible actions; no soft-delete-all shortcut.
- Audit tracker sync/status service: G2-16-001-066/067/069. Migration 0168 registers repo/commit/errors/lastSuccessAt, agent kind and source metadata; present attempted vs successful sync honestly, sanitize commit SHA/file/notes, scope actor and protect lastError. DB10_AUDIT_FINDINGS_READY disabled pending role/replay acceptance.

- DB06 grade/attendance service owners: G2-17-019-038/043/044. Stage has complete ledger and append-only SQL candidate, but no registration until atomic grade/publish/attendance producer cutover, deferred completeness guards, grade overflow/UUID/timezone crosswalk and disposable PostgreSQL adversarial replay are co-deployed. Current grade producer emits only activityEvents. Do NOT register source-only candidate independently.
- College Admin department importer: G2-18-027-010/052, G2-9-024-066. For future owner-approved historic import, map integer college/department IDs via same-tenant crosswalk, isDeleted→archivedAt, verify original timestamps/zone, retain archived dependencies. None for greenfield.

- Recruiter drive request service + API response: G2-12-025-009/029/050. Return explicit driveGroupId (verified submission correlation) and per-college {collegeId,requestId,approvedJobId,status,skippedReason} where permitted. A pending request is NOT a Job; keep request-first approval model, use confirmed company/grant permission before multi-college grouping. Preserve source legacy group IDs only in controlled provenance.
- TPO round results importer: G2-12-022-009/059. Before any legacy RoundResult import, resolve numeric round/job/app/member IDs via scoped UUID map, validate finite 0..100 score then explicit rounding and preserve private comment, map trusted actor/source to TPO/HR/IMPORT, quarantine unknown raw category, reject overflow. Migration 0024 remains immutable.

- Lesson importer/course content owner: G2-13-013-054/G2-18-002-120. Legacy lesson id, course id, active/enabled/isDeleted and LONG sequence/version require separate UUID path ancestry, visibility, archive and bounded integer mappings. Preflight course-wide casefold names & sequence clashes across learning paths; don't edit immutable 0004 or silently discard duplicates.
- Saved job service/importer: G2-19-012-048/G2-3-019-042. Composite same-college FKs added in 0169 but no SQL run. For later historic import resolve learner/course college ownership and job UUID, preserve savedAt source timezone, quarantine cross-tenant duplicates before migration.

- DB07 project meeting audit owner: G2-19-017-048. Do not export `project-audit-staged.ts` until its migration, tenant FK, handlers and producer land together; existing project_task_comments and project_delivery_events are live canonical tables. Bug tracker G2-3-021-041 requires audited integer ID crosswalk only for approved historic import; keep RESTRICT immutable activity.
- Auth registration owner: G2-20-018-023/036. Existing OTP challenges require user UUID; if pre-registration flow required, implement separate expiring HMAC-only proof intent with rate limiting and account binding after verification. Do NOT store plaintext legacy learner OTP or create learnerId=0/placeholder fake users.

- Placement registration owner: G2-15-023-008/051. Never equate legacy placement season with academic cohort; only import after verified learner same-college membership+cohort enrollment, explicit source/time and lawful consent validity. Non-placement choice must not backfill consent.
- Assignment upload storage/Faculty UI owners: G2-12-021-007/027. Staged course_upload_receipts must remain unexported until scanner, tenant membership/role, physical GCS object attestation and current assignment_submission_files relation are reconciled (avoid duplicate tables). Add multi-file producer/UI with bounded sequence, unique consumed receipt and per-file CLEAN status, not merely sequence 0.

- Teacher attendance policy owner: G2-14-009-082. Additive 0170 replaces 168-hour SQL cap with schema's 8760-hour maximum. Recheck policy UI, role, cutoff calculations and migration replay before exposing year-long corrections; default stays 24h.
- Quiz authoring/validation owner: G2-16-016-035. Legacy per-question 100 points already enforced by faculty authoring, but generic quiz-validation.ts, quizzes.ts and immutable migration 0007 accept up to 1000. Do NOT change SQL without synchronizing Zod/UI/schema for all writers, checking existing questions >100 and approving any downgrade. Migration 0007 unchanged.

- College semester course model owner: G2-17-002-086. Curriculum DB allows legacy nullable/0..30 credits, but editable Zod currently 1..10. Preserve old read-only values or align approved write limits with legacy, warn on out-of-policy historic rows, and never reject reading existing semesters. Migration 0050 immutable.
- Recruiter email provider/operations owner: G2-20-010-053. State and inbound hash tables already registered via 0135; before RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED=true, verify rollout guard against schema, signed inbound gateway, ZeptoMail credentials, reply expiry/replay and no plaintext token persistence. No duplicate migration.

- Learner announcements/notification owner: G2-19-023-055. Historical student IDs must map to collegeMembershipId via same-tenant crosswalk; 0106 recipient snapshots scoped by announcement college, and user notifications only read for authenticated membership. Do not conflate a user's multiple college roles or invent historical read timestamps.
- Identity/tenant sign-in settings owner: G2-4-031-072. Map explicit legacy EMAIL_PHONE→EMAIL_AND_PHONE, PHONE_EMAIL→PHONE_AND_EMAIL, EMAIL_ONLY/PHONE_ONLY direct, NULL→no saved override/inherited email-first. Reject unknown settings and verify integer college→UUID before writing, no placeholder policy for old NULL.

- TPO migration/drive policy owner: G2-6-011-045. Never re-run or edit registered 0131. For any future historical job_types_json import: map hidden builtins to active=false by canonical label, verify fixed builtin placed answers, import validated custom ids/names/placed answers into same-college rows, reject malformed JSON and casefold duplicates; registered 0165 must be reconciled with the unjournaled overlapping 0138_job_type_drive_policy.sql and all historic drive labels before rollout.
- Lane-15 integration summary: All 59 packets dispositioned in queue. Migrations 0164–0170 created on branch, none executed. Required owner signoff for 0164 global HMAC sender, 0165 job-type copy, 0166 electives grade/attendance, 0167 learner import lineage, 0168 additive existing 0133 audit table alteration, 0169 saved job tenancy, 0170 attendance correction window; replay on disposable DB and coordinate runtime producers.

- `src/app/api/placements/tpo/team/threads/[threadId]/asks/route.ts` G2-3-022-014: catch `TpoTeamAddPeopleRequiredError` from service; respond HTTP 409 `{error:"ADD_PEOPLE",missingMembershipIds:[...]}`, show add-people-and-retry UI. Service only reveals ID after same-college ACTIVE role and existing caller thread access; do not reveal unknown membership existence.

- `src/components/tpo/tpo-draft-drive-step-one-form.tsx` G2-3-011-033: currently only three employment categories; add separate college-scoped jobTypeLabel picker for all five built-ins and active custom rows; use `tpoDraftAvailableJobTypeLabels` helper. Never show hidden type for new drives, but retain saved hidden label in historical edits.
- Public placements metric read service G2-17-022-026: return live 12-month time-windowed metrics only when publication settings are enabled, publishedAt exists and >=5 current consented learners; never substitute old population snapshot or return suppressed small cohorts.

- `src/app/(authenticated)/learn/notifications/page.tsx` G2-18-004-037: show `LEARNER_NO_CURRENT_CLASS_NOTICES_HINT` when class enrollment absent but keep college, cohort and direct notices visible to authorized learner membership.
- Legacy Super Admin audit adapter G2-18-024-025: current activity route is cursor-paginated; actorNames/targetNames dictionaries now supplied. For old page/size/total API, implement separately authenticated, scope-checked count+offset adapter (not false total from cursor) if required by old consumers.

- Legacy TPO company memory route G2-11-007-066: implement separate college-scoped job/lead name lookup for job-only entries not yet tied to a canonical recruiter-company relationship; never require fictitious association or leak ungranted companies. Canonical `getTpoCompanyDetailReadOnly` remains strict for UUID identities.

- `src/modules/placements/learner-support-request-service.ts` G2-14-023-026: query `placement_learner_general_requests` with SAME current learner membership and college alongside placement requests, combine using `mergeLearnerPersonalRequestHistory`; apply type/status filters and pagination across combined history, not separately.
- NEW `src/app/(authenticated)/mentor/courses/[courseId]/page.tsx` G2-12-004-009/010: redirect any legacy courseId segment to `/mentor/projects` with Next.js `redirect()`, no validation/toast. Do not alter generic mentor/not-found behavior.

- Interactive `src/components/tpo/tpo-team-follow-controls.tsx`, `tpo-team-rename.tsx`, `tpo-team-message-actions.tsx`, `tpo-team-decision-toggle.tsx`, `tpo-team-ask-panel.tsx` G2-3-022-017/018: after successful authorized POST/PATCH show exact ADDED/OK/LEFT, EDITED/DELETED/DONE/CANCELLED feedback using role=status, never on speculative click or server render; preserve error and retry paths.

- College shortlisted page/filter service G2-9-014-024: canonical `driveApplicationsParams` and pipeline query must receive department/program/batch UUID scope, render filter controls and clear-filters, retaining source/stage; companion `collegeShortlistedQuery` supports these URL keys now.
- TPO profile data client G2-19-030-024: retain last successful profile in component state on refresh failure and show exact `Couldn't refresh profile. Showing the last profile we loaded.` only while cached card truly rendered; error.tsx cannot safely claim stale cached content by itself.

- Project template catalogue loader G2-7-006-038: pass persisted template summary/overview into `TemplateCatalogueRow.summary` for exact three-column CSV; do not fabricate from section counts. Model/headers ready.

- Faculty YouTube deletion component G2-12-008-022: consume `FACULTY_YOUTUBE_DELETE_FEEDBACK` in delete mutation handler after confirmed server success/failure, show accessible toast for durationMs=2000.
- Shared `src/components/shell/sidebar-nav.tsx` G2-3-033-029: render blocked navigation feedback when route click fails/permission denies; mobile Drawer currently closes on link click and uses native focus recovery. Don't claim page opened until pathname changes; guard repeated pending link clicks.

- Company identity/domain verification G2-9-034-093: define independent persisted verified domain evidence before syncing global company verification to domain flag; do NOT auto-mark domain owned just because a Super Admin marks company globally verified. Current service audits primaryDomain and domainProofNotInferred; schema/privileged verification reconciliation needs review.
- Legacy project bulk mentor adapter G2-6-028-036: trusted admin client must resolve old integer mentorId to selected college's ACTIVE mentorMembershipId UUID, refuse ambiguous/out-of-tenant mappings, then POST new API; never cast old ID or bypass requirePermission.

- Learner placement notification write adapter G2-4-015-020/025: for trusted old PUT, read current persisted booleans and call `mergeLegacyPlacementNotificationPatch`; then require confirmed and CAS expected baseline before using live narrow write service. Null master toggle MUST NOT reset another preference.
- Faculty quiz/assignment report pages G2-3-007-024/G2-4-013-032: use `facultyAssessmentReportErrorCopy` to render exact "Report not found." without Retry for invalid/hidden route; for legitimate retriable load error preserve server-safe details and show Retry. Never show private details from 403.

- Placement season API G2-8-022-030: if historic /current consumer required, expose `currentPlacementSeason` under persisted college scope; map legacy open-registration to authorized batch lifecycle invite with audit and preview, not generic season OPEN.

- Legacy project workspace update adapter G2-2-020-023: split nested DTO into project summary and separately CAS-protected releases/sprints/tasks/resources endpoints under project scope and authorize every section; do not accept nested fields in summary route or execute partial untracked updates.
- After-college choices endpoint G2-2-030-035/026: when account ACTIVE but no authorized college, use `fixedTpoOutcomeCatalog` rather than calling restricted `readTpoOutcomeLabels`; empty dynamic labels. Do not reveal college custom choices to recruiter/no scope or convert infrastructure errors to false success.

- TPO drive lifecycle UI/read owner G2-8-011-001: use `tpoLegacyLifecycleProjection` to distinguish placement_recruiter_drive_requests REQUEST/SENT_BACK/REJECTED from placement_jobs DRAFT/PUBLISHED/CLOSED/CANCELLED; never send request IDs to job cancellation route.
- Learner project workspace DTO adapter G2-15-004-065: map actual active projectMembers mentor, latest projectSubmissions submittedAt, immutable review events, projectInstances progressPercent/endDate to `learnerLegacyProjectProgressProjection`; add fixtures for each status/nullable timestamp; no fake review dates.

- Learner schedule loader G2-17-005-025: produce combined authorized calendar of assessments, standalone interview slots and vendor tests, merging chronologically and respecting old /schedule view aliases; kind-specific workspace cannot conjure missing records.
- Super Admin course authoring component/service G2-9-025-063: paginate/search `listSuperAdminContentAuthoringLessons` and add selected offering's courseSectionDeliveries (tenant-checked) to picker; create with verified deliveryId rather than always null. Maintain acting-college scope.

- Project audit page G2-7-036-012/017: pass `actorName`, `entityType`, `entityId` from authorized ungrouped activity rows into ProjectAuditPageExport, not event ID as entity ID. Current caller only passes summary/label, so missing values export blank until integrated.
- Company email policy G2-13-012-028: bundled old personal-mail-domains.txt/disposable-mail-domains.txt not found under legacy-source; retrieve authoritative resource lists, review/refresh central policy, prevent send until MX/tenancy provider checks. Local inline sets are incomplete by design.

- DB05 lesson order owner G2-3-027-083: promote lessonContentDeliverySequences only after verified old content_id/class_id→new contentId/deliveryId/college crosswalk and same-offering ownership, full-order transaction and SQL replay; do not use fabricated group-backed delivery.
- Faculty roster directory owner G2-3-009-054: resolve legacy learnerId/classId to authorized collegeMembership and courseSectionDelivery with role/college verification; map legacy contact_mobile/contact_mail only through masked-to-role disclosure policy.

- Learner autocomplete G2-3-014-012: wire `rankLearnerCourseAutocomplete` into authorized result set; merge approved legacy global synonyms and independently authenticated usage boosts before claiming full global search parity.
- College quiz attempts G2-3-001-049: list all authorized section deliveryIds for a quiz, iterate `nextPage` for each, and combine with stable attempt identity in UI/export; no unpaged cross-college leakage or hard first-page assumption.

- Learner job apply gate G2-18-023-005/020: add typed backend actionCode REGISTER/RULES and authoritative denial reason to authorized per-role job detail DTO; current UI maps text blockers as fallback only, must agree with real apply service at click.
- Project readiness historical audit G2-7-032-078: query all persisted events to show CLEAR and transitions using readinessOverrideAuditProjection; active list intentionally filters latest FORCE states while archived projects with active overrides remain visible.

- Mentor legacy notification migration G2-7-026-086: translate vetted records through projectLegacyMentorNotification then persist activityEvents and inAppNotifications under trusted member college/user grant, never accept receiverType or userId from client as authorization. Ensure historical audience and readAt preserved.

- College legacy search endpoint G2-4-014-017: bind legacyCollegeDirectorySearchSchema to authorized college directory query; resolve historic numeric orgId through verified tenant crosswalk, apply city/state predicates and top-N limit15 without relaxing admin scope.
- Bug tracker retest consumer G2-17-024-020: after success use returned fresh issue.version/status and refresh page instead of mutating stale local state; still no raw legacy BugReportResponse replacement.

- College live class aggregate G2-18-007-018: current `listCollegeContentAggregate` intentionally omits externalUrl, so permissioned reader must add a reviewed meetingUrl only for authorized college/offerings; then directory renders Join, Invalid link or No link. Do NOT expose raw URLs via unscoped aggregate before approval.
- College drive bulk archive G2-9-015-068: bulk CLOSE preview only returns pendingLettersWithdrawn; extend impact if UI needs exact interview notification counts. Actual archive remains separate and must use per-drive impact confirmation.

- Mentor release rollup G2-17-017-005/015: parent loader must supply verified `readiness` with readyToShip, completedSprintCount, committedPoints, completedPoints from tenant-scoped persisted release/sprint/task service; Ship stays disabled without those authoritative fields and server reconfirms gate.

- Department archive legacy client G2-18-027-017: map DEPARTMENT_HAS_DEPENDENCIES 409+usage+safe message from current apiErrorResponse to old status ERROR conflict UI; do not reproduce raw server exception detail.

- Legacy project workspace status filters G2-10-028-020/G2-7-019-027: build authorized five-state projection combining lifecycle and readiness/risk, extend URL parser & service before rendering noncanonical Select options. Never incorrectly alias Ready to COMPLETED or Blocked to ARCHIVED.

- TPO CTC report model G2-13-031-087: change `src/modules/placements/report-model.ts` underlying knownCtc loop to boundaries 0/400000/600000/1000000/2000000 INR, labels below4/4-6/6-10/10-20/20+ LPA; regenerate CSV/metric tests. UI cannot accurately split existing 3–6 aggregate without raw offers.
- College lessons partial load G2-17-007-033: maintain last valid rows in list component state when a subsequent partial scope fetch fails; show warning `Couldn't refresh lessons` plus Retry while retaining actual cached rows; error.tsx alone can't render the old list.

- Class schedule creator UI G2-2-032-046: show verified create success toast and legacy duration from UI design source only after authorized POST acknowledgment; never show success on 401/403.

## Wave 2 placements part 1 (schema-owned and downstream cross-file findings)
- G2-15-019-001 — src/modules/placements/company-service.ts / admin-company directory: Map historical identity, retire old source without replacing canonical company
- G2-15-019-004 — src/modules/placements/company-service.ts / admin-company directory: Align API length validation or approve expanded length
- G2-15-019-005 — src/modules/placements/company-service.ts / admin-company directory: Document max length conversion and API validations
- G2-15-019-006 — src/modules/placements/company-service.ts / admin-company directory: Map creator records and freeze historical role provenance
- G2-15-019-018 — src/modules/placements/application-service.ts / application detail presentation: Explicit ID/time/status migration crosswalk
- G2-15-019-021 — src/modules/placements/company-service.ts / admin-company directory: Migrate URL to public asset or signed storage representation
- G2-15-019-031 — src/modules/placements/application-service.ts / application detail presentation: Document no-migration vNext identity choice and import compatibility
- G2-15-019-032 — src/modules/placements/company-service.ts / admin-company directory: Provide column-by-column transformation checklist
- G2-1-009-013 — src/app/(authenticated)/learn/profile/academic-record/page.tsx: Show gap years, distinguish unknown vs zero and source.
- G2-1-009-051 — src/app/(authenticated)/learn/profile/academic-record/page.tsx: Convert integer basis points exactly; preserve fraction rounding and `0` vs null.
- G2-10-004-048 — src/modules/placements/company-domain-service.ts / domain verification UI: Check verification propagates across all domains and recruiter drive company matching
- G2-10-011-083 — src/modules/placements/offer-service.ts / offer detail presentation: Create field-level mapping for all statuses/notes/offers and preserve unique learner/job constraints.
- G2-10-012-080 — src/modules/placements/job-service.ts / job detail presentation: Provide explicit legacy job status mapping including expired independent of state.
- G2-12-020-001 — src/modules/placements/company-domain-service.ts / domain verification UI: Keep child/global primary-domain synchronization and explicit source of truth.
- G2-12-020-045 — src/modules/placements/company-domain-service.ts / domain verification UI: Restore per-domain 'Verified by 42' badge copy/status.
- G2-12-019-003 — src/modules/placements/offer-service.ts / offer detail presentation: Project same field groupings from normalized relations into detail UI.
- G2-12-019-004 — src/modules/placements/offer-service.ts / offer detail presentation: Preserve applicant identity and offer-letter display via joins.
- G2-12-019-009 — src/modules/placements/job-service.ts / job detail presentation: Retain firstAppliedAt/history timestamps on reapplication.
- G2-12-019-010 — src/modules/placements/job-service.ts / job detail presentation: Project last actor/time using history and avoid exposing internal actors to learners.
- G2-12-019-016 — src/modules/placements/job-service.ts / job detail presentation: Project candidate-facing reason, enforce 500 char equivalent.
- G2-12-019-018 — src/modules/placements/offer-service.ts / offer detail presentation: Expose issued offer letter with time through offer relation.
- G2-12-019-019 — src/modules/placements/job-service.ts / job detail presentation: Project fair score and partial-data flag from screening evaluation.
- G2-12-019-024 — src/modules/placements/job-service.ts / job detail presentation: Make duplicate policy explicit in Apply CTA and API.
- G2-12-019-025 — src/modules/placements/company-service.ts / admin-company directory: Restore company portal reference field with controlled max length.
- G2-12-019-027 — src/modules/placements/job-service.ts / job detail presentation: Add PAP toggle or documented moved feature.
- G2-12-019-041 — src/modules/placements/job-service.ts / job detail presentation: Track later eligibility reversal/flag timestamp.
- G2-12-019-043 — src/modules/placements/job-service.ts / job detail presentation: Define imported legacy fallback and error for missing role option.
- G2-12-019-044 — src/modules/placements/offer-service.ts / offer detail presentation: Distinguish missing vs zero score in admin view.
- G2-12-019-047 — src/modules/placements/offer-service.ts / offer detail presentation: Pass approved candidate-specific link and status transitions through notice payload.
- G2-12-019-050 — src/modules/placements/offer-service.ts / offer detail presentation: Restore old stage wording and explanatory labels.
- G2-12-019-052 — src/modules/placements/job-service.ts / job detail presentation: Benchmark applicant retrieval by drive/learner with one-per-job semantics.
- G2-12-019-058 — src/modules/placements/application-service.ts / application detail presentation: Define archive/soft-delete migration and retention rules.
- G2-13-010-012 — src/modules/placements/job-service.ts / job detail presentation: Maintain withdrawn terminal and reapply alternate flow only with prior-status gate.
- G2-13-010-061 — src/modules/placements/job-service.ts / job detail presentation: Repair migrated null stage to explicit initial stage; no untracked null workflow.
- G2-13-015-011 — src/modules/placements/offer-service.ts / offer detail presentation: Map respondBy→expiresAt and letterUrl→offerLetterUrl, with null 'to be announced' display
- G2-13-015-015 — src/modules/placements/offer-service.ts / offer detail presentation: Order latest by source created timestamp with version tie-breaker; ensure stable multi-version display
- G2-13-015-016 — src/modules/placements/offer-service.ts / offer detail presentation: Wire scheduled expiration and external-dispute finalization with explicit parity outcomes
- G2-13-015-037 — src/modules/placements/offer-service.ts / offer detail presentation: Specify application status after offer withdrawal and exact learner notification semantics
- G2-13-015-052 — src/modules/placements/offer-service.ts / offer detail presentation: Add expiry/status partial index if recurring sweeps become expensive across colleges
- G2-13-015-056 — src/modules/placements/offer-service.ts / offer detail presentation: Specify migration table mapping, history versioning and legacy ID preservation

## Wave 2 placements part 2 (cross-file authorized parity)
- G2-13-015-060 — src/modules/placements/application-service.ts, company service and presentation: Align legacy ordering to createdAt vs issuedAt and release-to-expire mapping
- G2-14-011-009 — src/modules/placements/job-service.ts and role editor: Make field by field display adapter including unstructured CTC text
- G2-14-015-007 — src/modules/placements/application-service.ts, company service and presentation: Document field alias lifecycleStatus to status in compatibility projection
- G2-14-015-009 — src/modules/placements/application-service.ts, company service and presentation: Crosswalk tabs and filtering for SENT_BACK/REQUEST/REJECTED
- G2-14-016-010 — src/modules/placements/recruiter-service.ts and recruiter UI: Preserve revoker role in activity metadata or schema history
- G2-14-016-031 — src/modules/placements/recruiter-service.ts and recruiter UI: Define historical reactivation or new-row provenance
- G2-14-019-005 — src/modules/placements/round-service.ts and candidate round pages: Map roundDescription to contextual round instructions shown to candidates
- G2-14-019-006 — src/modules/placements/round-service.ts and candidate round pages: Show room vs meeting URL by mode with original fallback
- G2-14-019-009 — src/modules/placements/round-service.ts and candidate round pages: Preserve interviewType as typed annotation or name crosswalk
- G2-14-019-013 — src/modules/placements/round-service.ts and candidate round pages: Map historical boolean to explicit recommendation action when known
- G2-14-019-056 — src/modules/placements/round-service.ts and candidate round pages: Add mapping to original candidate-facing status wording
- G2-14-019-057 — src/modules/placements/round-service.ts and candidate round pages: Map ONLINE to VIRTUAL and OFFLINE to ON_CAMPUS
- G2-14-019-058 — src/modules/placements/round-service.ts and candidate round pages: Preserve sub-type labels in round titles
- G2-14-020-007 — src/modules/placements/application-service.ts, company service and presentation: Resolve owner faculty membership and fallback labels on import
- G2-14-020-012 — src/modules/placements/recruiter-service.ts and recruiter UI: Preserve invite funnel metrics as append-only events/counters
- G2-14-020-018 — src/modules/placements/application-service.ts, company service and presentation: Backfill counters and event retention
- G2-14-020-032 — src/modules/placements/application-service.ts, company service and presentation: Map deleted true to archived with tombstone reason
- G2-14-020-039 — src/modules/placements/application-service.ts, company service and presentation: Implement idempotent joins and precise metrics
- G2-14-020-050 — src/modules/placements/application-service.ts, company service and presentation: Use same trusted/opens/joins labels in company engagement view
- G2-14-020-053 — src/modules/placements/application-service.ts, company service and presentation: Ensure rate limits and dedup to protect counters
- G2-14-020-061 — src/modules/placements/application-service.ts, company service and presentation: Map historical soft-deletes and restores
- G2-15-015-018 — src/modules/placements/application-service.ts, company service and presentation: Align min3 at server/DB or document intentional one-char allowance.
- G2-15-015-060 — src/modules/placements/application-service.ts, company service and presentation: Align writer/readers to one canonical schema/decision values.
- G2-15-015-064 — src/modules/placements/application-service.ts, company service and presentation: Enforce exact >=3 on migrated/new writes.
- G2-15-014-012 — src/modules/placements/round-service.ts and candidate round pages: Map legacy testLink to new testUrl and resultsDue to resultsDueAt explicitly.
- G2-15-014-049 — src/modules/placements/round-service.ts and candidate round pages: Preserve external assessment link and URL validation in fields.
- G2-15-014-062 — src/modules/placements/application-service.ts, company service and presentation: Verify transaction reorder doesn't violate transient uniqueness.
- G2-15-014-063 — src/modules/placements/round-service.ts and candidate round pages: Choose source IST policy and preserve exact local wall-time.
- G2-15-016-007 — src/modules/placements/recruiter-service.ts and recruiter UI: Use Designation visible label while mapping to title.
- G2-15-016-008 — src/modules/placements/recruiter-service.ts and recruiter UI: Expose old suspended/reason staff state and reinstate semantics.
- G2-15-016-014 — src/modules/placements/recruiter-service.ts and recruiter UI: Preserve creator actor role and optimistic revision via updatedAt token.
- G2-15-016-023 — src/modules/placements/recruiter-service.ts and recruiter UI: Persist/display staff suspension reason if recruiter suspensions supported.
- G2-15-016-039 — src/modules/placements/recruiter-service.ts and recruiter UI: Clarify SUSPENDED vs ARCHIVED mapping and restore eligibility.
- G2-15-016-054 — src/modules/placements/recruiter-service.ts and recruiter UI: Use old visible label Designation where exact clone required.
- G2-16-014-011 — src/modules/placements/application-service.ts, company service and presentation: Document old-ID compatibility if migration needed.
- G2-16-014-030 — src/modules/placements/application-service.ts, company service and presentation: Map enums intentionally and label accurately.
- G2-16-014-032 — src/modules/placements/application-service.ts, company service and presentation: Verify application job/learner join indexes.
- G2-16-014-033 — src/modules/placements/application-service.ts, company service and presentation: Add partial status/expiry and dispute-deadline indexes.
- G2-16-014-035 — src/modules/placements/application-service.ts, company service and presentation: Implement strict DB-clock cutoff with idempotent cascade.
- G2-16-014-037 — src/modules/placements/application-service.ts, company service and presentation: Record historical mapping or approved no-migration choice.

## Wave 2 placements part 3 (authorized projection and migration handoffs)
- G2-16-014-038 — src/modules/placements job, application and company read/write projections: Verify CTC conversion, null joins, lifecycle timelines.
- G2-16-014-039 — src/modules/placements job, application and company read/write projections: Add partial due indexes and test query plan.
- G2-16-015-007 — src/modules/placements job, application and company read/write projections: Document integer→UUID mapping for programs and legacy batch-to-cohort; avoid silently dropping cohort targeting.
- G2-16-015-037 — src/modules/placements job, application and company read/write projections: Document migration schema correspondence and data preservation before cutover.
- G2-17-014-008 — src/modules/placements job, application and company read/write projections: Map IDs, audit creator and timestamp to normalized history.
- G2-17-014-045 — src/modules/placements job, application and company read/write projections: Backfill creator to service actor or sentinel carefully; convert IST if known.
- G2-17-021-009 — src/modules/placements job, application and company read/write projections: Render in IST/local time without shifting calendar day.
- G2-17-021-037 — src/modules/placements job, application and company read/write projections: Create stable legacy int/slug→UUID mapping if public deep links survive.
- G2-18-011-007 — src/modules/placements job, application and company read/write projections: Compose same learner-readable round/date string from joined round/screening state.
- G2-18-011-008 — src/modules/placements job, application and company read/write projections: Retrieve audited withdrawal reason from history/metadata and use exact UI copy.
- G2-18-011-038 — src/modules/placements job, application and company read/write projections: Build action-to-table side effect matrix including withdrawn/declined offers.
- G2-18-011-046 — src/modules/placements job, application and company read/write projections: Migrate withdrawn rows and support own history without resurrecting terminal stage.
- G2-18-011-068 — src/modules/placements job, application and company read/write projections: Build event/topic routing matrix, ensure exactly-once post-commit observer behavior.
- G2-2-016-007 — src/modules/placements job, application and company read/write projections: Document field-to-field read model and maintain company display from canonical source
- G2-2-016-052 — src/modules/placements job, application and company read/write projections: Document IDs/fields/filters and import compatibility (migration explicitly not required)
- G2-2-016-157 — src/modules/placements job, application and company read/write projections: Document field-by-field ID, ownership, status and version mapping
- G2-2-016-158 — src/modules/placements job, application and company read/write projections: Preserve migrated historical statuses, source and version semantics in new columns
- G2-19-022-137 — src/modules/placements job, application and company read/write projections: Produce field-level migration matrix for legacy settings, blocked dates, notification defaults, job types
- G2-20-011-007 — src/modules/placements job, application and company read/write projections: Map status/actor/reason fields explicitly and adopt bounds or documented new schema
- G2-20-011-023 — src/modules/placements job, application and company read/write projections: Use service/system identity for automated transitions or nullable audited actor with reason
- G2-20-011-031 — src/modules/placements job, application and company read/write projections: Document APPLIED→SUBMITTED and display migration-compatible status label
- G2-20-011-033 — src/modules/placements job, application and company read/write projections: Normalize status and implement idempotency for retrying same request
- G2-20-011-036 — src/modules/placements job, application and company read/write projections: Document schema field/constraint/index mapping for all historical states
- G2-20-012-009 — src/modules/placements job, application and company read/write projections: Map legacy APPLIED to SUBMITTED in UI/copy and history
- G2-20-012-025 — src/modules/placements job, application and company read/write projections: Map state machine and initial status labels
- G2-20-012-039 — src/modules/placements job, application and company read/write projections: Map active job/application identity and status fields, no migration if empty prod
- G2-3-013-008 — src/modules/placements job, application and company read/write projections: Legacy fields applicationId INT, old/new status varchar50, changedAt local datetime, changedBy nullable INT, rejectionReason varchar500. vNext UUID parent/actor required UUID, from/to varchar24, reason text, occurredAt timestamptz and optional cascadeId. Map all fields/constraints.
- G2-3-013-015 — src/modules/placements job, application and company read/write projections: Legacy writer trims statuses, normalizes blank oldStatus to null and caps rejectionReason at 500. VNext status history schema stores text reason without bound; add exact boundary validation.
- G2-3-013-039 — src/modules/placements job, application and company read/write projections: Legacy repeated identical status case-insensitively no-op; vNext strict enum/history CHECK prevents duplicate but may surface DB failure for two concurrent writes. Add expected-state compare and typed conflict.
- G2-3-013-045 — src/modules/placements job, application and company read/write projections: Legacy query excludes soft-deleted records; vNext history schema has no deleted flag and always returns rows. If deleted historic rows migrate, filter tombstones during import rather than exposing them.
- G2-3-015-029 — src/modules/placements job, application and company read/write projections: Legacy active learner-visible job requires active=true,deleted=false,not draft,visibilityType != EXTERNAL_ONLY; vNext PUBLISHED + archivedAt null and related company status, but no external-only visibilityType. Define explicit ATS-only exclusion.
- G2-3-015-040 — src/modules/placements job, application and company read/write projections: Legacy sorts IDs before fetching rows to avoid MySQL JSON sort buffer overflow and restores that order; vNext SQL sorts projected joined rows, small paginated slices. Keep indices/limits for JSON-heavy records.
- G2-3-015-044 — src/modules/placements job, application and company read/write projections: Legacy slug existence COUNT includes deleted rows to prevent reuse; vNext UUID PK with no legacy jobSlug uniqueness check. Add compatibility slug reservation map if importing old links.
- G2-3-015-048 — src/modules/placements job, application and company read/write projections: Legacy companyId index/group counts with legacy name fallback; vNext relationship_id index no equivalent name-linked history. Model company legacy alias and scoped usage aggregates.
- G2-12-014-066 — src/modules/placements job, application and company read/write projections: Legacy only isDeleted=false records cached, vNext DB application status and lifecycle check no isDeleted column; historic deleted visibility contract differs.
- G2-13-019-003 — src/modules/placements job, application and company read/write projections: Company name/logo duplicated on legacy job; vNext references normalized company relationship.
- G2-13-019-004 — src/modules/placements job, application and company read/write projections: RoleOptions JSON replaced by normalized placementJobRoleOptions and eligibility-policy tables.
- G2-13-019-006 — src/modules/placements job, application and company read/write projections: Responsibilities, string location and CTC range become legacyPostingDetails, locations text[] and min/max INR.
- G2-13-019-008 — src/modules/placements job, application and company read/write projections: Legacy four target department/program/batch/class FKs replaced by other eligibility scopes.
- G2-13-019-009 — src/modules/placements job, application and company read/write projections: postedDate + importantDates case-insensitive application deadline reconciliation differs from publishedAt/deadline and typed JSON.

## Wave2 placements part4 cross-file implementations
- G2-13-019-010 — placement service/authorized page owner: Legacy nullable season and owner faculty FKs vs mandatory UUID season/optional ownerMembership.
- G2-13-019-019 — placement service/authorized page owner: POOL drive mode, REGULAR/DREAM/SUPER_DREAM and override reason collapsed into other flags/policies.
- G2-13-019-025 — placement service/authorized page owner: Legacy screeningVersion v1 invariant not present on placementJobs table.
- G2-13-019-026 — placement service/authorized page owner: Legacy resultsAutoApply and cancelledAt represented by independent lifecycle/event fields, not same scalar flags.
- G2-13-019-029 — placement service/authorized page owner: Company logo direct 500-char URL moved into global company/object path branding.
- G2-13-019-032 — placement service/authorized page owner: Last-saved actor/time legacy fields require equivalent audit projections.
- G2-13-019-036 — placement service/authorized page owner: Potential assessment URL visibility regression from nested legacyPostingDetails in vNext DTO.
- G2-13-019-038 — placement service/authorized page owner: Legacy ON_CAMPUS/POOL/OFF_CAMPUS, Regular/Dream/Super Dream wording not direct new labels.
- G2-13-019-039 — placement service/authorized page owner: Legacy denormalized companyName/logo avoid join; normalized company requires indexed relationship join.
- G2-13-019-043 — placement service/authorized page owner: MySQL JPA JSON model vs PostgreSQL Drizzle normalized placement job, changed migrations/deployment dependencies.
- G2-13-019-044 — placement service/authorized page owner: Legacy jdUrl requires storage provider mapping to signed asset APIs.
- G2-13-019-046 — placement service/authorized page owner: Legacy candidatePreferences keys (skills, graduation year, preferredCity) vs vNext typed subset, possible data loss.
- G2-13-019-049 — placement service/authorized page owner: POOL and SUPER_DREAM/categoryOverrideReason not direct mapped in job entity.
- G2-3-031-069 — placement service/authorized page owner: Legacy activeCollegeCount and Status SUSPENDED/DELETED vs vNext grant count and ARCHIVED/DISABLED; explicit status transform.
- G2-4-015-017 — placement service/authorized page owner: Define cross-college preference duplication and identity mapping.
- G2-4-015-018 — placement service/authorized page owner: Define preference archive/restoration when membership ends.
- G2-4-015-041 — placement service/authorized page owner: Backfill legacy null as true, false remains false.
- G2-4-015-058 — placement service/authorized page owner: Explicitly migrate null to enabled.
- G2-12-015-004 — placement service/authorized page owner: Restore legacy visual field order in package editor.
- G2-12-015-007 — placement service/authorized page owner: Default missing legacy package name while resolving same-name collisions.
- G2-12-015-013 — placement service/authorized page owner: Add stable position ordering and import existing array order.
- G2-12-015-037 — placement service/authorized page owner: Flag duplicate source roles and resolve losslessly during migration.
- G2-13-020-009 — placement service/authorized page owner: Enforce legacy max100 and report oversized imported values.
- G2-13-020-010 — placement service/authorized page owner: Map description→about and 2000 max.
- G2-13-020-013 — placement service/authorized page owner: Document migrated created-by and legacy provenance separately.
- G2-13-020-014 — placement service/authorized page owner: Map true/false from timestamp+user, preserve old verifier attribution.
- G2-13-020-036 — placement service/authorized page owner: Map deleted vs archived state and merged redirects across both layers.
- G2-13-020-048 — placement service/authorized page owner: Add precise constraints and import violations report.
- G2-13-030-008 — placement service/authorized page owner: Join scoped learner identity and show same fallback.
- G2-13-030-010 — placement service/authorized page owner: Map timezone/format, star rating, recommendation and privacy-protected notes.
- G2-4-023-015 — placement service/authorized page owner: Map verified bool and deleted state without reviving archived/merged records.
- G2-4-023-070 — placement service/authorized page owner: Use legacy-ID to UUID map and backfill link identities without exposing raw hashes.
- G2-13-021-008 — placement service/authorized page owner: Map legacy ID to application UUID and keep uniqueness.
- G2-13-021-015 — placement service/authorized page owner: Keep separate auto status lifecycle if reintroducing scores.
- G2-13-021-050 — placement service/authorized page owner: Document soft delete and retention policy.
- G2-5-013-008 — placement service/authorized page owner: Create field crosswalk including null placeholders/currency precision/optional dates
- G2-5-013-020 — placement service/authorized page owner: Map attachment to offer document record and keep old URL validation behavior
- G2-5-013-049 — placement service/authorized page owner: Report terminal rejection using screening stage and withdrawal separately
- G2-5-013-060 — placement service/authorized page owner: Map visibility vs application channel to avoid off-platform leaks
- G2-5-013-068 — placement service/authorized page owner: Map signed file/document link to normalized offer attachment feature

## Wave 2 placements part 5: scoped follow-up for non-schema findings
- G2-5-013-084 — src/modules/placements/company-service.ts and company verification UI: Document migration field mapping, indexes and uniqueness constraints
- G2-5-015-010 — src/modules/placements/application-service.ts and authorized application history routes: Map nullable system actors safely; avoid inventing human authors.
- G2-5-015-023 — src/modules/placements/application-service.ts and authorized application history routes: Exclude deleted legacy history during migration; specify append-only policy.
- G2-5-015-040 — src/modules/placements/application-service.ts and authorized application history routes: Profile and add `(application_id,to_status,created_at)` index for filtered reports.
- G2-5-015-045 — src/modules/placements/round-service.ts and candidate round UI: Define migration mappings and excluded deleted events.
- G2-6-021-038 — src/modules/placements/application-service.ts and authorized application history routes: Create central mapping inventory for all legacy entities and avoid assuming one uniform vNext deleted column.
- G2-6-019-034 — src/modules/placements/placement presentation and API: Preserve legacy values with explicit mapping of no preference and remote.
- G2-8-012-007 — src/modules/placements/company-service.ts and company verification UI: Document field-to-field read model and maintain company display from canonical source
- G2-8-012-052 — src/modules/placements/application-service.ts and authorized application history routes: Document IDs/fields/filters and import compatibility (migration explicitly not required)
- G2-8-019-010 — src/modules/placements/application-service.ts and authorized application history routes: Import original transition time instead of migration write time.
- G2-8-019-012 — src/modules/placements/application-service.ts and authorized application history routes: Align max length and retention of rejection reason.
- G2-8-019-015 — src/modules/placements/application-service.ts and authorized application history routes: Decide immutable audit strategy; exclude imported deleted records.
- G2-8-019-016 — src/modules/placements/application-service.ts and authorized application history routes: Map invalid event producer input to controlled no-op or validation error.
- G2-8-019-017 — src/modules/placements/application-service.ts and authorized application history routes: Guard against unchanged duplicate transition writes in producers.
- G2-8-019-033 — src/modules/placements/application-service.ts and authorized application history routes: Define safe max and exact validation wording.
- G2-8-019-052 — src/modules/placements/application-service.ts and authorized application history routes: Choose durable audit retention on application deletion and preserve FK.
- G2-8-019-055 — src/modules/placements/application-service.ts and authorized application history routes: Retain original time on imported row.
- G2-8-019-057 — src/modules/placements/application-service.ts and authorized application history routes: Define safe maximum and field mapping.
- G2-8-019-058 — src/modules/placements/application-service.ts and authorized application history routes: Document audit immutability; filter historic deleted during import.
- G2-8-015-001 — src/modules/placements/round-service.ts and candidate round UI: Document route/ID map, old round IDs not directly reusable
- G2-8-015-007 — src/modules/placements/round-service.ts and candidate round UI: Legacy-to-new link resolver if migration ever used
- G2-8-015-015 — src/modules/placements/round-service.ts and candidate round UI: Map testLink→testUrl in read/write and imports
- G2-8-015-017 — src/modules/placements/round-service.ts and candidate round UI: Convert timezone and keep due-after-round invariant
- G2-8-015-022 — src/modules/placements/round-service.ts and candidate round UI: Derive timezone from college and show visible field if needed
- G2-8-015-039 — src/modules/placements/round-service.ts and candidate round UI: Map exact max length/trim validation strings
- G2-8-015-044 — src/modules/placements/round-service.ts and candidate round UI: Provide mapping for field names and historical time interpretation
- G2-15-026-008 — src/modules/placements/company-service.ts and company verification UI: Display old job title/company/logo and recorded-outside flag via split entities
- G2-8-022-052 — src/modules/placements/round-service.ts and candidate round UI: Use descending startDate and stable tie order; benchmark query under 1000 archived seasons.
- G2-9-004-086 — src/modules/placements/company-service.ts and company verification UI: Restore domain alias list and verification label mapping.
- G2-9-015-102 — src/modules/placements/application-service.ts and authorized application history routes: Retain fallback parsing for legacy civil-date migration.
- G2-9-016-098 — src/modules/placements/application-service.ts and authorized application history routes: Define postedDate->publishedAt mapping and all/active counts.
- G2-9-016-101 — src/modules/placements/application-service.ts and authorized application history routes: Maintain dates synchronization and timezone conversion.
- G2-9-013-101 — src/modules/placements/application-service.ts and authorized application history routes: Map deleted versus archived in reports, list filters and exports.
- G2-13-025-009 — src/modules/placements/placement presentation and API: Return explicit success only after committed decline.
- G2-13-025-014 — src/modules/placements/placement presentation and API: Do not require recruiter-entered reason.
- G2-13-025-031 — src/modules/placements/placement presentation and API: Implement loading skeleton, 401, transient retry and stale resolution state.
- G2-13-025-034 — src/modules/placements/placement presentation and API: Audit decline without inventing outbound email/bell.
- G2-13-025-037 — src/modules/placements/placement presentation and API: Use buttons with explicit 'Accept/Decline invitation to [college]' labels.
- G2-17-023-060 — src/modules/placements/application-service.ts and authorized application history routes: Confirm Asia/Kolkata conversions and transition compare-and-set semantics.
- G2-18-013-056 — src/modules/placements/placement presentation and API: Verify legacy orphan job visibility vs new non-null college FK.

## Wave 2 placements part 6: scoped follow-up for non-schema findings
- G2-9-033-101 — src/modules/placements/company-service.ts and company verification UI: Align lengths and field names across API and constraints.
- G2-9-034-027 — src/modules/placements/company-service.ts and company verification UI: Check verification propagates across all domains and recruiter drive company matching
- G2-15-019-024 — src/modules/placements/company-service.ts and company verification UI: Ensure accessible required and duplicate-name messages at form boundary
- G2-20-011-012 — src/modules/placements/application-service.ts and authorized application history routes: Define standardized max length at service boundary and UI helper
- G2-3-013-027 — src/modules/placements/application-service.ts and authorized application history routes: Legacy rejectionReason truncates to 500 preserving whitespace except blank filter; vNext free text reason is nullable and has no max at column level. Match 500 for equivalent public reason.
- G2-3-013-038 — src/modules/placements/application-service.ts and authorized application history routes: Legacy indexes application_id and changed_at separately, vNext compound application_id/created_at index and cascade partial index. Confirm query plans, preserve stable asc ordering.

## Wave 2 course discussion part1 — service/layout dependencies
- G2-18-001-013 — src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx: Avoid duplicate page heading and preserve pinned-strip/feed/composer vertical hierarchy.
- G2-2-033-004 — src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx: Remove redundant subtitle on learner path and restore old course tab head/card padding.
- G2-2-033-005 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Clone strip border/background, inline pin icon, author/time placement, tiny unpin icon.
- G2-2-033-006 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Match exact section order: pin strip, refresh warning within feed, scrolling log, jump overlay.
- G2-2-033-007 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Align composer bar, compact send action and fixed location below scroll.
- G2-2-033-008 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Match legacy avatar tint algorithm and 5-minute grouped bubble styling.
- G2-2-033-010 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Restore legacy icon buttons and tooltips; retain new Reply as extra.
- G2-2-033-019 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Keep 15s cadence but avoid re-downloading current page each tick; apply mutation delta.
- G2-2-033-024 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Compare disabled message composer state during partial refresh/error and revoked rights.
- G2-2-033-036 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Remove canPost gate from authorized moderator unpin when read-only moderation permitted; preserve noninteractive banner.
- G2-2-033-049 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Restore legacy spinner type and exact initial error/empty header/card sizing.
- G2-2-033-057 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Compare 320/375/768/1280 screenshot for panel height, pinned strip and composer stacking.
- G2-2-033-060 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Give accessible item-specific names and restore icon tooltips.
- G2-2-033-067 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Fetch updates only or use ETag/updatedAt to avoid repeated first-page load.
- G2-2-033-074 — src/components/shell/app-shell.tsx / course discussion page prop: Wire tenant chat polling setting or explicitly deprecate it.
- G2-2-037-035 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Match legacy skeleton/spinner/Retry copy/empty-state layout.
- G2-12-009-001 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy Classroom tab uses Redux selectedCourseId plus resolved class assignment; vNext mounts LearnerCourseDiscussion for immutable courseSectionDeliveryId.
- G2-12-009-004 — src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx: Legacy nested learn-projects-detail page-head+body/content; vNext generic `min-w-0 space-y-4` and border-y surface, verify canvas padding.
- G2-12-009-005 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy pinned strip with PushpinFilled icon and optional unpin beside message; vNext border-l primary tinted section with unpin below.
- G2-12-009-006 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy scroll and composer use plain `ln-classroom` skins; vNext explicit border-y region, gradient scroll hints, form border and responsive flex.
- G2-12-009-007 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy avatar beside bubble+icon action rail and minimal grouped rows; vNext all text inside bordered left/right message bubbles, actions as text links.
- G2-12-009-009 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy pinned banner shows PushpinFilled and Pinned by below body; vNext author/count line above message plus separate timestamp.
- G2-12-009-010 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy name+5-minute grouped senders and Tag Faculty/Pinned with relative tooltip; vNext StatusBadge and circular initial inside message bubble.
- G2-12-009-011 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy icon-only Pin/Unpin/Delete action with Tooltip and aria-label, vNext word buttons Reply/Pin/Delete.
- G2-12-009-012 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy show character count only after >3400; vNext always shows `N/3900`, with phone-specific Tap Send hint.
- G2-12-009-014 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy hashes sender ID into eight deterministic pastel avatar palettes; vNext only 3 tone families and one initial based on role/self.
- G2-12-009-017 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy relative timestamps derive from legacy timezone/date utils and user locale; vNext learnerDiscussionRelativeTimeLabel may use IST/format differences.
- G2-12-009-019 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy initial GET unbounded full course/class history; vNext 60 newest + explicit older pagination and reconcile, safer for large classes.
- G2-12-009-020 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy first pinned message from entire list, vNext separately gets highlightedPinned query even when old pinned outside page.
- G2-12-009-023 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy Enter posts regardless of pointer; vNext mobile coarse pointer uses Enter newline, desktop Enter send, preserves IME.
- G2-12-009-034 — src/components/shell/app-shell.tsx route transition integration: Legacy routeChangeStart unsent draft native confirm while navigating; vNext intercepts in-app links with ConfirmDialog but not necessarily programmatic navigation.
- G2-12-009-035 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy Pin/Delete direct tooltip buttons, vNext text actions and reply flow, moving deletion dialog access.
- G2-12-009-048 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy loading central Spin and scopeReady false Discussion unavailable, vNext skeleton 3 rows and may show read-only Past semester if canPost false.
- G2-12-009-049 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Faculty empty body copy truncated from Learners are far more likely to post... to Welcome your class or share the week's focus.
- G2-12-009-050 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy closable Ant Alert Discussion refresh failed with separate stale-state description; vNext Alert without visible closable x.
- G2-12-009-051 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy no class assignment is Discussion unavailable with explicit linkage explanation; vNext can indicate Past semester/read-only but route gate may prevent rendering.
- G2-12-009-056 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): VNext scroll viewport min56dvh mobile and max34rem desktop; legacy ln-classroom-scroll height from SCSS not verified to match.
- G2-12-009-057 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): VNext mobile coarse-pointer changes Enter behavior and full-width Send button, legacy one consistent key hint.
- G2-12-009-060 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy icon button aria-label Pin this message / Delete this message and tooltips; vNext text controls with visible labels, no identical focused hover affordance.
- G2-12-009-067 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy delta polling transfers updatedAt changes only; vNext poll fetches newest page snapshot repeatedly every ~15s.

## Wave 2 course discussion part2 — service/layout dependencies
- G2-12-009-072 — src/components/shell/app-shell.tsx route transition integration: Legacy Router routeChangeStart catches all internal route changes and browser beforeUnload; vNext captures link clicks + beforeUnload, not every navigation source.
- G2-12-009-073 — src/components/shell/app-shell.tsx / course discussion page prop: Legacy ui.chatPollIntervalMs loaded through client settings; vNext pollIntervalMs prop default15000, platform config source must be traced at call site.
- G2-12-009-081 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy separate sender-coloured avatar and icon action rail replaced by border bubble message cards; restore visual clone without losing reply.
- G2-17-027-003 — src/modules/courses/discussion service, lesson-thread route and scoped sender projection: Legacy headless lesson-content comment endpoint powers content-specific thread; vNext full course discussion feed with pinned strip.
- G2-17-027-005 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy contentText/sequence/userName/profileName metadata, vNext messageText composer and sender membership identity.
- G2-17-027-006 — src/modules/courses/discussion service, lesson-thread route and scoped sender projection: Legacy profile image, class name and roll number for learner messages; vNext initial avatar, no roll/class in course chat.
- G2-17-027-019 — src/modules/courses/discussion service, lesson-thread route and scoped sender projection: Legacy lesson-content comment input contained in lesson item, vNext delivery composer outside lesson context.
- G2-17-027-035 — src/modules/courses/discussion service, lesson-thread route and scoped sender projection: Profile image/avatar and roll/class on old lesson comments vs initial-only badges in new course chat.
- G2-17-027-036 — src/modules/courses/discussion service, lesson-thread route and scoped sender projection: Old server uses content-specific text errors; new composer count/aria and Enter send should be compared with actual legacy form.
- G2-17-027-038 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy phrase Content cannot be empty / cannot exceed 5000 characters missing as typed new composer copy.
- G2-17-027-050 — src/modules/courses/discussion service, lesson-thread route and scoped sender projection: Old profile image, class name and roll missing from new course chat response; decide required privacy fields.
- G2-19-031-104 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Add aria-live message log without noisy reload.
- G2-18-001-087 — src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx: Restore subtitle and relocate scoping to helper/breadcrumb.
- G2-2-033-009 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Use compact unpin icon button on desktop with same accessible title.
- G2-2-033-011 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Restore exact placeholder with punctuation and control height.
- G2-2-033-034 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Align confirm description, Cancel/Delete labels/order, backdrop, pending disable.
- G2-2-033-050 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Place refresh warning above scroll inside feed and keep closable behavior.
- G2-2-033-058 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Clone desktop side-by-side send row and add phone-safe vertical stacking.
- G2-2-033-062 — src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx: For faculty legacy view use exact same subtitle unless separately approved.
- G2-2-033-064 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Restore exact dotted placeholder.
- G2-2-033-065 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Match Retry button label and icon in refresh banner.
- G2-2-037-019 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Match character count threshold, placeholder, rows and disabled states.
- G2-12-009-008 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy one-line Keep course conversations in one place and follow along easily; faculty now gets extra Guide the class conversation… description and Students can post questions here anytime.
- G2-12-009-065 — src/components/courses/learner-course-discussion.tsx (legacy DOM/CSS parity follow-through): Legacy Enter to send · Shift+Enter for a new line always; vNext Tap Send to post · Enter adds a new line on phone.

## Wave2 academic schema part 1 — scoped UI/service dependencies
- G2-18-015-001 — src/modules/academics/class-service.ts / section and group-backed selectors: Document legacy class-to-section identity mapping; no direct table reuse
- G2-18-015-003 — src/modules/academics/class-service.ts / section and group-backed selectors: Confirm API presentation dates and label differences
- G2-18-015-004 — src/modules/academics/class-service.ts / section and group-backed selectors: Prevent grouping legacy group-backed classes as SECTION during imports
- G2-18-015-007 — src/modules/academics/class-service.ts / section and group-backed selectors: Define zero vs unset semantics and display default
- G2-18-015-010 — src/modules/academics/class-service.ts / section and group-backed selectors: Map program/batch to cohort and program of cohort with null-batch handling
- G2-18-015-015 — src/modules/academics/class-service.ts / section and group-backed selectors: Preserve name-or-ID class selector via scoped search
- G2-18-015-021 — src/modules/academics/class-service.ts / section and group-backed selectors: Map null/false soft delete to ACTIVE and archived to non-active status
- G2-18-015-023 — src/modules/academics/class-service.ts / section and group-backed selectors: Publish precise computed legacy date fields in export/import
- G2-18-015-026 — src/modules/academics/class-service.ts / section and group-backed selectors: Ensure field-required labels reflect new date scope
- G2-18-015-027 — src/modules/academics/class-service.ts / section and group-backed selectors: Preserve '[Elective]' display for group-backed legacy selectors
- G2-18-015-029 — src/modules/academics/class-service.ts / section and group-backed selectors: Guarantee scope-specific name sort for targets
- G2-18-015-031 — src/modules/academics/class-service.ts / section and group-backed selectors: Record import collision and mapping strategy
- G2-18-015-034 — src/modules/academics/class-service.ts / section and group-backed selectors: Write DB migration mapping for class soft-delete/date FK
- G2-18-015-037 — src/modules/academics/class-service.ts / section and group-backed selectors: Document intended historical duplicate behavior vs active naming
- G2-18-020-001 — src/modules/academics/class-service.ts / section and group-backed selectors: Map legacy /scheduleClass and /admin timetable deep links to new schedule events and calendar entry points, retaining section context
- G2-18-020-003 — src/modules/academics/class-service.ts / section and group-backed selectors: Reconstitute exact event detail row order and labels in calendar/drawer; avoid exposing raw UUIDs in cards
- G2-18-020-005 — src/modules/academics/class-service.ts / section and group-backed selectors: Default blank legacy title consistently in new UI; ensure required title not a confusing validation regression
- G2-18-020-006 — src/modules/academics/class-service.ts / section and group-backed selectors: Show hall name/number if hall assigned and location fallback only when absent; match old room label
- G2-18-020-010 — src/modules/academics/class-service.ts / section and group-backed selectors: Map hall records and title fallback, preserve display of no hall
- G2-18-020-018 — src/modules/academics/class-service.ts / section and group-backed selectors: If unassigned events allowed, display 'Faculty not assigned' and exclude from faculty-owned read until assigned
- G2-18-020-035 — src/modules/academics/class-service.ts / section and group-backed selectors: Ensure cancelled event excluded from schedule/attendance denominator and historical audit retained appropriately
- G2-18-020-050 — src/modules/academics/class-service.ts / section and group-backed selectors: Return courseSlug-equivalent in DTO when caller depends on slug bookmarks, not persisted
- G2-19-019-053 — src/modules/academics/class-service.ts / section and group-backed selectors: Reconstruct historical cohort even if section/cohort moves, do not treat section-level grant as course grant
- G2-13-018-010 — src/modules/academics/program-service.ts / academic directory: Resolve old department numeric IDs to current UUID and reject dangling links
- G2-13-018-047 — src/modules/academics/program-service.ts / academic directory: Use paginated API for institution-scale program listings; don't materialize all org records
- G2-13-018-049 — src/modules/academics/cohort-service.ts / batch UI: Use exact integer conversion and flag unsupported >10-year legacy values
- G2-13-018-050 — src/modules/academics/program-service.ts / academic directory: Document unique exclusion for archived and handle restoration collisions
- G2-13-018-052 — src/modules/academics/program-service.ts / academic directory: Schema migration needs old numeric-to-UUID map and explicit foreign-key integrity plan
- G2-2-029-100 — src/modules/academics/cohort-service.ts / batch UI: Normalize legacy `YYYY-YY` into accepted new format and retain unparseable originals for review.
- G2-2-031-020 — src/modules/academics/class-service.ts / section and group-backed selectors: Expose editable class minimum only if legacy parity required; preserve stored min_size data.
- G2-2-031-058 — src/modules/academics/class-service.ts / section and group-backed selectors: Map historic legacy dates to period/metadata or preserve separate historical fields.
- G2-20-019-001 — src/modules/academics/class-service.ts / section and group-backed selectors: Crosswalk faculty/course/class to membership/section and derive course
- G2-20-019-005 — src/modules/people/college-faculty-detail-service.ts / assignments: Map Active/Ended badge and default
- G2-20-019-007 — src/modules/academics/class-service.ts / section and group-backed selectors: Preserve ID translation
- G2-20-019-012 — src/modules/academics/class-service.ts / section and group-backed selectors: Handle incomplete mapping and role default
- G2-20-019-021 — src/modules/people/college-faculty-detail-service.ts / assignments: Map old deactivation date to endedAt when known
- G2-20-019-031 — src/modules/academics/class-service.ts / section and group-backed selectors: Write full DDL and migration crosswalk
- G2-20-019-033 — src/modules/academics/class-service.ts / section and group-backed selectors: Validate retired partial mappings
- G2-14-026-014 — src/modules/academics/program-service.ts / academic directory: Legacy college listing includes any underlying new_program not deleted per service, vNext ACTIVE-only and excludes archived parent departments.
- G2-5-011-069 — src/modules/academics/class-service.ts / section and group-backed selectors: Map legacy identities and attendance session semantics to new schema; document migration deliberate divergence.

## Wave2 academic schema part 2 — scoped UI/service dependencies
- G2-5-014-022 — src/modules/academics/class-service.ts / section and group-backed selectors: Provide separate tenant-wide exact existence indicator or approve restricted uniqueness semantics
- G2-5-014-024 — src/modules/academics/class-service.ts / section and group-backed selectors: Translate old numeric class references or document mapping for usage recording
- G2-5-014-080 — src/modules/academics/class-service.ts / section and group-backed selectors: Document deletion semantics and uniqueness changes
- G2-5-021-003 — src/modules/academics/cohort-service.ts / batch UI: Project exact legacy columns in batch UI in intended order.
- G2-5-021-006 — src/modules/academics/cohort-service.ts / batch UI: Map IDs at migration/import boundaries.
- G2-5-021-009 — src/modules/academics/cohort-service.ts / batch UI: Convert timezone-dependent java.util.Date to date-only without day shift.
- G2-5-021-012 — src/modules/academics/cohort-service.ts / batch UI: Normalize legacy hyphen-year values to numeric start and display format.
- G2-5-021-013 — src/modules/academics/cohort-service.ts / batch UI: Build enum transition/retirement mapping; do not silently treat INACTIVE as COMPLETED.
- G2-5-021-043 — src/modules/academics/cohort-service.ts / batch UI: Map visible labels and data formats exactly.
- G2-5-021-047 — src/modules/academics/schedule-service.ts / class calendar: Define Asia/Kolkata calendar boundary explicitly.
- G2-18-020-052 — src/modules/academics/class-service.ts / section and group-backed selectors: Align deletion policy after cancelling sessions; handle old 'active only' count difference.
- G2-14-031-037 — src/modules/people/college-faculty-detail-service.ts / assignments: Enforce immutable ordinal after assignment
- G2-14-031-053 — src/modules/academics/program-service.ts / academic directory: Record per-column department ID/chair mapping
- G2-14-031-056 — src/modules/academics/class-service.ts / section and group-backed selectors: Document class/team/student/teacher membership translation
- G2-9-002-081 — src/modules/academics/cohort-service.ts / batch UI: Write explicit legacy schema field mapping.
- G2-9-002-083 — src/modules/academics/cohort-service.ts / batch UI: Review name uniqueness vs code-uniqueness semantics across migrations.
- G2-9-002-084 — src/modules/academics/cohort-service.ts / batch UI: Verify mapping for COMPLETED and reactivation.
- G2-9-003-087 — src/modules/academics/cohort-service.ts / batch UI: Create field mapping and account for original status values.
- G2-9-029-067 — src/modules/academics/class-service.ts / section and group-backed selectors: Restore legacy input/display year while keeping stored valid value
- G2-9-023-067 — src/modules/academics/class-service.ts / section and group-backed selectors: Restore legacy input/display year while keeping stored valid value

## Wave2 bug report legacy identity and reporter provenance
- G2-19-020-007 — src/modules/tracker report, search and activity services; report UI: Map numeric reporter_access_id to UUID for legacy issue history.
- G2-19-020-009 — src/modules/tracker report, search and activity services; report UI: Convert timezone meaning on migration.
- G2-19-020-011 — src/modules/tracker report, search and activity services; report UI: Add validated display-name search query/index or prohibit impersonating lookup.
- G2-19-020-024 — src/modules/tracker report, search and activity services; report UI: Document inactive-on-intake behavior and activation workflow.
- G2-19-020-035 — src/modules/tracker report, search and activity services; report UI: Provide case-insensitive name/active index if enrollment used.
- G2-19-020-038 — src/modules/tracker report, search and activity services; report UI: Normalize UTC/IST on imports.
- G2-19-020-042 — src/modules/tracker report, search and activity services; report UI: Resolve name lookup/index strategy.
- G2-16-002-087 — src/modules/tracker report, search and activity services; report UI: Either support optional captured source metadata in API/quick report or document retained read-only fields.
- G2-16-003-079 — src/modules/tracker report, search and activity services; report UI: Confirm historical report reference migration or approved no-migration, and reflect source metadata.
- G2-16-004-078 — src/modules/tracker report, search and activity services; report UI: Maintain old publicID lookup compatibility if historical data imported; owner says no migration might waive.
- G2-20-020-004 — src/modules/tracker report, search and activity services; report UI: Map IDs
- G2-20-020-022 — src/modules/tracker report, search and activity services; report UI: Migration crosswalk
- G2-3-021-007 — src/modules/tracker report, search and activity services; report UI: Legacy BIGINT event and issue IDs, timestamp DATETIME(6) unzoned; vNext UUID IDs, timestamptz, restrictive issue FK. Specify import identity/timezone mapping.
- G2-3-021-035 — src/modules/tracker report, search and activity services; report UI: Legacy index issue+createdAt ASC and full fetch; VNext same index but cursor ORDER BY createdAt/id DESC, no compound tie-breaker index. Add index for stable keyset paging.
- G2-3-021-043 — src/modules/tracker report, search and activity services; report UI: Legacy actor_name may be set without user FK, vNext actorUserId or accessId XOR constraint requires resolving historical Engineering/reporter event authors. Supply migration system actor.
- G2-4-021-002 — src/modules/tracker report, search and activity services; report UI: Preserve historical public IDs and old route links with safe resolver.
- G2-4-021-004 — src/modules/tracker report, search and activity services; report UI: Reconstruct detail sections and activity timeline with exact labels/order.
- G2-4-021-007 — src/modules/tracker report, search and activity services; report UI: Capture safe browser,viewport and source context from authenticated application.
- G2-4-021-014 — src/modules/tracker report, search and activity services; report UI: Wire remaining context fields with safe allowlist.
- G2-4-021-032 — src/modules/tracker report, search and activity services; report UI: Verify upload UI, provisional grants and screenshot display in report form.
- G2-4-021-056 — src/modules/tracker report, search and activity services; report UI: Use index to implement scoped efficient environment count.
- G2-4-021-058 — src/modules/tracker report, search and activity services; report UI: Handle public ID collision retries and format historical ids.
- G2-4-021-063 — src/modules/tracker report, search and activity services; report UI: Define IST/source zone on migration to prevent wrong incident chronology.
- G2-4-021-065 — src/modules/tracker report, search and activity services; report UI: Backfill missing/duplicate legacy IDs with logged reconciliation.
- G2-8-031-068 — src/modules/tracker report, search and activity services; report UI: Document legacy bug status/attachment field mapping and migration consequences; no data migration expected but functional parity required.
