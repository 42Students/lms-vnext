# Work packet (wave 2): edit src/components/courses/admin-course-actions.tsx (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/course-home-edit-drawer.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-6-009-014  [P2] GAP  facet F06  effort S
- Legacy: Old second field `Course_info`, placeholder `Enter Course Info` `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:51-69`
- vNext now: New description Textarea uses new field naming and no documented placeholder `src/components/courses/admin-course-actions.tsx:93-98` `src/components/courses/admin-course-actions.tsx:193-220`
- Fix: Restore exact capitalization/placeholder in home drawer where used

## G2-6-009-021  [P2] GAP  facet F09  effort S
- Legacy: Old Edit is a DrawerWidget not Modal, right, 352px, supports X and footer `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:18-29`
- vNext now: New editing uses Dialog titled Edit Course `src/components/courses/admin-course-actions.tsx:143-149`
- Fix: Restore original right-edge width and footer for precise legacy look

## G2-6-009-031  [P2] GAP  facet F16  effort S
- Legacy: Old DrawerWidget comment `custom width and size are not applicable in mobile view` `docs/legacy-source/frontend/src/components/Global/RightDrawer/DrawerWidget.js:5-5`
- vNext now: New centered Dialog with mobile responsive button controls `src/components/courses/admin-course-actions.tsx:143-189`
- Fix: Verify drawer full-width on phone and correct footer stacking at 375px

## G2-6-009-034  [P2] GAP  facet F18  effort S
- Legacy: Old labels `Course title`, `Course info` `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:35-52`
- vNext now: New label uses course name catalog and description field `src/components/courses/admin-course-actions.tsx:193-220`
- Fix: Exact case and spelling in Course Information drawer

## G2-6-009-035  [P2] GAP  facet F18  effort S
- Legacy: Old buttons `Cancel`, `Save`, drawer heading `Course Information` `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:18-29`
- vNext now: New Cancel/Save match but heading Edit Course `src/components/courses/admin-course-actions.tsx:143-189`
- Fix: Change only heading if exact visual clone approved

## G2-12-003-043  [P3] GAP  facet F09  effort S
- Legacy: Dirty modal cancellation confirms Discard unsaved course changes? with detailed course name `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:342-353`
- vNext now: Dirty-confirm same title but no named course explanation `src/components/courses/admin-course-actions.tsx:101-109,250-252`
- Fix: Restore named content and danger styling

## G2-18-003-040  [P3] GAP  facet F06  effort S
- Legacy: Legacy card colour accepts `#RRGGBB`, validation `Use a colour like #0a7c88`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:86-89`
- vNext now: vNext regex same 6 HEX digits, nullable, but control is plain input. `src/modules/courses/validation.ts:25-25`, `src/components/courses/admin-course-actions.tsx:213-220`
- Fix: Use color input and exact error copy.

## G2-18-003-095  [P3] GAP  facet F18  effort S
- Legacy: Legacy `Course Name`, `Short display name`, `Official course code` with specific helper/placeholder. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-61`
- vNext now: vNext name/code/shortTitle/officialCode fields but separate copy/length constraints. `src/components/courses/admin-course-actions.tsx:195-230`
- Fix: Match exact labels and helper text, preserve new validation only where product-approved.
