# Work packet: edit src/modules/placements/public-join/preview-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-8-026-040  [P1] GAP  facet F12  effort M
- Legacy: Legacy token may be long-lived until rotated/disabled; no expiresAt in live lookup (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:232-238).
- vNext now: New requires expiresAt NOT NULL and future in preview/send/join (src/db/schema/placement-public-joins.ts:17-20; src/modules/placements/public-join/preview-service.ts:25-27).
- Fix: Decide retirement/rotation of valid legacy unlimited links rather than expiring imported links silently.
