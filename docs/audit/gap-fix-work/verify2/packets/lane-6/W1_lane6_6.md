# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-019-036 [P1] GAP facet F10
- Files: src/modules/placements/application-service.ts
- Legacy: Old reapply after withdrawal overwrites same row and stores resume history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:76-82,98-102`
- Expected fix: Capture first apply and resume revision when restoring.

## G2-16-031-020 [P1] GAP facet F07
- Files: src/app/api/placements/tpo/offers/[offerId]/cascade-undo/route.ts
- Legacy: TpoApplicantController.java:108-114 undo returns 409 'Too late to undo: the students have already been told'
- Expected fix: Maintain distinct applicant undo versus offer cascade undo; surface exact too-late explanation at affected action

## G2-16-031-022 [P1] GAP facet F07
- Files: src/app/api/placements/tpo/placement-rules/route.ts
- Legacy: LearnerEligibilityController.java:59-105 get eligibility/apply checks and visibility guard
- Expected fix: Expose actionable schema-unavailable learner eligibility state and avoid presenting disabled applications as simply ineligible

## G2-16-031-027 [P1] GAP facet F10
- Files: src/app/api/placements/tpo/companies/create/route.ts
- Legacy: TpoCompanyController.java:47-105 searches/resolves company, engagement, join-link, domains and trusted flag
- Expected fix: Map resolver, trusted-domain creation and join-link actions through explicit API endpoints; audit trust mutation separately

## G2-16-031-030 [P1] GAP facet F10
- Files: src/app/api/placements/tpo/rounds/[roundId]/bulk-confirmed-results/route.ts
- Legacy: TpoResultsController.java:46-71 POST stage, GET pending, POST apply with notify flag
- Expected fix: Distinguish staged/pending/applied state; confirm notifications flag and per-row skipped persistence

## G2-16-031-054 [P1] GAP facet F20
- Files: src/app/api/placements/tpo/offers/[offerId]/cascade-undo/route.ts
- Legacy: TpoApplicantController.java:108-114 undo fails 409 once students were notified
- Expected fix: Model applicant move undo separately from offer cascade undo; prevent stale or double undo and show remaining window

## G2-12-006-068 [P1] GAP facet F22
- Files: src/app/(authenticated)/learn/my-placements/applications/page.tsx
- Legacy: Legacy application data with withdraw enum SELF/REQUEST `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:48-49,82-86`
- Expected fix: Expose effective permission mode

## G2-13-010-001 [P1] GAP facet F01
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Utility is called by ApplicationTransitionService transitioning JobApplication (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:54-68`)
- Expected fix: Consolidate one vetted transition policy or document intentionally distinct coarse-status and stage model.

## G2-13-010-005 [P1] GAP facet F02
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy group has two layers: application status and round result (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:54-78`)
- Expected fix: Document which pipeline label/status is authoritative in each screen.

## G2-13-010-030 [P1] GAP facet F09
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Old bulk can hold notices and undo within outbox window (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:115-160`)
- Expected fix: Restore general undo group for open-stage bulk moves or document limited-only behavior.

## G2-13-010-036 [P1] GAP facet F12
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Old HIRED→OFFERED allowed for mistaken hire correction (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:52-57`)
- Expected fix: Reconcile reversal policy with joined outcome and audit trail.

## G2-13-015-024 [P1] GAP facet F08
- Files: src/modules/placements/offer-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:98-167` verifyAndRelease sets RELEASED and OFFERED and queues learner notification
- Expected fix: Separate selection record success from release success; ensure only release notifies learner

## G2-13-015-027 [P1] GAP facet F10
- Files: src/modules/placements/offer-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-76` record selection writes SELECTED with row lock, may omit letter
- Expected fix: Provide selection-first workflow and separate release transaction guarded by TPO verification

## G2-13-015-034 [P1] GAP facet F12
- Files: src/modules/placements/offer-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-75` selects after open application stages, no active SELECTED/PENDING/RELEASED/ACCEPTED offer
- Expected fix: Map open stages and initial selection eligibility separately from offer issuance screening rules

## G2-13-015-062 [P1] GAP facet F23
- Files: src/modules/placements/offer-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` RELEASED vs SELECTED distinct; vNext ISSUED only active pre-response
- Expected fix: Do not treat vNext ISSUED as direct equivalent to legacy pre-release SELECTED; add verification workflow

## G2-17-23-049 [P1] GAP facet F10 Cascade other offers
- Files: (none, new feature)
- Legacy: JS:1259–1268 closes all RELEASED offers on answered app; JS:1414 closes pending sibling offers DECLINED
- Expected fix: Verify one-offer-per-application and LOI behavior, ensure accepted offer and sibling offer histories converge without stale open offer

## G2-17-028-026 [P1] GAP facet F10 Audit side effect
- Files: (none, new feature)
- Legacy: LM:1-42 stores override/noteby/at columns on project_workspace
- Expected fix: Ensure latest state and author/time still visible after migration, including cleared override and old records

## G2-18-019-044 [P1] GAP facet F21 SMS dependency
- Files: (none, new feature)
- Legacy: LC:443 sends through SmsService, LS:31-32 optional TestOtpService
- Expected fix: Verify Exotel/actual provider credentials/templates and observed failure paths without leaking OTPs; audit provider integration separately

## G2-18-030-046 [P1] GAP facet F13 Initial failure
- Files: (none, new feature)
- Legacy: L:399-415 `Could not load departments` error + Retry, table hidden on failure
- Expected fix: Catch list failure at page boundary, render error and retry rather than server exception or bogus no-results

## G2-13-006-010 [P1] GAP facet F03
- Files: src/app/(authenticated)/learn/my-placements/announcements/page.tsx
- Legacy: Announcement New tag only when API unread true (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-70`)
- Expected fix: Determine unread from real read receipt; avoid false New status.

## G2-13-011-034 [P1] GAP facet F15
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:88-109` college name and workspace link
- Expected fix: Preserve legacy recruiter and student TPO template variables separately from digest-only mail

## G2-14-007-027 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/groups/[groupId]/page.tsx
- Legacy: Legacy repeated redirect on browser back prevented by replace(); vNext canonical detail has notFound on invalid ID — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:9-12`
- Expected fix: Preserve no-history stale route behavior and generic ID matching

## G2-18-029-006 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Always-visible Create New Semester card, form Program/Number/Name, plus Create button (legacy:410-458)
- Expected fix: Open by default in bordered card, vertical fields and plus icon

## G2-14-005-050 [P1] GAP facet F10
- Files: src/app/(authenticated)/learn/my-placements/jobs/page.tsx, src/modules/placements/learner-job-service.ts, src/modules/placements/saved-job-service.ts
- Legacy: Legacy parallel getAllJobsWithEligibility, saved ids, saved jobs, learner applications and follow-up getApplyChecks (100); vNext direct authorized DB joins one server fetch+saved jobs — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:385-449`
- Expected fix: Ensure equivalence of active visibility, applications stage and held offers in one service

## G2-14-005-056 [P1] GAP facet F12
- Files: src/modules/placements/learner-job-service.ts, src/modules/placements/learner-jobs-browse-model.ts
- Legacy: Legacy status closed includes job.isActive false OR expired deadline; vNext source only PUBLISHED and deadlinePassed with status at job level — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:144-151,658-662`
- Expected fix: Show past closed saves and approved nonactive historical jobs where access permitted

## Lane-3 verification triage

Fast triage (2026-10-22): DEFERRED: all 25 rows need application/offer persistence, migration, provider, or eligibility review. No status marked OK without code-level evidence.
