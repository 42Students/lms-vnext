# Work packet: edit src/modules/courses/super-admin-content-directory-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-001  [P1] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:70-74 groups all types under /superadmin/lesson-content?type=video\|resources\|live-classes.
- vNext now: src/modules/courses/super-admin-content-directory-model.ts:21-34 splits into /admin/videos, /admin/resources and /admin/live-classes.
- Fix: Add redirects from legacy URL preserving type and relevant filters to separate new routes.

## G2-17-003-054  [P1] MISSING  facet F23  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:48-63 Video policy accessible with no college selected and separate resources/live component by query.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 returns early without policy; src/modules/courses/super-admin-content-directory-model.ts:21-34 separates page paths.
- Fix: Restore no-college global policy and add old deep-link alias.

## G2-19-002-016  [P1] GAP  facet F04  effort M
- Legacy: Legacy Students badge tests content `active!==false && enabled!==false` only `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:978-979`
- vNext now: vNext effective visible checks content PUBLISHED, lesson/path/offering/course states `src/modules/courses/super-admin-content-directory-model.ts:43-50` `src/components/courses/super-admin-content-directory-page.tsx:143-145`
- Fix: Explicitly present `Visible` vs effective visibility, preserve publish-ancestry security, explain divergent badges.

## G2-19-002-059  [P1] GAP  facet F12  effort M
- Legacy: Legacy video VIDEO and YOUTUBE creation alongside LIVE_CLASS, shared course/lesson selection `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:96-114` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1275-1301`
- vNext now: vNext kind-specific typed schema, Videos author only YOUTUBE `src/modules/courses/super-admin-content-directory-model.ts:17-20` `src/components/courses/super-admin-content-authoring.tsx:9-32`
- Fix: Implement full allowed content-kind transitions with equivalent authored types.

## G2-9-025-011  [P1] GAP  facet F03  effort M
- Legacy: Visible to students switch in editor, defaults true on creation `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:404-406`
- vNext now: New publishNow toggle and effective publish ancestry; no direct visible flag in SA editor `src/components/courses/faculty-lesson-authoring.tsx:118-119` `src/modules/courses/super-admin-content-directory-model.ts:43-51`
- Fix: Support explicit visibility state with correct published ancestry and audience.
