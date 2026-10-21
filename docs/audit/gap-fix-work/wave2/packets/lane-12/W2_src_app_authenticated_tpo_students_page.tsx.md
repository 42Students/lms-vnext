# Work packet (wave 2): edit src/app/(authenticated)/tpo/students/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md, docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-14-001-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy header/banner/top selectors/journey/grid in one workspace; vNext analytics sections intervene before roster — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:245-273`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:643-850,852-970`
- Fix: Place shared selectors, journey and table in single legacy-shaped canvas; relocate analytics

## G2-14-001-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy group action bar above grid; vNext bulk actions below grid in Disclosure — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:219-240,267-273`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:962-1021`
- Fix: Restore persistent Act bar adjacent to grid

## G2-14-001-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy four multiselects Batch/Program/Department/Class with counts; vNext Batch one-value in advanced and Program/Class inside grid — `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:93-109`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:587-593`; `src/components/tpo/tpo-students-spreadsheet.tsx:151-154`
- Fix: Recreate grouped multi selectors with dependent counts and finished labels

## G2-14-001-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy 4 clickable journey steps with pressed state and gap arrows; vNext static metric cards plus 5 different cards — `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:111-152`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:659-712`
- Fix: Render four-step interactive strip with arrows, gap toggles and percentages

## G2-14-001-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy extras unverified profile/no resume/offer waiting/debarred; vNext only debarred and journey gaps as chips — `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:143-151`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:667-675`
- Fix: Add three missing extras, show counts and active toggle

## G2-14-001-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy context Suggested: ... Do it action on a picked journey gap; vNext no corresponding near-grid CTA — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:219-237`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:667-675,970-979`
- Fix: Show contextual suggested action on gap selection and open focused action modal

## G2-14-001-018  [P2] GAP  facet F05  effort L
- Legacy: Legacy whole filtered selection and 44px AG Grid rows; vNext 25/50/100 server page plus selection across up to 5000 — `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:353-358`; `docs/legacy-source/frontend/src/pages/tpo/students/index.js:267-273`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:913-924,957-965,1022-1055`
- Fix: Preserve whole-view select/act semantics and virtualize rows without page-limited action

## G2-14-001-021  [P2] GAP  facet F05  effort L
- Legacy: Legacy one Filter students drawer with live option counts and chips; vNext advanced form plus grid filters plus main GET form — `docs/legacy-source/frontend/src/components/tpo/students/studentGridRules.js:92-133`; `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:384-438`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:443-607,870-934`; `src/components/tpo/tpo-students-spreadsheet.tsx:151-173`
- Fix: Unify filters in six ordered drawers/categories, live counts, Reset and Show N, chips

## G2-14-001-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy ?q= quick search across all fields including hidden values; vNext search param and server max150 — `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:94-101`
- vNext now: `src/modules/placements/tpo-students-service.ts:142-145`; `src/app/(authenticated)/tpo/students/page.tsx:908-911`
- Fix: Retain q deep-link alias and all searchable fields within authorized scope

## G2-14-001-046  [P2] GAP  facet F12  effort M
- Legacy: Legacy four journey stages and gaps; vNext additionally uses 5 readiness states — `docs/legacy-source/frontend/src/components/tpo/students/studentGridRules.js:71-90`; `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:116-141`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:659-712`
- Fix: Implement exact legacy strip and use vNext taxonomy only as secondary info

## G2-14-001-047  [P2] GAP  facet F12  effort M
- Legacy: Legacy finished batches hidden default but selectable with From badge; vNext supports batch selection with different label — `docs/legacy-source/frontend/src/components/tpo/students/studentGridRules.js:22-30`; `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:93-99`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:587-610`; `src/components/tpo/tpo-students-spreadsheet.tsx:36-40`
- Fix: Use All active batches and marked finished batch options in grouped selector

## G2-14-001-049  [P2] GAP  facet F13  effort M
- Legacy: Legacy 8-row skeleton and stale refresh preserved with Retry; vNext Suspense grid and error boundary without stale snapshot — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:254-261`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:962-965`
- Fix: Restore 8-row load, nonblocking stale-refresh Retry banner

## G2-14-001-051  [P2] GAP  facet F13  effort S
- Legacy: Legacy failed data fetch Could not load students + retry; vNext differentiates invalid filter alert but data errors use boundary — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:111-116,254-261`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:260-282`
- Fix: Use retryable same-title error for server data failure

## G2-14-001-058  [P2] GAP  facet F16  effort M
- Legacy: Legacy actions dropdown on mobile and filter sheet; vNext long stacked below-grid bulk area and card grid — `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:33-44`; `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:111-152`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:971-1021`; `src/components/tpo/tpo-students-spreadsheet.tsx:223-245`
- Fix: Use mobile action-category select and bottom-sheet filters

## G2-14-001-059  [P2] GAP  facet F16  effort S
- Legacy: Legacy responsive Batch 360/Program220/Department240/Class220 with max-width100%; vNext split controls — `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:93-109`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:587-593,870-934`; `src/components/tpo/tpo-students-spreadsheet.tsx:151-154`
- Fix: Restore width/wrap token sizing at mobile/tablet/desktop

## G2-14-001-062  [P2] GAP  facet F18  effort S
- Legacy: Legacy All active batches; vNext Current students — `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:94-99`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:587-592`
- Fix: Change placeholder verbatim

## G2-14-001-064  [P2] GAP  facet F18  effort S
- Legacy: Legacy Filter students modal; vNext Advanced student filters / Apply filters — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:267-270`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:443-445,926-933`
- Fix: Use Filters + Filter students + Reset / Show N

## G2-4-022-004  [P2] GAP  facet F02  effort L
- Legacy: Legacy students table with views, per-student panel, notes, registration, bulk actions and import. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:14-18`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- vNext now: New spreadsheet with extensive custom columns, filters, selection and quick panel. (`src/app/(authenticated)/tpo/students/page.tsx:957-1021`; `src/components/tpo/tpo-students-spreadsheet.tsx:30-98`)
- Fix: Match original column order, saved-view labels, toolbar and right-panel geometry.
