# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/job-application-repository.md

5 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/job-application-repository.md

## G2-6-015-005  [P2] GAP  facet F04  effort M
- Legacy: JOIN FETCH of learner and job for own apps (JobApplicationRepository.java:50-52).
- vNext now: Own query returns application, role option, job, company (application-service.ts:963-1001).
- Fix: Map every legacy learner/job response field to new composite response including empty fallbacks.

## G2-6-015-012  [P2] GAP  facet F05  effort M
- Legacy: Own apps sorted appliedAt DESC, strict active view (JobApplicationRepository.java:50-52).
- vNext now: Own apps sorted submittedAt DESC, includes withdrawn (application-service.ts:1002-1008).
- Fix: Verify legacy own-view uses withdrawn-special reader; keep original order and badge filters.

## G2-6-015-028  [P2] GAP  facet F10  effort M
- Legacy: Legacy counts per job and by multiple jobs (JobApplicationRepository.java:119-143).
- vNext now: Report pulls selected application rows then aggregates (report-service.ts:234-266).
- Fix: Create grouped SQL counts for high-volume lists and report summaries.

## G2-6-015-041  [P2] GAP  facet F18  effort M
- Legacy: Legacy vocabulary APPLIED and OFFERED etc used in queries (JobApplicationRepository.java:20-32).
- vNext now: SUBMITTED and WITHDRAWN vocabulary in core (placements.ts:1047-1050).
- Fix: Map exact old LMS status labels and empty placeholders from legacy copy catalogue.

## G2-6-015-043  [P2] GAP  facet F19  effort M
- Legacy: SQL grouped countByJobIds / hired (JobApplicationRepository.java:127-143).
- vNext now: Report loads application rows (report-service.ts:234-266).
- Fix: Use grouped aggregate SQL for dashboards at 10k learners/college.
