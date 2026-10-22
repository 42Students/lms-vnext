# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-004-042 [P1] GAP facet F23
- Files: src/modules/projects/learner-project-tab-href-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 explicit no-remount-on-tab feature, reset on project/account change.
- Expected fix: Recover exact legacy cross-tab unsaved state guarantees.

## G2-17-012-001 [P1] GAP facet F01
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:12-23 — Organization-level job management service for admin UI.
- Expected fix: Expose organization-scoped admin job aggregate where authorized.

## G2-17-012-006 [P1] GAP facet F03
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:60-68 — Soft-delete org job even when collegeId is NULL.
- Expected fix: Support org-wide null-college legacy job archive with explicit authorization.

## G2-17-012-007 [P1] GAP facet F03
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:106-117 — Pipeline statuses SHORTLISTED/INTERVIEW/OFFERED/REJECTED/HIRED.
- Expected fix: Translate legacy statuses or preserve extended org-admin pipeline.

## G2-17-012-018 [P1] GAP facet F06
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:34-58 — Create/update Job object, Boolean isActive status toggle.
- Expected fix: Expose mappings open→PUBLISHED and close→CLOSED safely.

## G2-17-012-034 [P1] GAP facet F11
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:169-183 — Organization scope derived from authenticated context, not client.
- Expected fix: Implement requirePermission for selected org+colleges, never trust path org ID.

## G2-17-012-035 [P1] GAP facet F11
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:113-136 — Company must be linked to job college or org college before creation.
- Expected fix: Map org-wide relationship rule where collegeId is null.

## G2-17-012-036 [P1] GAP facet F12
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:52-58 — Legacy Boolean active means open/closed.
- Expected fix: Record explicit legacy active→state mapping, validate no illegal reopen.

## G2-17-012-050 [P1] GAP facet F19
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:126-130 — Org-wide applications paged to avoid unbounded listings.
- Expected fix: Offer bounded org-wide applications view and cursor/page.

## G2-17-012-056 [P1] GAP facet F22
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:3-5 — Relies Job, JobApplication, JobApplicationStatusHistory JPA entities.
- Expected fix: Map all status columns, history, scoring, NULL-org shared jobs.

## G2-17-012-057 [P1] GAP facet F22
- Files: src/modules/placements/job-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:191-199 — Organization direct FK scope permits org-wide jobs.
- Expected fix: Schema review for nullable college scope and migration decision.

## G2-17-022-020 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: src/app/(authenticated)/tpo/settings/public-page/page.tsx:50-55 — New minimum five cohort warning blocks enable.
- Expected fix: Document intentional stronger privacy gating and make reason clear.

## G2-18-011-002 [P1] GAP facet F01
- Files: src/modules/placements/learner-job-service.ts, src/modules/placements/application-service.ts
- Legacy: Legacy calendar includes visible + already-applied jobs even after deadline (`JobServiceImpl.java:1505-1539`).
- Expected fix: Union authorized own-application dates into learner career calendar independently of live job listing.

## G2-18-011-012 [P1] GAP facet F04
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy external-only job returns `This job only accepts applications through the external application process` (`JobServiceImpl.java:296-300,468-474`).
- Expected fix: Ensure external-only never creates internal application, but authorized external application route works.

## G2-18-011-018 [P1] MISSING facet F05
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy learner calendar GET important date events constrained start/end inclusive (`JobServiceImpl.java:1472-1495,1545-1572`).
- Expected fix: Expose bounded learner important-date query, include own submitted/archived jobs.

## G2-18-011-020 [P1] GAP facet F06
- Files: src/modules/placements/application-service.ts, src/db/schema/placements.ts
- Legacy: Legacy apply has optional resumeUrl field, profile resume fallback (`JobServiceImpl.java:389-422,651-660`).
- Expected fix: Restore optional owned resume reference and profile fallback, with secure signed access.

## G2-18-011-026 [P1] GAP facet F07
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy resume must HTTPS, allowed content URL/storage key and own org/college/resumes/user path (`JobServiceImpl.java:406-421`).
- Expected fix: Use owned upload receipt not arbitrary URL; preserve HTTPS and tenant/learner isolation.

## G2-18-011-027 [P1] GAP facet F07
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy rate limit 5 applies per learner per minute (global setting override), 429 text (`JobServiceImpl.java:137-167,424-438`).
- Expected fix: Implement distributed tenant-safe rate limit with exact 429 copy and configurable platform threshold.

## G2-18-011-037 [P1] GAP facet F10
- Files: src/modules/placements/application-service.ts, src/db/schema/placements.ts
- Legacy: Legacy job application create sets status APPLIED, source INTERNAL, screens after save (`JobServiceImpl.java:640-725`).
- Expected fix: Map APPLIED→SUBMITTED and screening transition without losing decisions.

## G2-18-011-044 [P1] GAP facet F12
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy all org-wide untargeted jobs visible when hierarchy complete (`JobServiceImpl.java:340-368`).
- Expected fix: Confirm intended per-college visibility versus legacy org-wide untargeted jobs.

## G2-18-011-052 [P1] GAP facet F13
- Files: src/modules/placements/application-service.ts, src/db/schema/placements.ts
- Legacy: Legacy screening failure after apply logged but application still submitted (`JobServiceImpl.java:726-819`).
- Expected fix: Ensure failed screening preserves submitted application and offers retry/FAILED state.

## G2-18-011-061 [P1] MISSING facet F18
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy apply-too-fast exact `Too many applications in the last minute. Please try again shortly.` (`JobServiceImpl.java:424-436`).
- Expected fix: Add rate limiter and exact 429 message.

## G2-18-010-002 [P1] MISSING facet F01
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy recruiter sendAsCollege automatically supplies workspaceLink to `/recruiter` on selected college domain (`TpoMailService.java:82-97,133-153`).
- Expected fix: Inject verified tenant-aware recruiter workspace deep link for each email, including fallback.

## G2-18-010-005 [P1] GAP facet F02
- Files: src/modules/placements/recruiter-message-email-provider.ts, src/modules/notifications/zeptomail-email.ts
- Legacy: Legacy recruitment emails branded `{college} Campus Recruitment` in inbox From name (`TpoMailService.java:77-81,155-162`).
- Expected fix: Override sender name per verified college and preserve safe header rules.

## G2-18-010-012 [P1] GAP facet F03
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy merge object has `collegeName` and `workspaceLink` variables (`TpoMailService.java:88-96`).
- Expected fix: Publish compatibility merge-field matrix or migrate Zepto template with tests.
