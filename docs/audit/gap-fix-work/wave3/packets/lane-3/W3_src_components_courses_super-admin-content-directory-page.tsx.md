# Work packet (wave 3): edit src/components/courses/super-admin-content-directory-page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md

## G2-19-002-024  [P1] MISSING  facet F05  effort L
- Legacy: Legacy drag handle supports pointer/touch/keyboard and activation constraints `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:69-82` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:934-938`
- vNext now: vNext article list and actions without reorder control `src/components/courses/super-admin-content-directory-page.tsx:134-163`
- Fix: Implement persisted section content order drag/keyboard operation with announcements and guard.

## G2-19-002-029  [P1] MISSING  facet F06  effort L
- Legacy: Legacy content type selector offers VIDEO and YOUTUBE in Video tab `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:96-100` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:124-126`
- vNext now: vNext Videos authoring `modes={VIDEOS:['YOUTUBE']}` and binary video upload explicitly disabled `src/components/courses/super-admin-content-authoring.tsx:10` `src/components/courses/super-admin-content-directory-page.tsx:89-91`
- Fix: Implement safe Super Admin video upload after secure uploader/actor storage prerequisites.

## G2-19-002-053  [P1] MISSING  facet F10  effort L
- Legacy: Legacy class order PUT `/api/v1/lesson/contents/class-content-order` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:617-632` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:949-956`
- vNext now: vNext directory only content item mutation; no reorder integration `src/components/courses/super-admin-content-directory-page.tsx:153-163`
- Fix: Expose delivery order mutation in Super Admin selected-section view.

## G2-19-002-076  [P1] MISSING  facet F17  effort L
- Legacy: Legacy drag keyboard hint explicit Space/arrows/Space and touch/pointer sensors `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:75-82` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:934-938`
- vNext now: vNext list no reorder or instructions `src/components/courses/super-admin-content-directory-page.tsx:134-163`
- Fix: Implement focusable handle, screenreader instructions, keyboard order and result announcements.
