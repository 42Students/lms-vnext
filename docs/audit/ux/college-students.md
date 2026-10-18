# UX /college/students

- **Review / changes:** Audited shared CollegeRoleDirectoryWorkspace and learner scope delegation; no redundant form or title added at route level.
- **States:** Legacy copy, role scope and recovery choices preserved. Device/screen-reader/browser evidence pending.
- **Tests authored:** UX-college-students-01, UX-college-students-02. Tests not run in this connector.

## Loading and failure states

- Replaced manual placeholder layout with shared `Skeleton` shapes, including screen-reader loading announcements and reduced-motion support.
- Error fallback now uses `ErrorState` and shared secondary `Button` with a minimum 44px retry target, preserving the existing error copy.
- Added four source-level assertions in `tests/unit/UX-college-students-states-01.test.ts`; execution pending CI.
