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
