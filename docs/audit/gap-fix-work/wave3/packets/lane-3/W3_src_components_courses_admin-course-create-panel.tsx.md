# Work packet (wave 3): edit src/components/courses/admin-course-create-panel.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-18-003-039  [P1] MISSING  facet F06  effort L
- Legacy: Legacy image Upload uses `image/*` and async presigned R2 pipeline. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-253`
- vNext now: vNext mapped Course step no equivalent image uploader. `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: Implement signed asset upload flow, image preview, removal, error/rollback.

## G2-18-003-065  [P1] MISSING  facet F10  effort L
- Legacy: Legacy R2 upload uses presigned object key; old image cleanup async on successful edit. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-375`
- vNext now: vNext mapped course actions have no equivalent upload call. `src/components/courses/admin-course-create-panel.tsx:173-225`, `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Use new signed URL storage adapter, same size/type validations, cleanup only after new image saved.

## G2-18-003-083  [P1] MISSING  facet F14  effort L
- Legacy: Legacy image upload accepts image/*, previews, replace/remove via R2 presign. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`
- vNext now: vNext lacks image transfer UI on mapped course create/action. `src/components/courses/admin-course-create-panel.tsx:173-225`, `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Implement signed image upload with size/type, scan/approval, replacement and failure rollback.

## G2-18-003-106  [P1] MISSING  facet F21  effort L
- Legacy: Legacy media storage Cloudflare R2 presign with image key cleanup. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:11-12`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`
- vNext now: vNext course data lacks image upload integration. `src/db/schema/courses.ts:34-61`, `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: Use vNext signed URL storage abstraction and migrate cover URLs securely.

## G2-3-008-015  [P1] MISSING  facet F04  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-88`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:305-332`
- Fix: Legacy course image upload/preview/change/remove and Card colour are on College Admin form, vNext image field missing entirely and colour field restricted to Super Admin.

## G2-3-008-016  [P1] MISSING  facet F04  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:52-74`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:305-332`
- Fix: Legacy Short display name, Official course code, In this Course heading, Description, Takeaways mandatory or optional fields on college form; new shortTitle/officialCode/takeaways restricted to Super Admin, heading removed.

## G2-3-008-030  [P1] MISSING  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-88`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:293-338`
- Fix: Legacy presigned image upload input accepts image/* and stores R2 public URL; vNext course create has no image upload UI or media payload.

## G2-3-008-047  [P1] MISSING  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-253`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:190-205`
- Fix: Legacy uploadFileViaPresign folder course-images then old R2 key clean-up on successful edit; vNext no media API used in college create/edit.

## G2-3-008-059  [P1] MISSING  facet F14  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-85`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:293-338`
- Fix: Legacy image/* upload via R2 presign and remove preview; no file input/uploader in new college authoring.
