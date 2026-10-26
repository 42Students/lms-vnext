# Faculty prototype #03 — Courses

**Newest design authority:** user-supplied `42LMS pages prototype-png-faculty.zip`, screenshot `Faculty › Courses.png` (not an AI-generated design).

**Functional state:** corrections committed to `main`; wait for the dedicated Faculty Courses acceptance workflow before calling it code-accepted. **Visual pixel-level acceptance remains separately deferred.**

## Screenshot comparison vs implemented page

| Prototype contract | Code evidence | Disposition |
| --- | --- | --- |
| Faculty navigation rail, 58px topbar, white page, 34px desktop content inset | `src/components/shell/faculty-prototype.css`, existing Faculty navigation | Retained |
| Courses title and 'N courses you teach this semester, M classes' subtitle | `faculty-prototype-course-directory.tsx`, actual authorized teaching grants grouped by course and academic period | Implemented |
| Right search and semester selector, initial most-recent visible period | Courses directory client controls; choose a specific academic period or All academic periods | Implemented |
| All / Regular / Electives segmented count pills | live course/period counts, accessible pressed state | Implemented |
| Course table: Course, Classes, To do, Attendance, Open | JSX table, visible above existing Advanced detailed card view | Implemented |
| Course metadata, linked class names | Group active teaching deliveries; preserve per-class navigation with authenticated delivery IDs | Implemented, stronger than static image |
| Red pending-grade pill, amber draft-to-publish pill, green nothing waiting | Existing authorized assignment and course summaries | Retained |
| '88% this month' style attendance column | Replaces former bare 'View' link. `facultyCourseMonthAttendanceEvidence` uses the authenticated attendance service, active learner roster, **marked** held sessions in IST calendar month; combines weighted numerator/denominator across classes; pending/unmarked sessions don't contribute | Implemented, dynamic percentages only |
| Open in outlined button | Secondary outlined link navigates to `/teacher/courses/[authorizedDeliveryId]/home` | Implemented |
| Attendance cell remains a link | Navigates to the detailed faculty attendance route, preserving better vNext functionality | Retained |
| Not-assigned teaching scope | The advanced course list and teaching diagnostics remain accessible; this page cannot display courses outside current teaching authority. Do not fabricate an unassigned course row | Known intentional scope behavior |
| Search, filters, mobile layout and authenticated deep links | `tests/e2e/faculty-courses-prototype.spec.ts` | CI pending |
| Historical absence-only attendance, future/unmarked exclusions, duplicate exception records | `tests/unit/faculty-course-month-attendance-model.test.ts` | CI pending |

## Source-of-truth behavior

- The screenshot shows **sample** courses and figures: Data Structures & Algorithms (88%), Database Management Systems (91%), Machine Learning (79%). vNext **does not hardcode** these reference figures.
- Monthly attendance percentage is `present learner-session occurrences / eligible learner-session occurrences` among **marked** sessions in the **current IST month**. This uses the **current** authorized roster; it is not a historical reenrollment-adjusted metric, and no percentage is shown when unavailable. **LATE, ABSENT, EXCUSED and MEDICAL** rows count as exceptions, consistent with the existing Faculty student attendance metrics implementation.
- The legacy LMS `docs/legacy-source/frontend/src/pages/teacher/courses/index.js` renders the old shared `CoursesContent` grid. The 2026 uploaded screenshot supersedes its design. The detailed vNext legacy-style cards and diagnostics stay under Advanced rather than being deleted.

## Gate
1. Dedicated `.github/workflows/faculty-courses-prototype-acceptance.yml`: TypeScript (Node 6144MB), pure attendance model unit tests, disposable-PostgreSQL authenticated Chromium desktop/mobile.
2. Legacy `tests/e2e/faculty-courses.spec.ts` remains in the generic browser suite; preserve its search empty-state wording and deep links.
3. Side-by-side rendered screenshot with uploaded #03 is **still needed** to certify exact visual spacing and typography.

**Do not mark fully complete without passing CI plus the separate eventual visual acceptance.**
