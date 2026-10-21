# Work packet (wave 3): edit src/app/api/academics/sections/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u014-class-search-controller.md

## G2-5-014-003  [P1] MISSING  facet F01  effort L
- Legacy: Legacy /program/{id}, /category/{name}, /popular, /stats, /exists, /select, /refresh all exposed as sibling routes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:119-241`)
- vNext now: vNext sections API only GET list and POST create, no matching endpoints (`src/app/api/academics/sections/route.ts:12-51`)
- Fix: Map each endpoint to a scoped handler or prove retirement of old consumers
