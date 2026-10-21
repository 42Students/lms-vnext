# Work packet (wave 3): edit src/app/api/people/faculty-self-document/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-053  [P1] MISSING  facet F10  effort L
- Legacy: Legacy profile image change PUT header plus R2 old image cleanup (`docs/legacy-source/frontend/src/components/profile/about.js:830-878`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:204-215`)
- vNext now: New summary read-only and no image mutation or R2 cleanup (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`, `src/app/api/people/faculty-self-document/route.ts:10-29`)
- Fix: Implement scoped upload, header mutation, old-object cleanup and audit attribution

## G2-20-030-082  [P1] MISSING  facet F21  effort L
- Legacy: Legacy uses profile uploadToR2 presign and asynchronous superseded-object delete (`docs/legacy-source/frontend/src/components/profile/about.js:830-878`)
- vNext now: New self-document patch has no R2 integration or file cleanup (`src/app/api/people/faculty-self-document/route.ts:16-27`, `src/modules/people/faculty-self-section-model.ts:25-30`)
- Fix: Restore storage workflow with tenant signing and eventual old-object cleanup
