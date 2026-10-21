# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/teacher-file-explorer.md

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/teacher-file-explorer.md

## G2-6-006-002  [P2] MISSING  facet F01  effort S
- Legacy: Old route name is camelCase `fileExplorer`, not kebab-case `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-7`
- vNext now: New next.config alias for mentor retains camelCase, but not teacher `next.config.ts:10-16`
- Fix: Preserve exact capitalization for old teacher bookmark path

## G2-6-006-007  [P2] GAP  facet F03  effort S
- Legacy: Old FileExplorer redirect doesn't display notice or toast `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-13`
- vNext now: New source alias absent; mentor redirect config also silent `next.config.ts:10-16`
- Fix: Use silent redirect rather than custom unavailable panel when alias added

## G2-6-006-021  [P2] MISSING  facet F13  effort S
- Legacy: Old no empty/loading/error/offline intermediate page; response is redirect `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-12`
- vNext now: New missing route can show not-found; no teacher alias in config `next.config.ts:7-17`
- Fix: Add redirect to eliminate spurious 404 state

## G2-6-006-033  [P2] GAP  facet F23  effort S
- Legacy: Old feature intentionally retired; `TeacherFileExplorerRedirect` component always null `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:9-12`
- vNext now: New design parity doc explicitly says retired; missing compatibility URL `docs/parity/faculty.md:1-25` `next.config.ts:7-17`
- Fix: Honor retirement without breaking bookmarks
