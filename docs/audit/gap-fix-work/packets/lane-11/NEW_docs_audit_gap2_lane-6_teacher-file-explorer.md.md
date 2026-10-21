# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/teacher-file-explorer.md

5 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/teacher-file-explorer.md

## G2-6-006-001  [P1] MISSING  facet F01  effort S
- Legacy: Old `/teacher/fileExplorer` redirects to `/teacher/courses` server-side `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-7`
- vNext now: NONE: vNext has no `/teacher/fileExplorer` page; `next.config.ts` only redirects analogous mentor fileExplorer `next.config.ts:7-17`
- Fix: Add Next redirect alias `/teacher/fileExplorer` → `/teacher/courses` (temporary/307)

## G2-6-006-013  [P1] MISSING  facet F08  effort S
- Legacy: Old redirects with `permanent: false`; no confirmation/success toast `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-7`
- vNext now: New mentor retired redirects use `permanent: false`; no matching teacher entry `next.config.ts:10-17`
- Fix: Use `permanent: false`, preserving temporary redirect semantics and no toast

## G2-6-006-015  [P1] MISSING  facet F10  effort S
- Legacy: Old Next getServerSideProps redirects on GET, no POST/mutation `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-8`
- vNext now: New analogous redirect route data exists only for mentor, not teacher `next.config.ts:7-17`
- Fix: Add GET-only redirect without DB writes or audit side effects

## G2-6-006-018  [P1] MISSING  facet F11  effort S
- Legacy: Old route could be visited by anyone but then forwards to courses (authorization applied there) `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-8`
- vNext now: New alias missing for all users, even valid faculty `next.config.ts:7-17`
- Fix: Preserve old bookmarks independent of session validity; target handles failures

## G2-6-006-011  [P2] GAP  facet F07  effort S
- Legacy: Old no validation failure or user error text at this redirect `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-13`
- vNext now: New missing route would surface framework not-found rather than legacy redirect `next.config.ts:7-17`
- Fix: Suppress incorrect not-found by adding canonical redirect rule
