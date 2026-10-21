# Work packet (wave 2): edit src/modules/electives/college-slot-mutation-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-4-024-042  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST/PUT /slots and POST /archive use ElectiveService and GroupActor (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:89-114`)
- vNext now: New POST/PATCH routes and college-slot mutation service write slot + immutable activity (`src/app/api/academics/elective-slots/route.ts:9-24`; `src/modules/electives/college-slot-mutation-service.ts:64-111,114-160`)
- Fix: Map archive and edit route/payload exactly, keep auditable new mutations.
