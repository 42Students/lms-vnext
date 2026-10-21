# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-18/learner-calendar.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-18/learner-calendar.md

## G2-18-006-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy DTO contains int classScheduleId/classId/facultyId/courseId/hallId, strings start/end/courseSlug (`ClassIdAndDateRangeResponse.java:8-19`).
- vNext now: New UUID session/section/delivery fields, status/description/location/facultyName (`page.tsx:28-43`).
- Fix: Add documented field crosswalk to match displayed fields.

## G2-18-006-043  [P2] GAP  facet F13  effort M
- Legacy: Old 7+21 skeleton grid and `Loading class schedule` live region (`ClassScheduleContent.jsx:326-355`).
- vNext now: New generic directory loading (`loading.tsx:1-6`).
- Fix: Recreate old grid skeleton and aria-busy.

## G2-18-006-058  [P2] GAP  facet F18  effort S
- Legacy: Old error `Calendar events may be incomplete. Please try refreshing the page.` (`ClassScheduleContent.jsx:389-396`).
- vNext now: New page-level error adds this even for full schedule error (`error.tsx:15-16`).
- Fix: Show exact sentence only in partial ancillary course-data error.
