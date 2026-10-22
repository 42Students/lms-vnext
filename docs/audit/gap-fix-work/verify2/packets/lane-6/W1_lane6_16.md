# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-023-036 [P1] GAP facet F10
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy completed live drive term changes trigger applicant notices/recheck and company thread event lines. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:297-307`
- Expected fix: Invoke applicant notice, eligibility re-evaluation and canonical drive discussion append.

## G2-5-023-037 [P1] GAP facet F10
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy create clears changesMadeAt for institutional requests; company resolving last open institutional request sets changesMadeAt and optionally TPO bell. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:138-151,280-291`
- Expected fix: Implement transition after last company resolution and TPO ready-to-review signal.

## G2-5-023-041 [P1] GAP facet F11
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx, src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy `/api/v1/tpo/**` permits TPO or college admin fallback when no TPO account (per client service contract). `docs/legacy-source/frontend/src/api/Services/TpoService.js:3-5`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:22-35`
- Expected fix: Restore controlled College Admin delegation/acting-role path as required by access policy.

## G2-5-023-050 [P1] GAP facet F15
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy company create sends TPO bell; last company resolution sends review-ready bell; all request events appear in drive company thread, not email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:142-148,280-306`
- Expected fix: Match receiver triggers and main thread event propagation without duplicate announcements.

## G2-5-023-056 [P1] GAP facet F19
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy list uncapped DESC query; no paging. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83`
- Expected fix: Use cursor paging, bounded message fanout and total count.

## G2-5-023-058 [P1] GAP facet F20
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy locks job FOR UPDATE before create, and request then job FOR UPDATE before decision. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:37-39,97-100,235-250`
- Expected fix: Lock placement job row FOR UPDATE when applying accepted/answered changes.

## G2-5-023-059 [P1] GAP facet F20
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy compares current vs proposed equivalently and serializes duplicate creation. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:126-130,330-355`
- Expected fix: Use constraint + transaction lock and canonicalized comparison.

## G2-5-023-061 [P1] GAP facet F21
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy downstream live-drive applicant messaging, eligibility recheck, recruiter invitation/college public-link lookup. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:297-307`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveReviewInviteService.java:56-132`
- Expected fix: Wire live-change downstream and invite integrations; document eventual retry guarantees.

## G2-5-026-005 [P1] GAP facet F03
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy inbound DTO fields id,from,headerFrom,to,subject,auth,text,html. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:52-62`
- Expected fix: Preserve verified auth evidence and subject/HTML fallback through trusted gateway.

## G2-5-026-009 [P1] GAP facet F05
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy idempotency keyed external Message-ID across all inbound emails; missing ID gets synthetic no-id timestamp. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-81`
- Expected fix: Define source-message idempotency for all mail and thread-scoped recruiter replies.

## G2-5-026-010 [P1] GAP facet F05
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy finds thread by 20hex reply token and can report NO_THREAD. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:91-99`
- Expected fix: Preserve legacy reply aliases or provide explicit migration/expiry policy.

## G2-5-026-012 [P1] GAP facet F06
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy default replyTag r or dev rdev; route by tagged 20hex address. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:49-50,158-165`
- Expected fix: Configure prod/dev mailbox aliases and stop silent lost legacy replies.

## G2-5-026-015 [P1] GAP facet F07
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy wrong From vs recruiter address or DMARC fail/unchecked SPF/DKIM yields WRONG_SENDER/NOT_VERIFIED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:102-107,176-186`
- Expected fix: Gateway MUST verify source delivery/authentication-results before HMAC signing.

## G2-5-026-017 [P1] GAP facet F07
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts, src/app/api/internal/placements/recruiter-message-inbound/route.ts
- Legacy: Legacy postEmailReply reports ACCESS_ENDED vs FAILED and stores rejected raw email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:108-118`
- Expected fix: Record restricted failure reason/message for recovery and triage.

## G2-5-026-022 [P1] GAP facet F10
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy INSERT IGNORE inbound_email with FAILED placeholder before checking token/sender. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-88`
- Expected fix: Write every received mail to quarantined event before dispatch, with retention policy.

## G2-5-026-035 [P1] GAP facet F15
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts, src/modules/inbound-mail/admin-service.ts
- Legacy: Legacy successful recruiter replies posted to recruiter thread; nonreply surfaced to Super Admin. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32`
- Expected fix: Add operator inbox event and meaningful reply notifications together.

## G2-5-028-072 [P1] GAP facet F21
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/app/api/projects/route.ts, src/modules/projects/instance-service.ts
- Legacy: Legacy AdminService invokes Spring project/people endpoints. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:5-18`
- Expected fix: Document integration migration and background notifications.

## G2-5-031-009 [P1] GAP facet F03
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy Sessions and History small buttons with tooltips; Delete disabled until suspended. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:322-326,335-344`
- Expected fix: Add direct permanent Delete disabled-state and tooltips.

## G2-6-020-054 [P1] GAP facet F22
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: (none, new feature)
- Legacy: Legacy Department int PK, name nullable, chair/vice IDs, primitive collegeId, BaseModel soft delete/timestamps (Department.java:9-23; BaseModel.java:22-37).
- Expected fix: Write field mapping for leadership IDs and archived status; preserve prior source data if migration ever happens.

## G2-6-015-006 [P1] GAP facet F04
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/application-service.ts
- Legacy: First appliedAt is immutable LocalDateTime (JobApplication.java:35-37).
- Expected fix: Preserve first submission timestamp separately from latest resubmission.

## G2-6-027-010 [P1] GAP facet F05
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/learner-job-service.ts
- Legacy: GET /active accepts page default0 and size default50 clamped1..100, computes bounded sublist (JobController.java:108-132).
- Expected fix: Implement stable DB-backed page, size max100 and total count for large learner drive feeds.

## G2-6-027-038 [P1] GAP facet F11
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy job read allows org/college admin or learner with matching resolved organization (JobController.java:976-996).
- Expected fix: Audit cross-college organization job read and super-admin acting college scope; deny lateral reads.

## G2-6-027-042 [P1] GAP facet F12
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy one application per job, duplicate guard and withdrawn restoration (JobController.java:398-400,453-457).
- Expected fix: Resolve multi-role cardinality and race semantics explicitly in product contract.

## G2-6-019-014 [P1] GAP facet F04
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: (none, new feature)
- Legacy: Legacy jobNotificationsEnabled Boolean NOT NULL default true (JobPreferences.java:41-45).
- Expected fix: Specify mapping of legacy all-jobs/interview notifications to both distinct notification toggles.

## G2-6-010-004 [P1] GAP facet F02
- Verification: DEFERRED — Deep cross-service integration, locking, or migration contract; not verified by a superficial check.
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Old cache key is `visibility:org:college:class:batch:program` `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobVisibilityCache.java:60-67`
- Expected fix: Create mapping test for old targeting dimensions, especially class versus sections
