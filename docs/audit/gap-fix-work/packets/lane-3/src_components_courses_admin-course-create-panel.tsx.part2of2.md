# Work packet: edit src/components/courses/admin-course-create-panel.tsx (part 2 of 2)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-3-008-033  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:41-71`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:293-332`
- Fix: Legacy precise error texts `Select a department`,`Enter a course name`,`Maximum 255 characters`,`Enter the heading`; native required validation differs in new forms.

## G2-3-008-034  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:519-525`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:283-287`
- Fix: Legacy error `Departments could not be loaded` with Retry and `No departments in this college yet`, new no data message lacks distinct API failure + Retry.

## G2-3-008-038  [P2] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-225`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:190-205`
- Fix: Old image upload displays success `Image uploaded successfully` or `Failed to upload image`, vNext has no course media uploader/toasts.

## G2-12-003-041  [P3] GAP  facet F08  effort S
- Legacy: Duplicate info `Duplicating “X” — review the copy before creating it.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:312-312`
- vNext now: Inline duplication info with different details; no info toast `src/components/courses/admin-course-create-panel.tsx:288-292`
- Fix: Match duplicate notice wording/channel

## G2-18-003-049  [P3] GAP  facet F08  effort S
- Legacy: Legacy duplicate starts `Duplicating “NAME” — review the copy before creating it.` info toast. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`
- vNext now: vNext duplicate href prefills via URL, no explicit info toast apparent. `src/components/courses/admin-course-actions.tsx:136-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Show duplicate intro toast and Cancel copy button with focus management.

## G2-18-003-050  [P3] GAP  facet F08  effort S
- Legacy: Legacy create success exact `Created course “NAME”.`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:255-305`
- vNext now: vNext creation toast/title tied to Course setup workflow. `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: Use exact message on first Course creation step.
