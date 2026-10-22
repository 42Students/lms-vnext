# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-004-045 [P1] GAP facet F06
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: Fixed+variable may be less than CTC; only >CTC is rejected `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:379`
- Expected fix: Remove unexpected equality requirement

## G2-11-004-074 [P1] GAP facet F12
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: Round row with empty name discarded before POST `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:43`
- Expected fix: Remove empty rows before validate; preserve optional rounds

## G2-11-004-117 [P1] GAP facet F22
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: Legacy fields jobTitle/jobDescription/jdUrl/location/jobType/roleOptions/eligibility `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:49`
- Expected fix: Define lossless migration including JD and passingYears

## G2-11-004-118 [P1] GAP facet F22
- Files: src/modules/placements/hr-drive-draft-model.ts
- Legacy: Legacy eligibility `passingYears[]` and branch tags `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:75`
- Expected fix: Make array across Drizzle/API/read models

## G2-11-007-066 [P1] GAP facet F12
- Files: src/modules/placements/tpo-company-detail-read-service.ts
- Legacy: Legacy no company detail if neither recruiter lead nor job; job-only details accepted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:392`
- Expected fix: Keep job-only legacy memory route available, never force canonical-company association.

## G2-11-009-055 [P1] GAP facet F13
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Initial error has PanelError and Retry. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:47`
- Expected fix: Expose recoverable inline error path.

## G2-11-008-005 [P1] GAP facet F02
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Head → gate → six-count strip → sticky controls → student cards → paste dialog. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:234`
- Expected fix: Recreate phone-first screen structure for TPO operator; keep new insights below.

## G2-11-008-006 [P1] MISSING facet F02
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Focused gate Search card precedes status strip. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:260`
- Expected fix: Add high-visibility quick-check-in before summary.

## G2-11-008-010 [P1] MISSING facet F03
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Input.Search enter button labelled `Mark present`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:263`
- Expected fix: Implement Enter-to-check-in with explicit action button.

## G2-11-008-011 [P1] MISSING facet F03
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Room chips offer `Call next · {room}`, `{waiting} waiting`, `{inside} in`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:271`
- Expected fix: Add per-panel call-next controls.

## G2-11-008-025 [P1] MISSING facet F05
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Search filters name and roll (trim/lowercase). `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:81`
- Expected fix: Add client text search, no dropping matched candidate rows.

## G2-11-008-030 [P1] MISSING facet F06
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Gate autoFocus, allowClear, Enter, placeholder `Roll number, then Enter`, disabled if round locked. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:263`
- Expected fix: Restore all gate input properties and disabled rule.

## G2-11-008-045 [P1] MISSING facet F09
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Partial failure warning modal lists failed/unmatched and retains unresolved roll tokens. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:181`
- Expected fix: Retain only unresolved values and display reason buckets.

## G2-11-008-046 [P1] MISSING facet F09
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: OK disabled if zero matched, closed, or busy; modal can't cancel while busy. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:366`
- Expected fix: Enforce pending/locked/matched conditions.

## G2-11-008-058 [P1] MISSING facet F12
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Exact roll wins; unique suffix/prefix >=3 chars permitted; ambiguous max five. `docs/legacy-source/frontend/src/components/tpo/ui/driveDayRules.js:13`
- Expected fix: Port uniqueness and minimum-length rules.

## G2-11-008-059 [P1] MISSING facet F12
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Call-next uses PRESENT candidates, assigned-room precedence, earliest slot then roll. `docs/legacy-source/frontend/src/components/tpo/ui/driveDayRules.js:27`
- Expected fix: Port deterministic room queue.

## G2-11-008-078 [P1] GAP facet F19
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: 20s polling uses monotonic loadSeqRef and unmount cleanup. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:50`
- Expected fix: Implement stale-safe refresh and timer cleanup on operator page.

## G2-11-010-006 [P1] GAP facet F02
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Legacy PageShell with ListingPageHeader then single Next step card then tab strip. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:366`
- Expected fix: Restore single next-step card directly below header and tabs below.

## G2-11-010-010 [P1] GAP facet F02
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Header actions are inline mainButton, Discussion, Extend deadline, More. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:380`
- Expected fix: Keep one context-sensitive primary visible in header, Discussion and More visible.

## G2-11-010-028 [P1] GAP facet F05
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx
- Legacy: Draft/request/sent-back/rejected default tab About, published/closed Applicants. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:266`
- Expected fix: Implement lifecycle-aware default tab redirect.

## G2-11-010-040 [P1] GAP facet F07
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Close prohibited when Applicants/Rounds/Offers partial loads fail. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:291`
- Expected fix: Fail close safely on missing data while preserving page with error per section.

## G2-11-010-042 [P1] GAP facet F07
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Partial section errors list exact failed names, warns zero counts unreliable. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:452`
- Expected fix: Aggregate section failures with nonzero-claim guard and Retry.

## G2-11-010-045 [P1] MISSING facet F08
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Stale old data warning Couldn't refresh this drive, Showing the last drive data we loaded, Retry. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:445`
- Expected fix: Add retained snapshot/error banner and Retry without blanking loaded page.

## G2-11-010-072 [P1] GAP facet F13
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Independent service failures surface names, preserve other tab content. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:452`
- Expected fix: Preserve partial content and section error diagnostics.

## G2-11-010-106 [P1] GAP facet F23
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Legacy 6-tab layout with one Next step and focus-scoped pane. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:267`
- Expected fix: Group new functionality behind old-look tabs and restore first-screen density.
