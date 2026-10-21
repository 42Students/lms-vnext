# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/r2-storage-utils.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/r2-storage-utils.md

## G2-20-009-023  [P1] GAP  facet F08  effort M
- Legacy: Legacy upload success gives URL immediately; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:102-124`
- vNext now: New complete may enter VERIFYING and not serve file until scan clean; `docs/architecture/file-and-video-apis.md:10-12,25-29`
- Fix: Show 'Checking file' state and prohibit user opening pending file; scanner dependency must be operational for prod.

## G2-20-009-038  [P1] GAP  facet F13  effort L
- Legacy: Legacy public URL can render immediately post-upload; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:102-125`
- vNext now: Production file may remain VERIFYING/PROCESSING indefinitely until scanner; `docs/architecture/file-and-video-apis.md:10-12,25-31`
- Fix: Treat scanner readiness as launch dependency and show pending/failed/quarantined states.
