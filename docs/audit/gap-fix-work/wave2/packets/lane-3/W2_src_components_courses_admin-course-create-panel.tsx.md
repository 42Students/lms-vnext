# Work packet (wave 2): edit src/components/courses/admin-course-create-panel.tsx

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-19-027-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy duplicate uses create modal populated from original with image metadata, parent/date values preserved; Courses.js:4-11,240-300
- vNext now: vNext duplicate link `?duplicate={UUID}` prefill in AdminCourseCreatePanel for name/code/description/partial metadata; admin-course-actions.tsx:131-142; admin-course-create-panel.tsx:99-135
- Fix: Compare full duplicated metadata including image/shortTitle and reset unique code; never duplicate internal tenant IDs.

## G2-12-003-013  [P2] MISSING  facet F03  effort S
- Legacy: Hidden from students warning shown when visible switch off `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-95`
- vNext now: No course-level visible switch or hidden warning in creator `src/components/courses/admin-course-create-panel.tsx:294-334`
- Fix: Restore per-course visible toggle state

## G2-12-003-022  [P2] GAP  facet F06  effort S
- Legacy: Department searchable select, rule `Select a department`, placeholder `Select department` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:41-45`
- vNext now: Native select `Select Department` with browser required `src/components/courses/admin-course-create-panel.tsx:293-300`
- Fix: Add searchable picker and exact casing

## G2-12-003-025  [P2] GAP  facet F06  effort S
- Legacy: Official course code optional max40, placeholder e.g. CS101 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-61`
- vNext now: Optional official code max64, no placeholder `src/components/courses/admin-course-create-panel.tsx:310-313`
- Fix: Use exact placeholder and 40-char limit

## G2-12-003-028  [P2] GAP  facet F06  effort S
- Legacy: `In this Course – Takeaways` ordered point editor with add/remove/reorder `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:72-75`
- vNext now: Plain multiline Textarea max2000 `src/components/courses/admin-course-create-panel.tsx:314-317`
- Fix: Restore ordered takeaways editor and list storage

## G2-12-003-030  [P2] GAP  facet F06  effort S
- Legacy: Card colour HTML color picker defaults through form `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:86-89`
- vNext now: Hex text input maxlength7 `src/components/courses/admin-course-create-panel.tsx:319-323`
- Fix: Restore color swatch/picker UI

## G2-12-003-032  [P2] GAP  facet F06  effort S
- Legacy: Create button disabled when departments unavailable or upload busy `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:550-555`
- vNext now: Disabled on pending/missing form fields but no upload gating `src/components/courses/admin-course-create-panel.tsx:282-335`
- Fix: Restore explicit lookup/image disabled gating

## G2-12-003-047  [P2] GAP  facet F10  effort S
- Legacy: Create ref avoids double submission; reset maintains department selection `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:255-281`
- vNext now: useGuardedAction pending; successful create resets fields including code `src/components/courses/admin-course-create-panel.tsx:173-207`
- Fix: Retain selected department after creation

## G2-12-003-062  [P2] GAP  facet F13  effort S
- Legacy: Department lookup outage with Retry and zero-department Go to Departments `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:519-524`
- vNext now: No-department text and link, but no isolated department retry `src/components/courses/admin-course-create-panel.tsx:282-287`
- Fix: Add explicit lookup retry

## G2-12-003-071  [P2] GAP  facet F17  effort S
- Legacy: Duplicate auto-scroll and focus input `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-316`
- vNext now: Duplication revealed in disclosure via query; no explicit auto-focus `src/components/courses/admin-course-create-panel.tsx:288-292`
- Fix: Focus new course form after duplicate

## G2-12-003-073  [P2] GAP  facet F18  effort S
- Legacy: `Official course code`, `In this Course – Heading/Description/Takeaways` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-75`
- vNext now: `Official course code (optional)`, `Description`, `Course takeaways (optional)` `src/components/courses/admin-course-create-panel.tsx:305-330`
- Fix: Restore exact legacy visible field labels

## G2-18-003-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy Create card includes duplicate notice, dept notice, error, fields, action in order. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-559`
- vNext now: vNext create panel implements multi-step Course/Offering/Delivery/Faculty wizard. `src/components/courses/admin-course-create-panel.tsx:173-270`
- Fix: Make first Course step replicate legacy form order; place new downstream steps after completion.

## G2-18-003-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy create button `Create Course` plus icon, disables on dept loading/error/none or image upload. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:549-558`
- vNext now: vNext create flow uses course setup Step1 form submission controls. `src/components/courses/admin-course-create-panel.tsx:170-270`
- Fix: Match CTA icon, text and disabled reasons; guard submit until upload complete.

## G2-18-003-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy duplicate button in row and info notice with Cancel copy; focuses first form input. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:500-504`
- vNext now: vNext duplicateHref via CourseActions and copied prefill from `?duplicate=uuid`. `src/components/courses/admin-course-actions.tsx:128-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Provide info banner, Cancel copy, scroll/focus first input after navigation.

## G2-18-003-054  [P2] GAP  facet F09  effort S
- Legacy: Legacy duplicate is not a modal; preloads Create form, scrolls/focus first field. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`
- vNext now: vNext duplicate navigates `?duplicate` and prefill; refresh may move focus unexpectedly. `src/components/courses/admin-course-actions.tsx:136-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Preserve focus and avoid resetting prefilled form on route changes.

## G2-18-003-087  [P2] GAP  facet F16  effort M
- Legacy: Legacy Create/Existing cards 10/14 columns lg, xs stacks; table x max-content. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-561`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-633`
- vNext now: vNext responsive overview filters/tables, separate wizard, min-h44 touch targets. `src/components/courses/admin-course-overview.tsx:100-161`, `src/components/courses/admin-course-create-panel.tsx:267-275`
- Fix: Clone 10/14 split at lg and table horizontal scrolling while retaining 44px touch.

## G2-18-003-089  [P2] GAP  facet F17  effort S
- Legacy: Legacy duplicate scrolls form into view then focuses first input. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`
- vNext now: vNext duplicate navigation prefill, no focus management in create component. `src/components/courses/admin-course-actions.tsx:136-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Focus first input and announce duplication on navigation.

## G2-18-003-094  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Create New Course` and `Existing Courses` card titles. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-561`
- vNext now: vNext course setup workflow and catalogue labels. `src/components/courses/admin-course-create-panel.tsx:267-275`, `src/components/courses/admin-course-overview.tsx:100-161`
- Fix: Use exact headings on first view and shift new wizard titles to secondary steps.

## G2-3-008-009  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-556`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:269-284`
- Fix: Legacy title `Create New Course` and directly visible form, vNext `Create Course and offering` disclosure, 4-step nav; retain legacy title/primary action.

## G2-3-008-029  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:72-75`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:305-332`
- Fix: Legacy Takeaways with structured CourseTakeawaysEditor; vNext college excludes them, Super Admin plain textarea max2000. Restore ordered-point editor.

## G2-3-008-064  [P2] MISSING  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-85`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:293-332`
- Fix: Legacy Image upload controls wrap at small screens and preview 100px, new none.

## G2-3-008-067  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-555`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:268-338`
- Fix: Exact copy `Create New Course`,`Create Course` and field labels `Course Name`,`Short display name`,`In this Course – Heading`, vNext `Create Course and offering`,`Code`,`Description`.

## G2-3-008-069  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:519-524`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:283-287`
- Fix: Old link `Go to Departments` and no-departments description, new similar but different punctuation/copy; align exact.

## G2-18-003-032  [P3] GAP  facet F06  effort S
- Legacy: Legacy required Department label, searchable Select; exact error `Select a department`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:41-45`
- vNext now: vNext department native Select with UUID and permission scope. `src/components/courses/admin-course-create-panel.tsx:94-100`, `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: Retain searchability and exact message; do not allow out-of-scope dept values.

## G2-18-003-033  [P3] GAP  facet F06  effort S
- Legacy: Legacy Course Name required max255 placeholder `e.g., Data Structures and Algorithms`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-49`
- vNext now: vNext courseName schema max255, Course step Input. `src/modules/courses/validation.ts:11-15`, `src/components/courses/admin-course-create-panel.tsx:111-115`, `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: Use exact placeholder and client message `Enter a course name`.
