# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/l17-u021-public-job-response-dto.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l17-u021-public-job-response-dto.md

## G2-17-021-049  [P1] MISSING  facet F23  effort L
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:10-17 public job link contract independent of learner login.
- vNext now: V/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx:1-87 requires session; V/app/placements/page.tsx:28-77 public metrics only.
- Fix: Owner decision: support truly public job detail or explicitly retire all old links with explanatory redirect.
