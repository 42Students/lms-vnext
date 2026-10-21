# Work packet (wave 2): edit src/components/tpo/tpo-builtin-job-types-editor.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

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

## G2-3-011-017  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:133-135`, `175-177`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:82-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:42-44`
- Fix: Legacy stages row toggles and has one Save changes button; vNext custom toggle PATCHes immediately and built-in checkbox asks then PATCHes. Reintroduce staged edits and atomic save.

## G2-3-011-040  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:110-112`, `125-140`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:75-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:37-47`
- Fix: Legacy role=table, row, columnheader and cell, named radiogroups and switches; vNext custom semantic list with disclosures, builtins DataTable. Restore table cell/switch relationships and keyboard focus order.

## G2-3-011-042  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:107-109`, `149-159`, `173-176`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:42-58`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:35-48`
- Fix: Literal labels differ: legacy Add a job type, e.g. Part-time, In the drive form, Save changes; vNext Manage job types, New job type, Add job type, Switch off and integration copy. Align legacy copy.

## G2-3-011-006  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:114-125`
- vNext now: `src/components/tpo/tpo-builtin-job-types-editor.tsx:39-41`, `src/components/tpo/tpo-job-types-editor.tsx:75-80`
- Fix: Legacy displays Built-in as Ant Tag on name; vNext puts small plain muted text after name. Use legacy badge treatment.

## G2-3-011-041  [P3] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:134-141`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:82-86`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:42-46`
- Fix: Legacy per-name aria-label for switch and Remove action, vNext custom Switch off/Reactivate button lacks name in aria-label. Provide disambiguating accessible name.
