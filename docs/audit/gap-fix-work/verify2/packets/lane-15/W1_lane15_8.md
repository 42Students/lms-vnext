# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-015-030 [P1] GAP facet F10
- Files: src/db/schema/placements.ts, src/modules/placements/tpo-offer-lifecycle-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:199-252` EXTERNAL_IMPORT accepted with 48h dispute and scheduled finalization
- Expected fix: Verify/complete external-import acceptance dispute creation/closure and scheduled cascade handler

## G2-13-015-055 [P1] GAP facet F20
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:296-318` reverse accepted returns status RELEASED and extends response48h
- Expected fix: Define reversal mapping to ISSUED with new expiry and restore withdrawn sibling application/offer history

## G2-13-015-058 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:29-118` complete job_offer entity has nullable createdById/verifiedBy/releasedAt/joiningStatus, status SELECTED default
- Expected fix: Create explicit data-model crosswalk with legitimate separate evidence entities; no silent data loss on import

## G2-13-015-059 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:116-118` @Version concurrency token independent of offer count
- Expected fix: Maintain two distinct semantics: legacy entity revision versus vNext offer version ordinal

## G2-17-23-002 [P1] GAP facet F01 Route and URL
- Files: (none, new feature)
- Legacy: LC:20–33 POST /api/v1/learner/offers/{numeric offerId}/respond
- Expected fix: Document old route→new route, int→UUID ID crosswalk and update any remaining old deep links/clients; do not expose unsafe numeric alias

## G2-17-23-079 [P1] GAP facet F20 Duplicate action
- Files: (none, new feature)
- Legacy: TS:174–176 rejects any repeated attempt after first decision; LC:44–46 returns 409
- Expected fix: Resolve contradictory idempotency contract: either allow exact same-actor retry before expectedStatus rejection or intentionally return 409; cover deadline crossover

## G2-18-019-007 [P1] GAP facet F04 Phone
- Files: (none, new feature)
- Legacy: LV:17-18 stores plaintext `phone_number`, LR:12-14 looks up by plaintext number
- Expected fix: Preserve phone normalization and account resolution; do not duplicate raw phone in auth-attempt rows

## G2-18-026-027 [P1] GAP facet F11 Read scoping
- Files: (none, new feature)
- Legacy: NPC:89-115 fetchAll superadmin scoped by college/org; ordinary roles restricted to college, learner fallback to full scope
- Expected fix: Audit every role caller; provide tenant-safe scoped list for learner and unscoped Super Admin without opening cross-tenant read

## G2-19-029-024 [P1] GAP facet F04 Verified domain policy
- Files: (none, new feature)
- Legacy: LB:198-212 requires verified primary only when `tenantResolutionService.isVerifiedDomainRequired()`; may warn otherwise
- Expected fix: Respect deployed domain-verification policy and own-subdomain trust; clarify when a verified primary is required vs advisory

## G2-13-018-001 [P1] GAP facet F01
- Files: src/db/schema/academics.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:10-22` JPA new_program with name/dept_id/duration_years
- Expected fix: Map legacy new_program IDs and fields into normalized program UUIDs, including duration and generated code

## G2-13-018-007 [P1] GAP facet F04
- Files: src/db/schema/academics.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:15-22` name/deptId/durationYears only, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37` audit fields
- Expected fix: Map orphan departments, names, years and status; derive deterministic code with conflict-safe resolution

## G2-13-018-011 [P1] GAP facet F04
- Files: src/db/schema/academics.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37` int id, createdAt/updatedAt, isDeleted
- Expected fix: Map legacy soft-delete to archived status and preserve timestamps when migration is necessary

## G2-13-018-054 [P1] GAP facet F22
- Files: src/db/schema/academics.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:15-22` name/dept/durationYears + `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37` integer ID/audit/delete
- Expected fix: Provide full column mapping including code generation, years→terms, soft delete→ARCHIVED, timestamps

## G2-13-002-012 [P1] GAP facet F03
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Live card displays name, applied, closes/no deadline, list not shared notice (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:195-220`)
- Expected fix: Explicitly reconcile totals vs shared-only counts, including no-shared state.

## G2-13-002-022 [P1] GAP facet F05
- Files: src/modules/placements/hr-today-action-queue-model.ts
- Legacy: Old lists every task sent from Today API (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:105-107`)
- Expected fix: Show suppressed task count and See all link; no silent task omission.

## G2-13-002-036 [P1] GAP facet F09
- Files: src/modules/placements/hr-today-action-queue-model.ts
- Legacy: Waiting tasks with null action deliberately have no button (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:56-74`)
- Expected fix: Remove non-actionable generic task links unless persisted work is due.

## G2-13-002-046 [P1] MISSING facet F12
- Files: src/modules/placements/hr-today-action-queue-model.ts
- Legacy: Old drive review invited via tpo_audit_log adds `Review it` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:100-107`)
- Expected fix: Restore prelive review alert and correct route.

## G2-13-002-047 [P1] GAP facet F12
- Files: src/modules/placements/hr-today-action-queue-model.ts
- Legacy: Old unreviewed applicants need APPLIED, absent recruiter result, published and visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:109-122`)
- Expected fix: Enforce persistent reviewable applicant predicate and exact count.

## G2-13-002-048 [P1] GAP facet F12
- Files: src/modules/placements/hr-today-action-queue-model.ts
- Legacy: Old result due task excludes completed/TALK/submitted results, time window -14/+2 days (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:135-145`)
- Expected fix: Either restore query predicates or label as information, not needs-action.

## G2-13-002-078 [P1] GAP facet F22
- Files: src/modules/placements/hr-today-action-queue-model.ts
- Legacy: Old offer statuses RELEASED / SELECTED / PENDING_VERIFICATION drive distinct tasks (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:148-170`)
- Expected fix: Map statuses and maintain waiting-selection semantics.

## G2-13-016-044 [P1] GAP facet F22
- Files: src/db/schema/memberships.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:41-48` USER_ROLES globally keyed to User.id; no college field
- Expected fix: Assign roles in each correct college based on trusted legacy tenant memberships, never duplicate across all colleges

## G2-13-011-010 [P1] GAP facet F06
- Files: src/modules/messaging/providers.ts, src/modules/placements/recruiter-message-email-provider.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:124-131` senderName blank→default, replyTo blank→omitted, fromAddressOverride blank→default
- Expected fix: Add sanitized optional sender-name, Reply-To and authorized From choices for TPO college-branded senders

## G2-13-011-014 [P1] GAP facet F07
- Files: src/modules/messaging/providers.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:28-66` event-dependent required merge keys must be nonblank; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:119-125` skips missing key/template
- Expected fix: Add template/event-specific required-variable validators for job, interview and system emails

## G2-13-011-021 [P1] GAP facet F10
- Files: src/modules/messaging/providers.ts, src/lib/outbound.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149` retries failed event mails up to 3 times with 500ms × attempt delay
- Expected fix: Document intentional at-most-once semantics; implement provider idempotency/reconciliation before promising legacy retry guarantees

## G2-13-011-022 [P1] GAP facet F10
- Files: src/modules/messaging/providers.ts, src/modules/messaging/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:172-189` maps SENT / NOT_CONFIGURED / FAILED separately
- Expected fix: Expose typed NOT_CONFIGURED, SUPPRESSED, FAILED and provider ACCEPTED outcomes to TPO callers
