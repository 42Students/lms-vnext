# Work packet: edit src/app/(authenticated)/teacher/courses/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-file-explorer.md, docs/audit/gap2/lane-6/teacher-index.md

## G2-6-006-004  [P1] MISSING  facet F02  effort S
- Legacy: Old request returns redirect before rendering JSX; component returns null `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-12`
- vNext now: New target `/teacher/courses` renders PageHeader My Courses `src/app/(authenticated)/teacher/courses/page.tsx:31-37`, but source alias is absent `next.config.ts:7-17`
- Fix: Restore redirect response so target renders without interim not-found screen

## G2-6-007-032  [P1] MISSING  facet F23  effort S
- Legacy: Old authenticated redirect to My Courses is intentional `docs/legacy-source/frontend/src/pages/teacher/index.js:2-7`
- vNext now: New missing root route diverges despite valid target route `next.config.ts:7-17` `src/app/(authenticated)/teacher/courses/page.tsx:10-36`
- Fix: Restore `/teacher` index with role-aware server redirect
