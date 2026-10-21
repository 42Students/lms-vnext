# Work packet (wave 2): edit src/app/api/placements/recruiter/profile/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:31-39 — Authenticated recruiter self API rooted /api/v1/recruiter; college-selected session.
- vNext now: src/app/api/placements/recruiter/profile/route.ts:8-17; src/app/api/placements/recruiter/profile/details/route.ts:8-18; src/app/api/placements/recruiter/bell/route.ts:7-20 — Functions split /api/placements/recruiter/* routes.
- Fix: Preserve matching public API contracts or add documented adapter
