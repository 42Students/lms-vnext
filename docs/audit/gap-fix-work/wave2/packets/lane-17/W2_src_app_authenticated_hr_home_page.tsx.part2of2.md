# Work packet (wave 2): edit src/app/(authenticated)/hr/home/page.tsx (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/recruiter-colleges-index.md, docs/audit/gap2/lane-10/recruiter-self-controller.md, docs/audit/gap2/lane-13/recruiter-home.md

## G2-9-021-003  [P2] GAP  facet F01  effort S
- Legacy: Docstring says old links/bookmarks land on Home; college-less case shown there `docs/legacy-source/frontend/src/pages/recruiter/colleges/index.js:4-7`
- vNext now: HR home may open college chooser for multi-grant recruiter `src/app/(authenticated)/hr/home/page.tsx:44-76`
- Fix: Confirm migrated recruiter URL destination still reads Today and recovery path for unscoped users.

## G2-9-021-005  [P2] GAP  facet F02  effort M
- Legacy: Home ultimately renders Today, loading/error/no-college branches `docs/legacy-source/frontend/src/pages/recruiter/home.js:44-93`
- vNext now: HR destination shows Today or chooser depending grants `src/app/(authenticated)/hr/home/page.tsx:48-76`
- Fix: Compare final destination states to legacy Home rather than interpreting redirect alone as full parity.

## G2-9-021-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy Home error has Retry + Reload icon `docs/legacy-source/frontend/src/pages/recruiter/home.js:56-69`
- vNext now: HR destination uses link Choose again only for invalid collegeId `src/app/(authenticated)/hr/home/page.tsx:44-49`
- Fix: Restore equivalent account-load Retry state on final Today route when data unavailable.

## G2-9-021-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy final home uses getRecruiterMe scope, firstName, companyName and collegeId `docs/legacy-source/frontend/src/pages/recruiter/home.js:21-40,73-80`
- vNext now: HR final home uses context recruiter/grants and self profile to choose college + greeting `src/app/(authenticated)/hr/home/page.tsx:39-76,103-110`
- Fix: Validate displayed name/college branding and fallback when legacy recruiter scope was missing.

## G2-9-021-024  [P2] GAP  facet F13  effort M
- Legacy: Legacy Home shows 3-metric DashboardSkeleton and Retry on account failure `docs/legacy-source/frontend/src/pages/recruiter/home.js:44-69`
- vNext now: HR final home handles invalid query and missing grants with ErrorState/EmptyState `src/app/(authenticated)/hr/home/page.tsx:44-76`
- Fix: Add equivalent unavailable-account retry when HR data fetch errors, rather than conflating with missing grant.

## G2-10-025-066  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:193-220 — Empty branches/TPO list returns empty/omits contact fields.
- vNext now: src/modules/placements/recruiter-college-branch-service.ts:15-18; src/app/(authenticated)/hr/home/page.tsx:60-72 — Branch suggestions empty when none, chooser lacks missing-contact placeholder.
- Fix: Show 'No TPO contact available' and 'No branches recorded'

## G2-10-025-073  [P3] MISSING  facet F15  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:207-220 — TPO contact email displayed as contact, not sent outbound.
- vNext now: src/app/(authenticated)/hr/home/page.tsx:60-72 — Contact omitted.
- Fix: Restore display only, no auto-email

## G2-13-002-008  [P3] GAP  facet F03  effort S
- Legacy: Urgency indicated by colored dot with aria-label (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:143-150`)
- vNext now: Text Badge shows Urgent/Soon/When you can (`src/app/(authenticated)/hr/home/page.tsx:159-164`)
- Fix: Match dot visual, retain readable urgency name.
