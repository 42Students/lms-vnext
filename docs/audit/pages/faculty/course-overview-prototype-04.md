# Faculty prototype #04 — Course Overview

**Design reference:** user-uploaded `42LMS pages prototype-png-faculty.zip` → `Course › Overview.png`. Current student count, course title and task numbers **must be live and authorized**, never copied from the screenshot.

**Current state:** **functionally accepted** on `main` via [Faculty Course Overview acceptance run 40284557334](https://github.com/42Students/lms-vnext/actions/runs/40284557334): real PostgreSQL acceptance and desktop/mobile Chromium checks **passed**. Exact screenshot pixel-level visual sign-off **not yet done**.

## Functional and layout crosscheck

| Screenshot feature | Source / outcome |
| --- | --- |
| Course header, section chooser, breadcrumb, five tabs | Existing `faculty-course-navigation` and `faculty-course-workspace`, retaining authorization by deliveryId |
| Left "Needs you · [section]" task queue | `faculty-prototype-course-priorities.tsx` with live pending assignment, published quiz deadline, unmarked attendance, scoped last-7-day discussion messages |
| Grade / quiz report / attendance / reply buttons | Real links to authorized detailed pages; existing better workflows retained |
| Right "About This Course" card | Changed from hidden disclosure into permanent desktop right-side card (mobile stack), backed by course metadata and authorized display description |
| Right "How the Class Is Doing" card | Changed from hidden disclosure into permanent card; live course progress, attendance current month, quiz average, behind count |
| Attendance this month | Derived in `faculty-course-home-service.ts` from current IST calendar-month marked class sessions, current scoped roster and persisted exceptions; unknown stays `—` |
| Quiz closing label | Use actual deadline *due* date, not misleading automatic closure (vNext deadline does not guarantee quiz status auto-close) |
| About course Edit | vNext "Details" link opens the existing advanced course information but is **not an authorized edit feature**; do not label as Edit without writable backend and policy |
| Existing advanced reports hub, student diagnostics, rich content | Retained in `FacultyCourseWorkspace` and advanced "More course insights and teaching tools" |
| Prototype positioning on desktop and mobile | `tests/e2e/faculty-course-overview.spec.ts` asserts side-by-side geometry on desktop and visible cards on mobile |

## Legacy and data guardrails

- Legacy shared course page `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js` remains useful for routing and feature behavior; newest uploaded Overview screenshot controls presentation.
- Marked sessions are the denominator; empty marked attendance-exception list means all currently enrolled learners attended; never show fake 0% for missing attendance.
- `quiz due` is intentional, avoids claiming automatic closing without a verified job.
- Core caveats before full signoff: rendered screenshot side-by-side review, edit-course authorization/design decision, and a separately documented pixel-level visual comparison.
