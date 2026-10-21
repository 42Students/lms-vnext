# Work packet (wave 2): edit src/modules/academics/college-batch-retire-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md

## G2-2-029-067  [P2] GAP  facet F12  effort M
- Legacy: BatchServiceImpl.java:400-409 hard deletes batch only with no classes.
- vNext now: college-batch-retire-service.ts:25-47 archives only PLANNED and dependency-free.
- Fix: Agree archive-vs-delete semantics and clarify class/learner/offering/history blockers.

## G2-2-029-101  [P2] GAP  facet F22  effort M
- Legacy: BatchServiceImpl.java:400-409 hard deletes unreferenced batch.
- vNext now: college-batch-retire-service.ts:45-47 soft archives PLANNED.
- Fix: Decide migration of deleted legacy records and archive retention policy.

## G2-2-029-105  [P2] GAP  facet F23  effort M
- Legacy: BatchController.java:304-339 hard delete if no classes.
- vNext now: college-batch-retire-service.ts:24-56 archive planned only and block more dependencies.
- Fix: Get explicit owner signoff for archival product semantics.
