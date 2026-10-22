# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-011-025 [P1] GAP facet F11
- Files: src/modules/messaging/providers.ts, src/modules/placements/recruiter-message-email-provider.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:82-110` college-branded recruiter/student messages with tenant-specific sender name
- Expected fix: Load authorized college display/from/reply context per tenant on branded notifications

## G2-13-011-026 [P1] GAP facet F12
- Files: src/modules/messaging/providers.ts, src/modules/notifications/zeptomail-email.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java:55-60` templates per NotificationEvent via zepto.template.*
- Expected fix: Map every legacy NotificationEvent and TPO template to purpose-scoped vNext template registry

## G2-13-011-032 [P1] GAP facet F15
- Files: src/modules/messaging/providers.ts, src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-22` ZeptoMail interface shared by dispatcher; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155` job/course/pre-login email event sends
- Expected fix: Inventory and wire all legacy non-OTP transactional event sends to vNext adapters

## G2-18-021-012 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: DTO is response-only, no creation form; backing JSON input `{label,date,type/dateType}` (Job.java:92-100, JobServiceImpl:1548-1568)
- Expected fix: Add type input/preservation to authoring + roundtrip; do not invent type from text

## G2-19-026-040 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: Legacy bulk one transaction up to 1000, preflight SQL ancestor locks (service:579-670)
- Expected fix: Reduce per-row round trips via preflight batch resolver and single bounded transaction

## G2-14-010-044 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy defaults malformed source to EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-47`
- Expected fix: Set explicit import fallback and never depend on DB default

## G2-14-011-010 [P1] GAP facet F04
- Files: src/db/schema/placements.ts, src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: Application shows source appliedAt notes rejection resume and score `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-127`
- Expected fix: Build complete legacy-compatible application projection

## G2-14-011-012 [P1] GAP facet F04
- Files: src/db/schema/placements.ts, src/modules/placements/college-application-stage-service.ts
- Legacy: Eight legacy applicant pipeline labels include WAITLISTED and HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:44-46`
- Expected fix: Document exact combined stage crosswalk

## G2-14-011-022 [P1] GAP facet F06
- Files: src/db/schema/placements.ts, src/modules/placements/job-service.ts
- Legacy: EXTERNAL_ONLY clears and rejects targeting fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:340-347` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:532-557`
- Expected fix: Define external targeting semantics and missing target fields

## G2-14-011-044 [P1] GAP facet F10
- Files: src/db/schema/placements.ts
- Legacy: Legacy HIRED withdraws or rejects other active applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1286-1346`
- Expected fix: Ensure cross-drive hiring cascade and lock ordering

## G2-14-011-078 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy Job fields include free CTC location targeting importantDates and flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:31-130` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:269-308`
- Expected fix: Write complete legacy column disposition and migration map

## G2-14-011-079 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy JobApplication unique job and learner with source notes resume reason offer and version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-175`
- Expected fix: Map all legacy columns to new tables and version semantics

## G2-14-011-080 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy 8-stage app statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:44-46`
- Expected fix: Map composite status and all historical transitions

## G2-14-011-081 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy Job and application contain screening/assessment references `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:212-268` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:65-115`
- Expected fix: Reconcile FK/multiplicity and missing record fields

## G2-14-012-015 [P1] GAP facet F06
- Files: src/modules/messaging/providers.ts, src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy replyTo null means omit; nonblank adds array entry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:29-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:127-132`
- Expected fix: Provide vetted optional reply-to for approved domains across templates

## G2-14-012-042 [P1] GAP facet F15
- Files: src/modules/messaging/providers.ts
- Legacy: Legacy dispatcher sends in-app then email then TRAI SMS from registry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:69-106` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-170`
- Expected fix: Map cross-channel notification policy per event and ordering

## G2-14-012-057 [P1] GAP facet F21
- Files: src/modules/messaging/providers.ts, src/modules/messaging/tpo-campaign-dispatch-service.ts
- Legacy: Legacy NotificationDispatcherService event registry triggers Zepto templates `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- Expected fix: Create legacy event-to-template registry parity matrix

## G2-14-015-004 [P1] GAP facet F02
- Files: src/db/schema/placements.ts
- Legacy: Legacy DRAFT_LIKE grouping contains REQUEST SENT_BACK REJECTED DRAFT `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-19`
- Expected fix: Provide state mapping for draft-like visibility in list and API

## G2-14-015-008 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy isDraft and isActive flags coupled to status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:38-55`
- Expected fix: Derive compatibility isDraft/isActive from status, including archived

## G2-14-015-022 [P1] GAP facet F10
- Files: src/db/schema/placements.ts
- Legacy: Legacy SENT_BACK to REQUEST/CANCELLED allowed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:24-26`
- Expected fix: Document resubmit path and state crosswalk

## G2-14-015-028 [P1] GAP facet F12
- Files: src/db/schema/placements.ts
- Legacy: Legacy DRAFT_LIKE REQUEST SENT_BACK REJECTED DRAFT `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-19`
- Expected fix: Represent non-live request workflow without leaking learner visibility

## G2-14-015-029 [P1] GAP facet F12
- Files: src/db/schema/placements.ts
- Legacy: Legacy INACTIVE only CLOSED CANCELLED, draft-like remain isActive=true but isDraft=true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-55`
- Expected fix: Compute legacy active flag separately from visible flag

## G2-14-015-046 [P1] GAP facet F20
- Files: src/db/schema/placements.ts
- Legacy: Legacy inactive state flag mapping independent of isDraft `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-55`
- Expected fix: Validate historical isDraft/isActive migration for closed/cancelled jobs

## G2-14-015-048 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy Job.lifecycleStatus varchar string with default PUBLISHED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- Expected fix: Backfill and document mapping of legacy default and missing records

## G2-14-015-050 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy isDraft and isActive legacy compatibility columns `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-125`
- Expected fix: Record explicit generated legacy flags in migration or API adapter
