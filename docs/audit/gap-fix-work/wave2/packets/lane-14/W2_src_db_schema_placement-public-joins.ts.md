# Work packet (wave 2): edit src/db/schema/placement-public-joins.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u022-tpo-public-link.md, docs/audit/gap2/lane-8/job-slug-generator.md

## G2-16-022-009  [P2] GAP  facet F05  effort S
- Legacy: CollegePublicLinkService.java:86-88 unique college link.
- vNext now: placement-public-joins.ts:25-36 unique hash, but multiple unrevoked college rows allowed.
- Fix: Enforce one active per scope with partial index.

## G2-8-010-012  [P2] GAP  facet F06  effort M
- Legacy: Validator separately called `isValidSlug(String)` and checks prefix, lengths and regex (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:36-50`)
- vNext now: New incoming public join token handled through route token input and stored hash (no isValidSlug bridge) (`src/modules/placements/tpo-public-join-link-service.ts:142-147; src/db/schema/placement-public-joins.ts:9-10,28-31`)
- Fix: Add explicit legacy validation only on old public-job compatibility route; never accept insecure slug as new join token
