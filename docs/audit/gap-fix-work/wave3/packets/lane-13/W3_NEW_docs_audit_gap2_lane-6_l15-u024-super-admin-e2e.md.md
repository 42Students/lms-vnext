# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md

## G2-15-024-004  [P1] MISSING  facet F04  effort L
- Legacy: SeedResult has IDs for orgs, colleges, departments, programs, batches, classes, courses, lessons, faculty, learners, halls, attendance, announcements, jobs, interview, projects and testPhones (E2eSeedService.java:128-162).
- vNext now: No seed result map in e2eIdentityDirectory; only user fields uid/contact/displayName (src/modules/people/e2e-identity-directory.ts:13-24,50-125).
- Fix: Produce deterministic typed complete seed manifest for all functional modules.

## G2-15-024-022  [P1] MISSING  facet F19  effort L
- Legacy: Fixture writes one course plus lecture/video/YouTube/assignment, attendance, placements and project workspace per demo (E2eSeedService.java:194-268).
- vNext now: No domain fixture creation, directory lookup only (src/modules/people/e2e-identity-directory.ts:50-125).
- Fix: Add reproducible cross-module sample graph and fast idempotent rerun.
