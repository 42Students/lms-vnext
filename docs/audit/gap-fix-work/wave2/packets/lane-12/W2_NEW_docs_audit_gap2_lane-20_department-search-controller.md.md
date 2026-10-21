# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/department-search-controller.md

6 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/department-search-controller.md

## G2-20-013-002  [P2] GAP  facet F01  effort S
- Legacy: Seven endpoints search/popular/college/categories/category/select/stats/exists `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:60-68,117-145,149-209,209-229`
- vNext now: New directory component locally filters an already-authorized list [N:17-41,U:54-68]
- Fix: Add route/feature compatibility plan for all seven endpoint methods and callers

## G2-20-013-007  [P2] GAP  facet F04  effort S
- Legacy: Search default query empty; limit15; collegeId optional for global SA `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:64-68`
- vNext now: Client directory filters all supplied rows and pagination default 10 [N:17-24,27-41,U:60-66]
- Fix: Align default visible count and global SA cross-college scope

## G2-20-013-020  [P2] GAP  facet F10  effort S
- Legacy: Search GET reads in-memory cache; selecting POST increments use count `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:89-113,193-206`
- vNext now: Local JS filter and CSV export, no popularity write [N:17-66,U:63-67]
- Fix: Map selection analytics endpoint and refresh semantics

## G2-20-013-035  [P2] GAP  facet F20  effort S
- Legacy: Legacy usage stats derive cache size/college count `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:209-226`
- vNext now: New usage fields count programs/courses/faculty per row, no total colleges metric [N:10-15,U:31-42]
- Fix: Add popularity/statistics projection where legacy dashboard uses it

## G2-20-013-013  [P3] GAP  facet F06  effort S
- Legacy: Query limit parsed integer, no explicit upper bound `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:64-68`
- vNext now: New pageSize clamp1..100, options 10/25/50/100 [N:27-41,U:85-92]
- Fix: Preserve API limit semantics or clearly cap for resource safety

## G2-20-013-021  [P3] GAP  facet F10  effort S
- Legacy: Cache loads from DB at startup or refresh `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchCache.java:30-35,59-72,103-105`
- vNext now: Directory data preloaded server-side, then filtered locally [N:1-5,U:54-65]
- Fix: Verify new rows appear after create without full reload or stale cache
