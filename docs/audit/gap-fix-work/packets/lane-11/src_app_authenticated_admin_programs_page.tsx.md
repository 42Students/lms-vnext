# Work packet: edit src/app/(authenticated)/admin/programs/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md

## G2-10-020-015  [P1] GAP  facet F03  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:303-306 — Cached-data fetch error yellow warning and Retry.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:35-50 — Route-wide Programs unavailable error replacing directory.
- Fix: Show stale verified prior rows when refresh fails same tenant.

## G2-10-020-043  [P1] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:303-309 — Refresh keeps prior rows same college, error warns.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:35-51 — Catches all read exceptions and hides list entirely.
- Fix: Retain last-good per-college data with warning and retry.

## G2-10-020-054  [P1] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:88-98 — GET /api/v1/new-program/fetch departments separately; retry independently.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:37-45 — Both server promises awaited together; one error blanks entire page.
- Fix: Isolate department and program fetch states/errors.

## G2-10-020-097  [P1] GAP  facet F20  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:83-99 — departmentSeq separate guard prevents stale selectors.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:37-45 — Promise.all joins both reads; independent retry unavailable.
- Fix: Split retries and reject late department response after scope switch.

## G2-20-029-053  [P1] GAP  facet F13  effort M
- Legacy: Scoped reload failure keeps last loaded data with warning 'Couldn't refresh programs' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:301-311`)
- vNext now: Server outcome hides directory and renders fatal 'Programs unavailable' (`src/app/(authenticated)/admin/programs/page.tsx:40-57`)
- Fix: Preserve verified last-known data on same-scope read failures where safe

## G2-10-020-047  [P3] GAP  facet F08  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:113-114 — No college create warning 'Select a college first.'
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:24-33 — No form rendered, only empty scope message.
- Fix: Preserve warning on blocked action path or prevent navigation.
