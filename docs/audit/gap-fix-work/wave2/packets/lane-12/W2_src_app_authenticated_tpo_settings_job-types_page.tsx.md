# Work packet (wave 2): edit src/app/(authenticated)/tpo/settings/job-types/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-3-011-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/settings.js:62-77`, `94-98`, `174-181`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:10-19`
- Fix: Legacy is Settings shell with Job types selected in grouped side-nav; vNext is a stand-alone /tpo/settings/job-types screen with compact nav. Restore shared Settings container and active section.

## G2-3-011-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/settings.js:174-205`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:105-110`, `149-177`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:12-22`, `src/components/tpo/tpo-job-types-editor.tsx:41-89`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:33-50`
- Fix: Legacy order: Settings header > grouped side-nav > Job types panel > unified table > Add a job type > info alert > Save changes. vNext: independent title/nav > custom editor/search/list > collapsed built-ins. Reorder into one canvas/panel.

## G2-3-011-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/settings.js:51-55`, `194-200`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:13`
- Fix: Legacy description reads: The job types drives can have, and whether an offer of each counts as placed. Add your own; switch off the ones you never use. VNext title description differs; restore exact wording.

## G2-3-011-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-67`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypes.java:11-18`
- vNext now: `src/modules/placements/tpo-builtin-job-types.ts:2-8`, `src/modules/placements/tpo-configuration-read-service.ts:22-25`, `src/app/(authenticated)/tpo/settings/job-types/page.tsx:17-21`
- Fix: Legacy returns fixed builtins first in declared order followed by saved custom order, including hidden; vNext alphabetically sorts persisted rows and shows custom above collapsed builtins. Preserve legacy ordering.

## G2-3-011-026  [P2] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/settings.js:99-135`, `197-202`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:12-23`, `src/components/tpo/tpo-job-types-editor.tsx:24-40`
- Fix: Legacy Unsaved changes badge, Leave without saving? modal, route/beforeunload guard; vNext immediate saving has no dirty state or guard. Recreate when restoring staged editor.

## G2-3-011-035  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:29-36`, `101-103`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:10-16`, `src/modules/placements/tpo-configuration-read-service.ts:12-26`
- Fix: Legacy Loading job types six-row skeleton and retryable Could not load job types PanelError; vNext server page with migration warning but no equivalent retryable error or local skeleton. Add loading/Retry behavior.

## G2-3-011-043  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/settings.js:51-55`, `194-202`
- vNext now: `src/app/(authenticated)/tpo/settings/job-types/page.tsx:13-14`
- Fix: Legacy global Settings heading/subtitle plus panel heading; vNext separate Job types page heading. Match text hierarchy and legacy subtitle.

## G2-6-011-003  [P2] GAP  facet F02  effort M
- Legacy: Old builtins first, custom after, hidden included in `all()` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-68`
- vNext now: New builtins in collapsed Disclosure *after* custom editor `src/app/(authenticated)/tpo/settings/job-types/page.tsx:17-21`
- Fix: Present built-in first in original order, custom second
