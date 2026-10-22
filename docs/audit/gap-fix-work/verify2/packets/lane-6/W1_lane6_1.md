# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-002-039 [P1] GAP facet F10
- Files: src/app/api/auth/admin-scope/route.ts
- Legacy: `AuthController.java:623-633` superadmin scope mints new signed JWT token pair with org/college claims.
- Expected fix: Verify request-context persistently validates active superadmin against DB on each scoped request; test stale-tab scope changes and role revocation.

## G2-12-022-017 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:30-39 — StageRequest fields applicationId, outcome, waitlistRank, score Double, reasonCategory, comment, source
- Expected fix: Document DTO mapping, migrate score precision and source semantics

## G2-12-022-037 [P1] GAP facet F11
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx
- Legacy: docs/legacy-source/frontend/src/api/Services/TpoService.js:3-5 — TPO API intentionally works for college ADMIN where no TPO account exists
- Expected fix: Decide admin delegation parity and document permission role exception

## G2-12-022-045 [P1] GAP facet F15
- Files: src/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/apply-all/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:59-66 — apply?notify=true query defaults true; false suppresses student notification
- Expected fix: Decide notification suppression compatibility; ensure explicit user intent for sends

## G2-12-030-016 [P1] GAP facet F06
- Files: src/modules/placements/college-interview-action-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:252-259 — type required, five enum values
- Expected fix: Carry type field with validation and migration or explicitly map old values.

## G2-12-030-017 [P1] GAP facet F06
- Files: src/modules/placements/college-interview-action-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:266-275 — round description required whitespace, >=10, max 500 and count
- Expected fix: Restore description validators server-side, ensure reminders consume it.

## G2-19-021-001 [P1] GAP facet F01
- Files: src/modules/placements/validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:7-16 — ApplyToJobRequest body has only optional resumeUrl
- Expected fix: Resolve resume selection/snapshot requirement and no silent loss

## G2-19-021-007 [P1] GAP facet F04
- Files: src/modules/placements/validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:14-16 — null resume uses profile resume
- Expected fix: Explicitly resolve verified profile resume and persist snapshot for application

## G2-19-021-012 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:401-420 — additional HTTPS, max2048, allowed storage root, user-ownership check
- Expected fix: Retain secure resume verification on any future resume attachment path

## G2-19-021-020 [P1] GAP facet F10
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-659 — resume URL saved from request or profile
- Expected fix: Add per-application resume reference/snapshot with privacy checks

## G2-19-021-027 [P1] GAP facet F14
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-659 — resume persisted as URL on job_application
- Expected fix: Support private signed resume snapshot or explicit design exception

## G2-19-021-039 [P1] GAP facet F21
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:401-420 — allowlist own HTTPS storage segments
- Expected fix: Preserve ownership verification if receipt flow added

## G2-19-021-041 [P1] GAP facet F22
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-659 — application.resumeUrl and profile fallback
- Expected fix: Resolve application resume data retention policy

## G2-19-031-039 [P1] GAP facet F06
- Files: src/components/tpo/tpo-team-ask-panel.tsx
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamComposer.jsx:159-177` — Ask can target any team member and optional due, with away warning.
- Expected fix: Allow eligible assignee selection beyond one private participant.

## G2-1-035-055 [P1] GAP facet F13
- Files: src/app/(authenticated)/hr/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:126-141: 'We couldn't load your profile' Result warning and Retry.
- Expected fix: Return recoverable error UI with same Retry.

## G2-10-004-016 [P1] GAP facet F04
- Files: src/modules/placements/admin-company-directory-service.ts, src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old global item summarizes number of colleges and drives across platform `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- Expected fix: Build distinct global company view with global counts for unscoped admin and scoped counts when restricted

## G2-10-004-025 [P1] GAP facet F05
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Old global page 50 and fixed no size chooser `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:93-95`
- Expected fix: Page distinct global companies before joining college relationships to match 50 unique employers

## G2-10-004-047 [P1] GAP facet F10
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy global GET returns distinct companies with domains aliases colleges drives `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:45-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- Expected fix: Add distinct global-company list endpoint/service projection before relationship joins

## G2-10-004-080 [P1] GAP facet F19
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy global query page 50 distinct companies and college query page 10 from full client list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`
- Expected fix: Decouple pagination units by tab: company vs relationship; restore 10 college page size

## G2-10-004-081 [P1] GAP facet F19
- Files: src/modules/placements/admin-company-directory-service.ts, src/db/schema/placements.ts
- Legacy: Old global companies with same name but different domain both listed distinct IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-15`
- Expected fix: Redesign distinct identity listing independent of relationship rows

## G2-10-007-014 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/features/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-276` switch for each college-module with aria-label
- Expected fix: Restore direct switch affordance or approve advanced workflow

## G2-10-009-067 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:28-33` inbound public webhook requires X-Inbound-Secret constant-time verified in `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:64-67`
- Expected fix: Document secure worker/provider migration and uphold sender verification

## G2-10-009-074 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:101-122` only verified authorized recruiter thread reply becomes POSTED
- Expected fix: Persist reasons for rejected replies in inbox without exposing internal identifiers

## G2-10-009-085 [P1] GAP facet F15
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32` worker posts verified replies to recruiter conversations, logging routing outcome
- Expected fix: Connect delivery outcome to Inbox while preserving TPO notification semantics

## G2-10-009-108 [P1] GAP facet F20
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts, src/db/schema/inbound-mail.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:189-206` strips quoted text; stores whole failed reply and processed body separately
- Expected fix: Persist original body separately from stripped text and routing outcome
