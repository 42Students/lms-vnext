# Work packet: NEW / MISSING items from docs/audit/gap2/lane-15/u001-teacher-courses.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u001-teacher-courses.md

## G2-15-001-002  [P1] GAP  facet F01  effort M
- Legacy: Course card targets `/teacher/courses/{slug\|\|id}/home?cls={classId}` and adds `ref=course` absent slug (courseListingUtils.js:7-30).
- vNext now: Card uses `/teacher/courses/{deliveryId}/home` with no `cls` or `ref` (faculty-course-list.tsx:131-136).
- Fix: Ensure legacy bookmarks/slug and cls links redirect to the exact authorized delivery; document mapping and 404 behaviour.

## G2-15-001-003  [P1] GAP  facet F01  effort M
- Legacy: Course click dispatches CourseID and optional classId to Redux (CoursesContent.jsx:73-81,551-553).
- vNext now: Course link alone navigates by delivery ID, no per-click store mutation (faculty-course-list.tsx:131-137).
- Fix: Verify all workspace descendants derive selected course/class from delivery scope; bridge any legacy-dependent navigation state.

## G2-15-001-018  [P1] GAP  facet F05  effort M
- Legacy: Section grouping key uses `class_id` else batch/year/section fallback (courseListingUtils.js:33-36).
- vNext now: Filter uses strictly UUID `sectionId` (faculty-course-list-model.ts:7-9,26-31).
- Fix: Map legacy mixed section references to scoped IDs and show fallback grouping for incomplete records.

## G2-15-001-032  [P1] GAP  facet F07  effort M
- Legacy: Other fetch failures display `Failed to load courses. Please try again.` and `Try again` button (CoursesContent.jsx:158-160,442-448).
- vNext now: No try-again banner or specific error wording in route (page.tsx:10-39); only invalid filter alert (page.tsx:15-24).
- Fix: Add recoverable route error boundary with exact wording and retry action.

## G2-15-001-044  [P1] GAP  facet F12  effort M
- Legacy: Active means `is_active=true` and `is_deleted=false OR null`; sort stable by IDs (FacultyTeachingAssignmentRepository.java:41-47).
- vNext now: Active means endedAt NULL, active offering/course/section plus active membership/user (faculty-course-service.ts:103-126,177-201).
- Fix: Map old is_active/is_deleted flags during any parity proof; explain lifecycle exclusions and role effects.

## G2-15-001-069  [P1] GAP  facet F23  effort M
- Legacy: Legacy role/student fields, semester/year, dynamic image and corruption diagnostics are visible on card (CoursesContent.jsx:483-485,512-542).
- vNext now: Omitted/changed in vNext; status, content summary and filters added (faculty-course-list.tsx:83-114,139-195).
- Fix: Make owner-approved decision matrix: legacy visible fields restore vs intentional vNext additions; do not silently discard diagnostics.
