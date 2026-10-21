# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-file-explorer.md, docs/audit/gap2/lane-6/teacher-index.md

## G2-6-006-008  [P2] MISSING  facet F04  effort S
- Legacy: Old route returns only redirect object, no query/DB data `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-8`
- vNext now: New destination reads authenticated faculty courses `src/app/(authenticated)/teacher/courses/page.tsx:13-29` but no source route `next.config.ts:7-17`
- Fix: Add alias without independent DB read; let courses page resolve auth/context

## G2-6-006-028  [P2] GAP  facet F19  effort S
- Legacy: Old direct server redirect avoids fetching faculty/course records `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-8`
- vNext now: New missing route avoids DB but produces wrong 404; target reads list after navigation `next.config.ts:7-17` `src/app/(authenticated)/teacher/courses/page.tsx:13-29`
- Fix: Use build-time redirect to avoid middleware overhead and preserve fast navigation

## G2-6-007-004  [P2] MISSING  facet F02  effort S
- Legacy: Old index returns empty fragment, no sections or card `docs/legacy-source/frontend/src/pages/teacher/index.js:9-11`
- vNext now: New index missing; nearest courses page renders full My Courses header `src/app/(authenticated)/teacher/courses/page.tsx:31-37`
- Fix: Restore redirect-only page without an intermediate 404 or new splash
