# Work packet: edit src/app/api/placements/recruiter/profile/details/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-030  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:231-231 — Null update body returns HTTP400 BODY_REQUIRED.
- vNext now: src/app/api/placements/recruiter/profile/details/route.ts:11-16 — readRecruiterJsonBody rejects missing/invalid with INVALID_REQUEST.
- Fix: Map error name/message exactly for API compatibility
