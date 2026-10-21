# Work packet (wave 2): edit src/app/(authenticated)/hr/colleges/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-069  [P3] GAP  facet F14  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — /colleges response data, not CSV download.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:3-5 — Route redirects to home, no download.
- Fix: No export needed; restore visible list
