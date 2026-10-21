# Work packet (wave 2): edit src/components/courses/college-learning-directory.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/lessons.js:27-31 — Wraps Lessons in AdminGroupShell `groupKey=content`, AdminLayout.
- vNext now: src/components/courses/college-learning-directory.tsx:31-43 — PageHeader with eyebrow and Course offerings link; separate vNext shell.
- Fix: Map legacy group breadcrumbs/menu/visible shell exactly rather than adding an eyebrow.

## G2-17-007-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:407-434 — Single `Lessons` h1, left Create New Lesson card (lg 10/24), right Lessons table card (lg 14/24).
- vNext now: src/components/courses/college-learning-directory.tsx:31-44 — Header, prepended action strip, advanced filter form and records section in vertical sequence.
- Fix: Replicate legacy two-column order/responsive widths without losing vNext fields.

## G2-17-007-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-455 — Table toolbar and course selector sit inside Lessons card heading and before rows.
- vNext now: src/components/courses/college-learning-directory.tsx:44-54 — Search and long advanced filter area precede results; no matching embedded card header.
- Fix: Match legacy card toolbar grouping and control placement.

## G2-17-007-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:450-457 — `View all courses (slower)` with caution about four-at-a-time API requests.
- vNext now: src/components/courses/college-learning-directory.tsx:191-201 — Course chooser has `All courses` option in advanced filters.
- Fix: Preserve discoverable explicit all-course opt-in or communicate server paging scope.

## G2-17-007-012  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:21-31 — Fallback lesson title is `Untitled lesson`; sequence sort based on courseId, sequence, id.
- vNext now: src/components/courses/college-learning-directory.tsx:609-621 — Uses saved `item.name` and `sequence+1` per offering.
- Fix: Define missing-title fallback and match ordering display or document normalized path numbering.

## G2-17-007-013  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:395-399 — Columns: Lesson Name, Course, computed Order, Students see it; visible derives `active && enabled`.
- vNext now: src/components/courses/college-learning-directory.tsx:609-627 — Course shows course code/cohort/period, and visibility uses `visibleToStudents` plus archived status.
- Fix: Document transformed fields; preserve legacy Visible/Hidden calculations at migration boundary.

## G2-17-007-017  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:221-225 — Client substring search only lesson name, trimmed and case-insensitive.
- vNext now: src/components/courses/college-learning-directory.tsx:45-50 — GET query searches course or lesson and maxLength 100.
- Fix: Make legacy lesson-only search available and clarify expanded global search.

## G2-17-007-020  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:509-524 — Client table paginates current loaded list; disables pagination during reorder.
- vNext now: src/components/courses/college-learning-directory.tsx:661-676 — Server URL pagination with page jumping; no corresponding reorder-mode switch.
- Fix: Preserve long-list page reordering semantics and visible pagination when not reordering.

## G2-17-007-062  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:410-434 — AntD grid uses full width xs and split lg=10/14.
- vNext now: src/components/courses/college-learning-directory.tsx:44-54 — Search uses grid plus md columns; create action separate.
- Fix: Mirror 992px two-panel breakpoint, widths and gutters.

## G2-17-007-063  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:509-519 — Wide small table scrolls horizontally (`x:max-content`), not cards.
- vNext now: src/components/courses/college-learning-directory.tsx:568-603 — Mobile collapses into article cards; desktop table at md.
- Fix: Validate mobile card deviation against legacy horizontal-scrolling table requirement.

## G2-17-007-066  [P2] MISSING  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:399-403 — Action buttons have ARIA labels `Edit lesson {name}`, `Delete lesson {name}`.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — No corresponding named action controls.
- Fix: Add labelled accessible edit/delete actions.

## G2-17-007-071  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:524-526 — Empty prompt `Choose a course, or opt in to all-courses view.`
- vNext now: src/components/courses/college-learning-directory.tsx:560-565 — `No persisted lessons match these filters...`
- Fix: Align no-course-selected prompt where filter selection is required.

## G2-17-007-076  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:246-252 — Saved selected course restored only if current college course list includes ID.
- vNext now: src/components/courses/college-learning-directory.tsx:191-201 — Selected course is GET query; direct user URL may request an unseen code.
- Fix: Guard inaccessible selected course and distinguish stale link from empty results.

## G2-17-007-068  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:409-412 — Visible heading `Lessons`; card heading `Create New Lesson`.
- vNext now: src/components/courses/college-learning-directory.tsx:24-35 — PageHeader uses `Lessons` plus `College Admin · Courses & Content` eyebrow.
- Fix: Remove eyebrow and restore card title position.

## G2-17-007-069  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-436 — Search placeholder `Search lessons`.
- vNext now: src/components/courses/college-learning-directory.tsx:47-50 — Placeholder `Search registered records`.
- Fix: Use legacy search placeholder or document broader search.

## G2-17-007-070  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:455-457 — All courses warning says one request/course, four at a time.
- vNext now: src/components/courses/college-learning-directory.tsx:191-201 — No corresponding warning text; server listing differs.
- Fix: Add accurate explanation of all-course selection and current backend behavior.
