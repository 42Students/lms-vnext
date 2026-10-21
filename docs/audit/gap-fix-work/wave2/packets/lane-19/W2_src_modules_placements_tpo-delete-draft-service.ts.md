# Work packet (wave 2): edit src/modules/placements/tpo-delete-draft-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-3-015-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:148-171`
- vNext now: `src/modules/placements/tpo-delete-draft-service.ts:12-43`, `src/modules/placements/job-service.ts:740-766`
- Fix: Legacy deletes job by ID via isActive=false,isDeleted=true,version bump; vNext TPO draft delete accepts expected version and only DRAFT, archives row. Match caller-facing confirmation and reject unsupported delete.

## G2-3-015-034  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:99-112`
- vNext now: `src/modules/placements/job-service.ts:74-76`, `src/modules/placements/tpo-delete-draft-service.ts:19-22`
- Fix: Legacy deleted-inclusive org lookup returns stored job for history even after deletion, vNext archive lookup may fail active routes; preserve read-only archived history.

## G2-3-023-036  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:114-120`
- vNext now: `src/modules/placements/tpo-delete-draft-service.ts:12-43`
- Fix: Verify focus return after deleting a draft and error announcement for stale version.
