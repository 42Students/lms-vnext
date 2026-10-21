# Work packet (wave 2): edit src/modules/placements/tpo-configuration-read-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md, docs/audit/gap2/lane-3/job-types.md

## G2-2-030-002  [P2] GAP  facet F01  effort M
- Legacy: ChoicesService.js:1-4 and useChoices.js:17-40 request once and share across pages.
- vNext now: src/modules/placements/tpo-after-college-model.ts:21-30 serves synchronous local options; tpo-configuration-read-service.ts:12-28 separately queries DB.
- Fix: Provide shared options acquisition/cache and unified loading state without stale tenant leakage.

## G2-2-030-008  [P2] GAP  facet F03  effort M
- Legacy: ChoicesController.java:41-47 includes `builtin` and `countsAsPlaced` on job type options.
- vNext now: src/modules/placements/tpo-builtin-job-types.ts:1-14 exposes fixed label/placed default; custom rows in tpo-configuration-read-service.ts:12-28.
- Fix: Compose builtins + visible custom and explicit metadata in every job type selector.

## G2-2-030-016  [P2] MISSING  facet F05  effort M
- Legacy: ChoicesController.java:76-78 sorts unique trimmed branches lexically ORDER BY 1.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 does not produce branch options.
- Fix: Query DISTINCT department names, trimmed, filter empties/deleted students; ascending lexical.

## G2-2-030-018  [P2] GAP  facet F05  effort M
- Legacy: ChoicesController.java:42-47 delegates job type order and visibility to JobTypeService.visible(college).
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 returns DB rows; builtins separate `tpo-builtin-job-types.ts:2-8`.
- Fix: Merge visible builtins/custom in authoritative display order; respect college hidden flags.

## G2-2-030-032  [P2] GAP  facet F10  effort M
- Legacy: ChoicesController.java:35-82 performs one GET returning all option sets and two college-scoped SQL reads.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 and tpo-outcome-label-settings-service.ts:38-57 fetch separately.
- Fix: Choose aggregated batched read or shared session query to reduce N API calls and inconsistent state.

## G2-2-030-034  [P2] GAP  facet F10  effort M
- Legacy: ChoicesController.java:42-47 filters jobTypes through visible(college).
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 returns configured rows in settings read.
- Fix: Use hidden-state-aware visibility logic, not raw settings list for drive options.

## G2-2-030-042  [P2] GAP  facet F13  effort M
- Legacy: useChoices.js:34-39 initializes fallback choices while loading, then fresh result.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 returns `ready` and rows, UI consumer handles loading independently.
- Fix: Provide consistent fixed fallback, loading, stale and blocked states for catalog consumers.

## G2-2-030-044  [P2] GAP  facet F13  effort S
- Legacy: ChoicesController.java:76-81 empty branch/year lists when no college, with fixed lists retained.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 TPO-only settings responses.
- Fix: Ensure `No options for this college` empty dropdown distinct from failed loading and missing scope.

## G2-2-030-057  [P2] GAP  facet F19  effort M
- Legacy: ChoicesController.java:37-82 one route queries jobTypes/outcomeLabels and two DISTINCT college learner queries.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 and outcome service :38-57 make separate reads.
- Fix: Cache/version fixed choices and batch college DB choices for large TPO pages.

## G2-2-030-059  [P2] GAP  facet F19  effort M
- Legacy: ChoicesController.java:76-81 selects DISTINCT TRIM and ORDER BY 1 with indexed college joins.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 doesn't query learner branches/years.
- Fix: Implement indexed distinct queries with college/deleted filters and pagination only if necessary.

## G2-2-037-038  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:76-81 college branches/years live query
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 configuration only
- Fix: Ensure dropdown data CSV/report filters use tenant-scoped years/branches.

## G2-3-011-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-67`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypes.java:11-18`
- vNext now: `src/modules/placements/tpo-builtin-job-types.ts:2-8`, `src/modules/placements/tpo-configuration-read-service.ts:22-25`, `src/app/(authenticated)/tpo/settings/job-types/page.tsx:17-21`
- Fix: Legacy returns fixed builtins first in declared order followed by saved custom order, including hidden; vNext alphabetically sorts persisted rows and shows custom above collapsed builtins. Preserve legacy ordering.

## G2-3-011-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:30-35`, `75-86`
- vNext now: `src/db/schema/tpo-configuration.ts:22-38`, `src/modules/placements/tpo-configuration-read-service.ts:22-26`
- Fix: Legacy data fields id/name/builtin/countsAsPlaced/hidden/drives versus vNext id/label/isBuiltin/active/countsAsPlaced/updatedAt. Include drives and consistent hidden polarity in UI projection.

## G2-3-011-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-67`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:114-146`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:22-25`, `src/components/tpo/tpo-job-types-editor.tsx:21-23`
- Fix: Legacy complete builtins and custom list including hidden with stable original order, no pager; vNext separated and reordered lists. Restore one complete default listing.

## G2-3-011-035  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:29-36`, `101-103`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:10-16`, `src/modules/placements/tpo-configuration-read-service.ts:12-26`
- Fix: Legacy Loading job types six-row skeleton and retryable Could not load job types PanelError; vNext server page with migration warning but no equivalent retryable error or local skeleton. Add loading/Retry behavior.

## G2-3-011-044  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:29-36`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:22-26`, `src/components/tpo/tpo-job-types-editor.tsx:21-23`
- Fix: Legacy single grouped count-by-type query plus full list; vNext sorted config read only, client-side search. Add grouped nondeleted usage count in one query, no per-row N+1.

## G2-2-030-063  [P3] GAP  facet F21  effort L
- Legacy: ChoicesController.java:30-33 uses MySQL JDBC, SecurityContext and TPO settings services.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 Drizzle/Postgres + persisted membership.
- Fix: Map SQL tenant IDs and legacy settings JSON into new schema, preserve policy metadata.
