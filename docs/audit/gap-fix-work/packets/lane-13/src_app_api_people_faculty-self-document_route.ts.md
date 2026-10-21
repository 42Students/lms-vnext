# Work packet: edit src/app/api/people/faculty-self-document/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-043  [P1] GAP  facet F10  effort L
- Legacy: `FacultyProfileController.java:191-807` ~50 GET/PUT/POST/DELETE methods for single and repeatable sections.
- vNext now: `faculty-self-document/route.ts:10-27` GET whole JSON document / PATCH one section, no direct index/delete endpoint.
- Fix: Define compatibility map for every legacy CRUD route/method to new document patch service and admin-authorized counterpart.

## G2-1-003-080  [P1] GAP  facet F23  effort L
- Legacy: `FacultyProfileController.java:191-807` permits college-admin reads/edits of other faculty except protected admin/TPO writes.
- vNext now: `faculty-self-document/route.ts:10-27` intentionally only own, read/write admin route limited academic fields.
- Fix: Secure admin-scoped editing gap is a separate required product decision, not merely UI polish.
