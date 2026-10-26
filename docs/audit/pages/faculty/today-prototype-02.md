# Faculty prototype #02 — Today

**Design authority:** user-uploaded `42LMS pages prototype-png-faculty.zip` → `Faculty › Today.png`. This is the 2026-10-26 Faculty screenshot, **not** an imagined mockup.

**Status:** **functionally accepted** (TypeScript + authenticated desktop/mobile E2E green at [Faculty Today acceptance run 40282276117](https://github.com/42Students/lms-vnext/actions/runs/40282276117), commit `884d2186268906e70dd6d8be7887631456245d20`). Pixel-level rendered-prototype comparison **remains unsigned**.

## Prototype-to-vNext verification

| Screenshot behavior | Current implementation / evidence | Status |
| --- | --- | --- |
| Fixed Faculty navigation and live Today / Assignments badges | `src/components/shell/faculty-prototype-navigation.ts`, `sidebar-nav.tsx`, `/api/courses/faculty/shell-counts`; Today badge now counts the actionable task categories rather than every event, accounts for marked attendance and learner messages | Code addressed; browser check pending |
| Date + college code, greeting and current priority count | `src/app/(authenticated)/teacher/page.tsx` reads identity, college code, task list and IST time | Code addressed |
| Relative next-class phrase with title, section and room | Same server page uses real next upcoming authorized event and relative minutes/hours | Code addressed |
| Full left priority queue with Grade / Take attendance / Reply / Open quiz and honest Later controls | `src/components/faculty/faculty-today-panel.tsx`; each action retains its authorized route; Later hides for this visit, with explicit undo | Code addressed; persistence not implied |
| Right-side Today's Classes and This Week visible on desktop | Old version hid both below a collapsed Details. Corrected to a 300px right rail, responsive stacked on mobile | Code addressed; rendered comparison pending |
| Classes show live times, section, room, learner size and attendance action | Server queries IST schedule and scoped attendance status; roster size retrieved through authorized delivery-roster service, or omitted if unavailable | Code addressed |
| Grade row shows number waiting and age of oldest | SQL counts ungraded submission records and oldest `submittedAt`, never sample values | Code addressed |
| Attendance task shows room, roster size and honest not-taken state | Current attendance session status is checked; an unavailable status is not presented as confirmed unmarked | Code addressed |
| Discussions task shows recent scoped student messages | Only learner posts from faculty-assigned deliveries in last 24h; **recent** is not mislabeled as **unread** without read receipts | Better than unsupported screenshot assumption |
| Draft quiz opens relevant quiz | Real owned draft quiz and `?content=...` deep link handled by all-Quizzes page | Code addressed |
| This Week shows assessment due date and hand-in progress | Bounded upcoming **published** assessments, scoped submission/quiz-attempt counts, and live eligible roster. `due` wording is intentional; vNext does **not** guarantee automatic quiz closure at its deadline | Code addressed |
| Desktop/mobile browser geometry, badge consistency and Later restoration | `tests/e2e/faculty-today.spec.ts` plus dedicated `.github/workflows/faculty-today-acceptance.yml` | **Browser + TypeScript passing; visual review pending** |

## Old LMS comparison

`docs/legacy-source/frontend/src/pages/teacher/index.js` only redirects a logged-in Faculty user to `/teacher/courses`; the **Today dashboard is new** in the uploaded screenshot. Reuse authorized lesson, grading, attendance and discussion services rather than inventing legacy Today behavior.

## Remaining verification and known limits

1. Dedicated Faculty Today CI **passed** on commit `884d2186` ([run 40282276117](https://github.com/42Students/lms-vnext/actions/runs/40282276117)): Node heap 6144MB, TypeScript, Chromium, disposable PostgreSQL and authenticated desktop/mobile E2E.
2. Capture a 1440px desktop and 390px mobile rendered page and compare side-by-side against the user-uploaded screenshot; typography, vertical rhythm, interactive header, and empty-data states are **not visually signed off**.
3. Later currently hides a task **for this visit**; it is not a persisted reminder. No notification-read cursor exists to truthfully call recent discussion posts 'unread'. Do not fabricate either behavior.
4. Prototype data such as 'Lakshmi', 62 learners, and 41 submissions is reference-only. Use persisted authorized data exclusively.

**Implementation commits:** `222b8d527`, `bb7463534`, `97780cf65`, `74e0f83e5`, `40e9bd9c5`, `c5653366d`, `4fc934de8`, `71bf6bfe6`, `1e2ecee67`, `884d21862`.

**Do not advance the Faculty screen-acceptance counter** without passing evidence. Next screen after closure: #03 Faculty Courses.
