# Work packet (wave 3): edit src/db/schema/courses.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-18-003-022  [P1] MISSING  facet F04  effort L
- Legacy: Legacy course image from metadata.imageUrl/image_url preview. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:20-24`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-476`
- vNext now: vNext normalized courses schema does not include old metadata image URL in row. `src/db/schema/courses.ts:34-61`, `src/modules/courses/college-course-catalogue-service.ts:52-58`
- Fix: Add authorized course cover image field/link and render in table and creation form.

## G2-18-003-041  [P1] MISSING  facet F06  effort L
- Legacy: Legacy Visible to students Switch ON default, warning when hidden. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:549-554`
- vNext now: vNext Create course has no visibility state; new status ACTIVE by default. `src/modules/courses/validation.ts:28-45`, `src/db/schema/courses.ts:51-54`
- Fix: Provide create-time visible switch and equivalent warning, map OFF to hidden status without deleting.

## G2-18-003-106  [P1] MISSING  facet F21  effort L
- Legacy: Legacy media storage Cloudflare R2 presign with image key cleanup. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:11-12`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`
- vNext now: vNext course data lacks image upload integration. `src/db/schema/courses.ts:34-61`, `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: Use vNext signed URL storage abstraction and migrate cover URLs securely.

## G2-18-003-112  [P1] MISSING  facet F22  effort L
- Legacy: Legacy course image URL metadata and In-this-Course heading absent from vNext courses schema. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:20-24`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-84`
- vNext now: vNext courses table lacks fields, though holds cardColor/takeaways. `src/db/schema/courses.ts:34-61`
- Fix: Add image asset FK/metadata and intro heading, or document intentional removal and UI replacement.

## G2-4-019-038  [P1] MISSING  facet F10  effort L
- Legacy: Legacy startNewAttempt inserts next attempt rows immediately, copying duration and zeroing progress. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:45-80`)
- vNext now: New no start-attempt mutation or multiattempt PK support. (`src/db/schema/courses.ts:501-519`)
- Fix: Add atomic INSERT SELECT or equivalent transactional retake initializer.
