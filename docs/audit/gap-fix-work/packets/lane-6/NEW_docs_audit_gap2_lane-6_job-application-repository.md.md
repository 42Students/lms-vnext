# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/job-application-repository.md

9 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/job-application-repository.md

## G2-6-015-007  [P1] GAP  facet F04  effort M
- Legacy: Application source up to 50 chars (JobApplication.java:48-53).
- vNext now: Only INTERNAL/EXTERNAL channel (placements.ts:992,1043-1046).
- Fix: Add granular source code mapping to preserve LINKEDIN/DIRECT_LINK analytics.

## G2-6-015-014  [P1] GAP  facet F05  effort S
- Legacy: Job list excludes soft-deleted candidates (JobApplicationRepository.java:88-90).
- vNext now: Job list has job-only WHERE, so withdrawn remain (application-service.ts:1053-1056).
- Fix: Default active register must exclude WITHDRAWN; expose explicit history filter.

## G2-6-015-016  [P1] GAP  facet F05  effort M
- Legacy: Org-wide list explicit Pageable and countQuery (JobApplicationRepository.java:104-109).
- vNext now: Job-list query unbounded (application-service.ts:1022-1056).
- Fix: Add paged queries with deterministic tie-breaker and total count.

## G2-6-015-032  [P1] GAP  facet F12  effort M
- Legacy: In-progress excludes HIRED/REJECTED/WITHDRAWN with UPPER and null allowance (JobApplicationRepository.java:20-26).
- vNext now: Core status only SUBMITTED/WITHDRAWN, offer/round modeled separately (placements.ts:1047-1050; report-service.ts:268-278).
- Fix: Compute equivalent effective pipeline state for in-progress KPI rather than raw SUBMITTED count.

## G2-6-015-034  [P1] GAP  facet F12  effort M
- Legacy: One application per learner+job (JobApplication.java:12-15).
- vNext now: Unique on roleOption+membership allows multiple roles within same job (placements.ts:1029-1035).
- Fix: Document decision; enforce job+member unique if legacy cardinality retained.

## G2-6-015-035  [P1] GAP  facet F12  effort L
- Legacy: Legacy status field contains APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED (JobApplication.java:29-30).
- vNext now: Status CHECK only SUBMITTED/WITHDRAWN (placements.ts:1047-1050).
- Fix: Provide derived stage from screening/round/offer histories in all reads and exports.

## G2-6-015-042  [P1] GAP  facet F19  effort M
- Legacy: Pageable org-wide fetch avoids all-history memory blow-up (JobApplicationRepository.java:104-109).
- vNext now: Job list returns full array no cursor/limit (application-service.ts:1022-1056).
- Fix: Implement server paging, total count, stable sorting and bounded bulk actions.

## G2-6-015-050  [P1] GAP  facet F22  effort M
- Legacy: Legacy entity @Version long supports optimistic locking (JobApplication.java:127-133).
- vNext now: Core row updatedAt but no version (placements.ts:1015-1019).
- Fix: Use version integer/CAS for non-status mutations as needed.

## G2-6-015-020  [P2] GAP  facet F07  effort M
- Legacy: Optional empty for missing ID, no user-facing strings (JobApplicationRepository.java:38-48).
- vNext now: Typed not-found/authorization errors in service (application-service.ts:542-554,1059-1083).
- Fix: Map errors at route/frontend boundary to legacy exact text and HTTP semantics.
