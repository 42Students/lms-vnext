# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-11/recruiter-drives-index.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md

## G2-11-003-053  [P2] GAP  facet F10  effort S
- Legacy: Legacy list GET /api/v1/recruiter/colleges/:collegeId/drives `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:66`
- vNext now: Legacy controller returns all own jobs; vNext uses scoped DB search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:117`
- Fix: Map status/count contract
