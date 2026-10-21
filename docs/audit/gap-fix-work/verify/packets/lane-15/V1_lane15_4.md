# Verification packet (P1 sample): 17 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-026-063 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-46 and 88-133 status/notes/score/version stored in one JPA entity
- Expected fix: Map each legacy application field/status to normalized tables and audit source of truth

## G2-8-018-023 [P1] GAP facet F06
- Files: src/modules/activity/notification-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:37-41: optional scheduledAt yyyy-MM-dd HH:mm:ss (null immediate)
- Expected fix: Support send-later through due delivery workflow and timezone-aware field.

## G2-8-018-043 [P1] GAP facet F11
- Files: src/modules/activity/notification-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:187-201: on edit verify access to old AND new audience
- Expected fix: Implement pre- and post-target authorization on announcement edits.

## G2-8-024-063 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy Recruiter has tokenVersion, isDeleted and suspension metadata (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-324).
- Expected fix: Preserve deletion and token invalidation semantics and support historical reason.

## G2-9-007-053 [P1] GAP facet F12
- Files: src/components/electives/college-elective-offering-manager.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:305-352` — Offering creation creates group and GROUP_BACKED class
- Expected fix: Restore backed class auto-create or offer equivalent action

## G2-9-012-043 [P1] GAP facet F12
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:226-232` — Double-booking conflicts computed across entire unfiltered list of active interviews
- Expected fix: Detect cross-job interviewer/room/candidate conflicts and show counts on schedule

## G2-9-011-033 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:50-65` — GET job and hiring metrics independently with Promise.allSettled
- Expected fix: Use settled results and retain successful job header if metrics/attention fail

## G2-9-013-063 [P1] GAP facet F12
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:528-543` — Legacy application deadline derived from importantDates entry and blocks after deadline.
- Expected fix: Preserve deadline/milestone synchronization and backfill mapping.

## G2-9-014-093 [P1] GAP facet F22
- Files: src/db/schema/placement-college-application-stages.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:13-35` — MySQL job_application unique learner_id/job_id, status string APPLIED, statusUpdatedAt, appliedAt.
- Expected fix: Reconcile single-status vs dual application/status/stage model.

## G2-13-025-003 [P1] GAP facet F02
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: Legacy pending grant created only for existing recruiter accounts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:219-245`
- Expected fix: Stage existing-account invitation as PENDING_RECRUITER until signed-in yes.

## G2-13-025-023 [P1] MISSING facet F10
- Files: src/db/schema/placements.ts
- Legacy: Decline ->REVOKED, revokedAt, reason 'Declined by the recruiter' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:324-330`
- Expected fix: Write status/revokedAt/revokeReason and actor id.

## G2-13-025-033 [P1] GAP facet F15
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: Accept logs SYSTEM recruiter accepted & bell RECRUITER_JOINED to TPO `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:313-320`
- Expected fix: Move JOINED activity and TPO bell to actual second-step acceptance.

## G2-9-025-063 [P1] GAP facet F19
- Files: src/modules/courses/super-admin-content-authoring-service.ts, src/components/courses/super-admin-content-authoring.tsx
- Legacy: Class options fetched per selected course and reused for class-specific authoring `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:173-177`
- Expected fix: Make section delivery selectable, support >500 lessons via search/pagination.

## G2-9-033-013 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy duplicate company names permitted after domain-global V202 migration `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19`
- Expected fix: Allow distinct real companies with same name but distinct verified domains; move unique identity to domain

## G2-9-033-053 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy V202 allows same company name for distinct global identities by domain `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:30-42`
- Expected fix: Remove name-global uniqueness and enforce canonical identity/domain rules

## G2-9-034-053 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy V202 allows same company name for distinct global identities by domain `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:30-42`
- Expected fix: Remove name-global uniqueness and enforce canonical identity/domain rules

## G2-9-034-093 [P1] GAP facet F10
- Files: src/modules/placements/super-admin-company-verification-service.ts
- Legacy: Legacy POST verification updates global and domain verified flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:67-76`
- Expected fix: Track domain verification consistency after verify/unverify.
