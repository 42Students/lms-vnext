# Work packet (wave 3): edit src/components/courses/admin-course-actions.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-18-003-065  [P1] MISSING  facet F10  effort L
- Legacy: Legacy R2 upload uses presigned object key; old image cleanup async on successful edit. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-375`
- vNext now: vNext mapped course actions have no equivalent upload call. `src/components/courses/admin-course-create-panel.tsx:173-225`, `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Use new signed URL storage adapter, same size/type validations, cleanup only after new image saved.

## G2-18-003-083  [P1] MISSING  facet F14  effort L
- Legacy: Legacy image upload accepts image/*, previews, replace/remove via R2 presign. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`
- vNext now: vNext lacks image transfer UI on mapped course create/action. `src/components/courses/admin-course-create-panel.tsx:173-225`, `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Implement signed image upload with size/type, scan/approval, replacement and failure rollback.

## G2-18-003-104  [P1] MISSING  facet F20  effort L
- Legacy: Legacy updating image asynchronously deletes old key only after successful update. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-375`
- vNext now: vNext lacking image update cannot preserve replacement rollback. `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Introduce versioned image replace and eventual old-key cleanup after commit.
