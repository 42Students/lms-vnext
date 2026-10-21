# Work packet (wave 2): edit src/modules/academics/lecture-hall-service.ts (part 2 of 2)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/lecture-hall-controller.md, docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

## G2-4-027-041  [P2] GAP  facet F11  effort M
- Legacy: Super-admin selected college and organization guards on create (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:59-74`)
- vNext now: SA exact college scope only; require academics.manage (`src/modules/academics/lecture-hall-service.ts:124-138`)
- Fix: Compare allowed organization-only SA scope and document secure alternative.

## G2-4-027-042  [P2] GAP  facet F11  effort M
- Legacy: GET by ID requires college access; by dept department access (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:111-116,131-145`)
- vNext now: No fetch-by-id; listing manage permission (`src/modules/academics/lecture-hall-service.ts:124-138,167-173`)
- Fix: Use read-only `academics.view` for entitled faculty/learner if legacy allowed.

## G2-4-027-062  [P2] GAP  facet F19  effort M
- Legacy: Default unpaged reads and optional page/size server paging (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:79-110,209-230`)
- vNext now: Always offset/limit and total count; expensive correlated upcoming count (`src/modules/academics/lecture-hall-service.ts:101-104,193-234`)
- Fix: Benchmark listing 10k halls, cap totals and preserve page semantics.

## G2-4-027-066  [P2] GAP  facet F20  effort M
- Legacy: DELETE checks schedule count then removes hall (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:148-153`)
- vNext now: Archive is transactional with upcoming guard (`src/modules/academics/lecture-hall-service.ts:289-309`)
- Fix: Preserve legacy delete policy decision and any hard-delete migration cleanup.

## G2-14-013-048  [P3] GAP  facet F14  effort S
- Legacy: Legacy cache refresh is admin-triggered data reload not file upload `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:116-121`
- vNext now: New CRUD direct persistence `src/modules/academics/lecture-hall-service.ts:237-267`
- Fix: Document no manual refresh needed

## G2-6-030-012  [P3] GAP  facet F04  effort S
- Legacy: Legacy Department column uses hyphen '-' when null/zero; resolves local departments list to name (LectureHalls.js:251-260).
- vNext now: vNext departmentName directly from JOIN, null shown em dash '—' (lecture-hall-manager.tsx:203-205; lecture-hall-service.ts:200-211).
- Fix: Use exact legacy '-' placeholder if visual parity strict.
