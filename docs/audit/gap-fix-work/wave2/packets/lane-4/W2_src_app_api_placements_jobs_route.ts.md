# Work packet (wave 2): edit src/app/api/placements/jobs/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u013-job-search-cache.md, docs/audit/gap2/lane-17/job-search-controller.md, docs/audit/gap2/lane-9/l18-u013-job-search-cache.md

## G2-18-013-048  [P2] MISSING  facet F23  effort M
- Legacy: Legacy /api/v2/jobs/* endpoints, organization-wide active scope, synonym dictionary and job-cache refresh; JobSearchController.java:121-407;JobSearchCache.java:79-111,213-302
- vNext now: vNext has no equivalent generic cache/refresh or API response wrappers; src/app/api/placements/jobs/route.ts:12-34
- Fix: Explicitly inventory consumers and retire/redirect legacy API paths; do not add insecure endpoints

## G2-17-013-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:436-445 — POST /refresh is superadmin maintenance endpoint.
- vNext now: src/app/api/placements/jobs/route.ts:12-37 — Jobs API GET/POST not explicit cache refresh.
- Fix: Replace refresh with safe revalidation control or document DB direct reads.

## G2-17-013-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:249-262 — By-organization default limit=50.
- vNext now: src/app/api/placements/jobs/route.ts:12-19 — GET collegeId lists jobs, no explicit limit.
- Fix: Define bounded org-scoped search size and pagination.

## G2-18-013-058  [P2] MISSING  facet F23  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:236-246 /organizations returns hardcoded 42Learn,External Companies
- vNext now: src/app/api/placements/jobs/route.ts:12-20 no matching static organizations endpoint
- Fix: Document or migrate legacy organization dropdown source.

## G2-18-013-036  [P3] GAP  facet F18  effort S
- Legacy: Legacy successful /search message Jobs retrieved in {ms}ms and /popular Popular jobs retrieved; JobSearchController.java:208-232
- vNext now: vNext response {jobs} without wrapper text; src/app/api/placements/jobs/route.ts:12-19
- Fix: Document consumer copy translation; avoid unnecessary timing text in new UI

## G2-17-013-010  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:210-212 — Search response message `Jobs retrieved in {duration}ms`.
- vNext now: src/app/api/placements/jobs/route.ts:12-19 — JSON {jobs} without elapsed-time message.
- Fix: Only expose performance timing in monitoring; user copy parity if necessary.

## G2-18-013-053  [P3] GAP  facet F21  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:436-445 administrative cache refresh side effect
- vNext now: src/app/api/placements/jobs/route.ts:12-20 no analogous refresh route
- Fix: Remove legacy cache-refresh automation or migrate to explicit invalidation policy.
