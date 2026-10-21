# Work packet: edit src/app/(authenticated)/hr/colleges/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-006  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — /colleges returns college summary + placement contact/branches.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:3-5; src/app/(authenticated)/hr/home/page.tsx:58-72 — Chooser shows name/code/grant, lacks dedicated rich section.
- Fix: Restore Colleges view sections
