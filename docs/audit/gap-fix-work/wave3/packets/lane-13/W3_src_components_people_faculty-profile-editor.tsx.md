# Work packet (wave 3): edit src/components/people/faculty-profile-editor.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-037  [P1] MISSING  facet F06  effort L
- Legacy: Legacy profile image updated via upload and Drive/link import (`docs/legacy-source/frontend/src/components/profile/about.js:830-878`, `docs/legacy-source/frontend/src/components/profile/userInfo.js:105-117`)
- vNext now: No profile photo control on teacher/profile or details (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`, `src/components/people/faculty-profile-editor.tsx:73-135`)
- Fix: Port profile-image upload/presign and optional link import with old-key cleanup
