# Work packet (wave 3): edit src/app/(authenticated)/teacher/profile/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-037  [P1] MISSING  facet F06  effort L
- Legacy: Legacy profile image updated via upload and Drive/link import (`docs/legacy-source/frontend/src/components/profile/about.js:830-878`, `docs/legacy-source/frontend/src/components/profile/userInfo.js:105-117`)
- vNext now: No profile photo control on teacher/profile or details (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`, `src/components/people/faculty-profile-editor.tsx:73-135`)
- Fix: Port profile-image upload/presign and optional link import with old-key cleanup

## G2-20-030-053  [P1] MISSING  facet F10  effort L
- Legacy: Legacy profile image change PUT header plus R2 old image cleanup (`docs/legacy-source/frontend/src/components/profile/about.js:830-878`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:204-215`)
- vNext now: New summary read-only and no image mutation or R2 cleanup (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`, `src/app/api/people/faculty-self-document/route.ts:10-29`)
- Fix: Implement scoped upload, header mutation, old-object cleanup and audit attribution

## G2-20-030-066  [P2] MISSING  facet F14  effort L
- Legacy: Legacy photo upload presigned R2 and import from URL (`docs/legacy-source/frontend/src/components/profile/about.js:830-878`, `docs/legacy-source/frontend/src/components/profile/userInfo.js:105-117`)
- vNext now: No photo import/upload action in vNext profile (`src/app/(authenticated)/teacher/profile/page.tsx:19-50`)
- Fix: Reinstate presigned upload and replacement cleanup
