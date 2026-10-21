# Work packet (wave 2): edit src/components/tpo/tpo-job-types-editor.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-3-011-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/settings.js:174-205`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:105-110`, `149-177`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:12-22`, `src/components/tpo/tpo-job-types-editor.tsx:41-89`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:33-50`
- Fix: Legacy order: Settings header > grouped side-nav > Job types panel > unified table > Add a job type > info alert > Save changes. vNext: independent title/nav > custom editor/search/list > collapsed built-ins. Reorder into one canvas/panel.

## G2-3-011-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:110-146`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:75-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:37-47`
- Fix: Legacy presents five-column row: Job type, Counts as placed, Drives, In the drive form, remove; vNext custom list plus three-column builtin DataTable. Restore unified five columns and inline actions.

## G2-3-011-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:133-143`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:82-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:42-46`
- Fix: Legacy has switch and remove icon with tooltip; vNext custom Switch off/Reactivate button and builtin checkbox plus On/Off. Match control semantics, tooltip and placement.

## G2-3-011-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:149-165`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:47-56`
- Fix: Legacy Add button has Plus icon and label Add, vNext label Add job type without icon. Align literal label and icon.

## G2-3-011-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-67`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:114-146`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:22-25`, `src/components/tpo/tpo-job-types-editor.tsx:21-23`
- Fix: Legacy complete builtins and custom list including hidden with stable original order, no pager; vNext separated and reordered lists. Restore one complete default listing.

## G2-3-011-014  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:117-129`, `133-141`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:77-85`, `src/components/tpo/tpo-custom-job-type-rename.tsx:29-35`, `src/components/tpo/tpo-custom-job-type-placed.tsx:26-35`
- Fix: Legacy edits name and Yes/No directly in each custom row plus the switch, vNext hides name and count inside Edit job type disclosure. Put controls inline.

## G2-3-011-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:149-165`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:47-58`
- Fix: Legacy input placeholder e.g. Part-time, fixed 220px, 40 char limit and Enter to add; vNext omits placeholder and stretches input. Restore copy and width/keyboard parity.

## G2-3-011-017  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:133-135`, `175-177`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:82-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:42-44`
- Fix: Legacy stages row toggles and has one Save changes button; vNext custom toggle PATCHes immediately and built-in checkbox asks then PATCHes. Reintroduce staged edits and atomic save.

## G2-3-011-026  [P2] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/settings.js:99-135`, `197-202`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:12-23`, `src/components/tpo/tpo-job-types-editor.tsx:24-40`
- Fix: Legacy Unsaved changes badge, Leave without saving? modal, route/beforeunload guard; vNext immediate saving has no dirty state or guard. Recreate when restoring staged editor.

## G2-3-011-040  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:110-112`, `125-140`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:75-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:37-47`
- Fix: Legacy role=table, row, columnheader and cell, named radiogroups and switches; vNext custom semantic list with disclosures, builtins DataTable. Restore table cell/switch relationships and keyboard focus order.

## G2-3-011-042  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:107-109`, `149-159`, `173-176`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:42-58`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:35-48`
- Fix: Literal labels differ: legacy Add a job type, e.g. Part-time, In the drive form, Save changes; vNext Manage job types, New job type, Add job type, Switch off and integration copy. Align legacy copy.

## G2-3-011-044  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:29-36`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:22-26`, `src/components/tpo/tpo-job-types-editor.tsx:21-23`
- Fix: Legacy single grouped count-by-type query plus full list; vNext sorted config read only, client-side search. Add grouped nondeleted usage count in one query, no per-row N+1.

## G2-6-011-004  [P2] GAP  facet F02  effort M
- Legacy: Old `list()` includes per-type `drives` usage count `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`
- vNext now: New editor shows active status and placed answer but no drive count `src/components/tpo/tpo-job-types-editor.tsx:73-86`
- Fix: Surface usage count before disabling/renaming/removing

## G2-6-011-012  [P2] MISSING  facet F05  effort M
- Legacy: Old `list()` used count grouped by lowercase job_type of non-deleted jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:76-84`
- vNext now: New custom list lacks job use counts `src/components/tpo/tpo-job-types-editor.tsx:73-86`
- Fix: Add scoped drive count subquery excluding archived/deleted as required

## G2-6-011-023  [P2] GAP  facet F09  effort M
- Legacy: Old service has no modal, settings frontend renders editor `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:121-123`
- vNext now: New inline form/disclosures with no save-all dialog `src/components/tpo/tpo-job-types-editor.tsx:41-89`
- Fix: Audit legacy JobTypesTab confirm/save-all UI before final dialog parity

## G2-6-011-033  [P2] GAP  facet F13  effort M
- Legacy: Old `list()` returns zero usage count for unused type `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:78-85`
- vNext now: New status list shows empty-state but no usage count `src/components/tpo/tpo-job-types-editor.tsx:73-76`
- Fix: Show zero drive usage explicitly

## G2-6-011-038  [P2] GAP  facet F18  effort M
- Legacy: Old errors say `Up to 30 job types of your own` and `Keep at least one job type switched on` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:150-153`
- vNext now: New displays `You can add up to 30 custom job types` / `Keep ... visible` `src/components/tpo/tpo-job-types-editor.tsx:31-38`
- Fix: Align exact error literals

## G2-3-011-006  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:114-125`
- vNext now: `src/components/tpo/tpo-builtin-job-types-editor.tsx:39-41`, `src/components/tpo/tpo-job-types-editor.tsx:75-80`
- Fix: Legacy displays Built-in as Ant Tag on name; vNext puts small plain muted text after name. Use legacy badge treatment.

## G2-3-011-041  [P3] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:134-141`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:82-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:42-46`
- Fix: Legacy per-name aria-label for switch and Remove action, vNext custom Switch off/Reactivate button lacks name in aria-label. Provide disambiguating accessible name.
