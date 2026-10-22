# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-016-026 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:253-254` — Needs attention count sums category candidate item counts.
- Expected fix: Use sum of affected applicants and show category row count separately.

## G2-9-016-057 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:765-783` — searchAdminJobs GET /api/v1/admin/jobs/search, active page60 + all size1.
- Expected fix: Fetch all job count and sorted published page separately.

## G2-9-016-058 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:920-955` — getAdminNeedsAttentionSummary college-scoped GET, categories from backend.
- Expected fix: Implement missing category through approved evidence source.

## G2-9-016-065 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-26` — Attention has four categories: stale, unscheduled, missing letters, low conversion.
- Expected fix: Mark offer missing count unavailable, connect secure evidence when possible.

## G2-9-016-066 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:211-214` — Needs attention total sums counts per category, including sample-truncated rows.
- Expected fix: Sum candidate/event counts, not drive-category rows.

## G2-9-016-067 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:345-383` — Alert rules configurable in Super Admin: stale days 1-90, close soon 1-60, sample cap1-50, conversion threshold0-1.
- Expected fix: Read tenant/platform effective settings instead of hardcoding thresholds.

## G2-9-016-068 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:355-377` — Default conversion threshold 0.15 from Settings.
- Expected fix: Use 0.15 default or effective policy override.

## G2-9-016-069 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:109-120` — Active count from search active total and inactive all-active.
- Expected fix: Add independent count queries by status.

## G2-9-016-099 [P1] GAP facet F22
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:765-783` — Legacy two search queries active/size60 and all/size1 with totalElements.
- Expected fix: Add separate countAll/countActive aggregate.

## G2-9-016-100 [P1] GAP facet F22
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:920-955` — Legacy attention backend returns categories with candidate sample, truncation counts.
- Expected fix: Store/send candidate-level rows with countTotal and sample cap.

## G2-9-012-007 [P1] MISSING facet F02
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:824-923` — Toolbar count, Company/Sort, Export, Conflicts and Clear filters
- Expected fix: Restore complete toolbar and controls

## G2-9-011-019 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:83-90` — Attention rows filtered by matching numeric jobId, containing learnerName/detail and category
- Expected fix: Return learner-specific attention items from scoped query or link filtered register with equivalent copy

## G2-9-011-034 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:79-90` — GET /api/v1/admin/jobs/needs-attention college-wide then filter by jobId
- Expected fix: Include arbitrary deep-linked job outside top60 and missing offer-letter category

## G2-9-011-040 [P1] GAP facet F12
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:239-257` — Pipeline current application-status snapshot, six stages
- Expected fix: Use canonical status vs college stage only after explicitly labelling different metric meaning

## G2-9-011-041 [P1] MISSING facet F12
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:17-21` — Attention categories staleApplications, unscheduledInterviews, missingOfferLetters plus closingSoonLowConversion
- Expected fix: Implement missing offer letter category based on authoritative offer records

## G2-9-011-057 [P1] GAP facet F19
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:79-90` — Attention reads college summary then filters named categories by exact job ID
- Expected fix: Allow isolated attention read for deep-linked archived/older job

## G2-9-013-026 [P1] MISSING facet F06
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:634-658` — Company Name required; existing-company autocomplete with clear companyId for free-typing.
- Expected fix: Expose company selector and unlinked free-text state.

## G2-9-013-056 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-archive-preview-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1078` — Legacy soft delete cancels nonterminal interviews, invalidates caches, audits JOB_DELETED and sends learner notifications after commit.
- Expected fix: Decide if archive must cancel outstanding interviews and notify impacted learners; implement correct side effects.

## G2-9-013-077 [P1] GAP facet F15
- Files: src/modules/placements/college-drive-archive-preview-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1048-1078` — Backend queues post-commit in-app notification, not explicit email, per affected application.
- Expected fix: Decide notification parity on archive/cancel/close, audit recipient and event semantics.

## G2-9-013-078 [P1] GAP facet F15
- Files: src/modules/placements/college-drive-archive-preview-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:378-395` — Legacy cascading canceled interviews invokes notifyInterviewCancelledByCascade after commit.
- Expected fix: Handle active scheduled interview notifications or explicitly document intentional change.

## G2-9-014-045 [P1] MISSING facet F09
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1836-1910` — Stage action anchored Popconfirms with Mark Passed, Move and Mark Hired confirmations.
- Expected fix: Restore stage-specific confirmations.

## G2-9-036-014 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/features/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-276` switch for each college-module with aria-label
- Expected fix: Restore direct switch affordance or approve advanced workflow

## G2-13-025-005 [P1] MISSING facet F03
- Files: src/modules/placements/recruiter-self-grants-service.ts
- Legacy: Pending card source returns collegeId/collegeName/company/invitedContact `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:295-300`
- Expected fix: Project exactly four pending invitation identity fields.

## G2-13-025-021 [P1] MISSING facet F10
- Files: src/modules/placements/recruiter-self-grants-service.ts
- Legacy: Pending list own recruiter id from principal `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:19-23`
- Expected fix: Add list query by context.user.id, don't require ACTIVE grant.

## G2-13-025-025 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-self-grants-service.ts
- Legacy: Anyone signed in as recruiter may view own pending grants `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:19-23`
- Expected fix: Allow recruiter with zero ACTIVE grants to view and resolve pending.
