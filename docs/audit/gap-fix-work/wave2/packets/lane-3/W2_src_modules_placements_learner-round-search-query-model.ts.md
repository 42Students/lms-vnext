# Work packet (wave 2): edit src/modules/placements/learner-round-search-query-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u013-job-search-cache.md

## G2-18-013-016  [P2] GAP  facet F06  effort S
- Legacy: Legacy search accepts query string and limit int; JobSearchController.java:125-136
- vNext now: vNext learner round search query parsed with Zod, shareable q only; learner-round-search-query-model.ts:4-17
- Fix: Handle large Unicode query, empty/invalid limit, URL encoding and query max length explicitly

## G2-18-013-041  [P2] GAP  facet F20  effort S
- Legacy: Legacy getByOrganizationId uses subList and no explicit limit validation, potential negative limit; JobSearchCache.java:219-224
- vNext now: vNext query schemas, URL validation; learner-jobs-browse-model.ts:39-51;learner-round-search-query-model.ts:4-17
- Fix: Clamp numeric limits >=0, guard hostile long query/special characters
