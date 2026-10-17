# College Projects — chat-9 source verification (round 3)

Tests are authored but **not executed** by this builder. Orchestrator must run unit and DB integration suites.

| ID | Status | Evidence (path and gap-named test) |
|---|---|---|
| COL-projects-03 | OPEN | Admin Overview and resource edits exist, Sprint/Task plan editing still Mentor-gated; `src/components/projects/project-workspace.tsx`, `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-03 confirms admin Overview and Resources editors but leaves Sprint/Task plan parity open` |
| COL-projects-06 | DONE | `src/components/projects/class-team-workspace-creator.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-06 creates one workspace per student only after scoped cohort preflight and confirmation` |
| COL-projects-07 | DONE | `src/components/projects/project-create-control.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-07 permits primary mentor, class, ACTIVE status and learner selection at creation` |
| COL-projects-12 | DONE | `src/components/projects/project-admin-readiness-page.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-12 exposes active readiness overrides with CSV and workspace management` |
| COL-projects-13 | DONE | `src/components/projects/project-admin-submissions-page.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-13 restores submission summary counters, revision fields and direct review controls` |
