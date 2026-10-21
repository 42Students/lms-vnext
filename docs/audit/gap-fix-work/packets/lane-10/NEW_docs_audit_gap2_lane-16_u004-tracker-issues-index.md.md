# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u004-tracker-issues-index.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-021  [P1] GAP  facet F05  effort S
- Legacy: `BugReportRepository.java:18-32`: reporter matches case-insensitively exact value.
- vNext now: `admin-service.ts:156-159`: case-insensitive substring reporter matching.
- Fix: Apply equality match for dropdown reporter; optional fuzzy search separately if approved.

## G2-16-004-022  [P1] GAP  facet F05  effort S
- Legacy: `BugReportRepository.java:22-27`: search covers ID, description, page, screen and section.
- vNext now: `admin-service.ts:160-168`: searches ID, reporter, page, description, but NOT screen/section.
- Fix: Add screen and section search; keep reporter search as additional only if approved.

## G2-16-004-079  [P1] GAP  facet F22  effort M
- Legacy: `BugReportRepository.java:18-32`: case-insensitive exact reporter and search through page/screen/section.
- vNext now: `admin-service.ts:156-168`: reporter fuzzy and search excludes screen/section.
- Fix: Update query predicates; add indexes if scale requires for case-folded text.
