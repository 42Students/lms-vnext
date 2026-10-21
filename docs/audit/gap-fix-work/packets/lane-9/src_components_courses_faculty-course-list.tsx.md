# Work packet: edit src/components/courses/faculty-course-list.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u001-teacher-courses.md

## G2-15-001-011  [P1] GAP  facet F03  effort L
- Legacy: Orphan course or class displays warning `Incomplete assignment data`, unavailable image/card (CoursesContent.jsx:519-524,555-560).
- vNext now: List is inner-join based, so orphan rows are silently missing (faculty-course-service.ts:128-176; faculty-course-list.tsx:131-198).
- Fix: Fetch/report orphan assignment rows as disabled diagnostic cards rather than suppressing them.

## G2-15-001-015  [P1] GAP  facet F04  effort M
- Legacy: Fallback for nameless courses is `Course information unavailable` (courseListingUtils.js:139-159).
- vNext now: Inner joins enforce named course, no fallback card text (faculty-course-service.ts:143-148; faculty-course-list.tsx:148-150).
- Fix: Preserve visible diagnostic missing-name case and disable navigation.

## G2-15-001-049  [P1] GAP  facet F13  effort L
- Legacy: Malformed data warnings are visible instead of dropped; `Some course records have incomplete or duplicate information...` (CoursesContent.jsx:483-485).
- vNext now: All records inner-join authorized fields and no warning path (faculty-course-service.ts:128-176; faculty-course-list.tsx:47-205).
- Fix: Add diagnostic warning for suppressed/orphaned grant records with actionable administrator resolution.
