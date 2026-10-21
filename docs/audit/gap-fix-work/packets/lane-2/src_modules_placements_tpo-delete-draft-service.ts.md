# Work packet: edit src/modules/placements/tpo-delete-draft-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-3-015-023  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:156-158`
- vNext now: `src/modules/placements/tpo-delete-draft-service.ts:31-36`, `src/modules/placements/job-service.ts:759-765`
- Fix: Legacy softDeleteById sets isActive false,isDeleted true,version+1 on any matching ID; vNext archives DRAFT or stops nonpublished under guarded lifecycle. Reconcile deletion policies including published-with-applications.

## G2-3-015-042  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:29-39`, `148-171`
- vNext now: `src/modules/placements/job-service.ts:478-487`, `src/modules/placements/tpo-delete-draft-service.ts:31-36`
- Fix: Legacy pessimistic row lock + version increment closes apply/delete race; vNext has for-update locks and timestamp tokens but different lifecycle archive semantics. Prove no application after archive with one atomic transaction.

## G2-3-015-019  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:148-158`
- vNext now: `src/modules/placements/tpo-delete-draft-service.ts:27-43`
- Fix: Legacy delete returns int modified rows and caller handles status; vNext produces typed placement service error/stale version. Map user-facing conflict wording and retry semantics.

## G2-3-023-014  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:88-95`
- vNext now: `src/modules/placements/tpo-delete-draft-service.ts:12-40`
- Fix: Legacy deletion rejects in-use/non-draft jobs; VNext archives empty drafts and reports typed stale version. Preserve contextual conflict.
