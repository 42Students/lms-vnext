# Work packet: edit src/modules/placements/tpo-drive-deadline-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-2/admin-job-controller.md

## G2-19-011-051  [P1] GAP  facet F20  effort L
- Legacy: Legacy stale ORM job.save race with deadline edit not explicitly CAS-guarded here `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- vNext now: vNext deadline extension uses expectedUpdatedAt CAS and PUBLISHED guard `src/modules/placements/tpo-drive-deadline-service.ts:33-52`
- Fix: Scheduled update must condition on current deadline+status to avoid closing just-extended drive.

## G2-2-016-099  [P2] GAP  facet F08  effort S
- Legacy: Deadline success `Deadline extended`, failure `Failed to extend deadline` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:385-397`
- vNext now: New returns update timestamp and applicationDeadline; no legacy reason string `src/modules/placements/tpo-drive-deadline-service.ts:53-60`
- Fix: Show success/failure toast with exact resolved deadline and retry
