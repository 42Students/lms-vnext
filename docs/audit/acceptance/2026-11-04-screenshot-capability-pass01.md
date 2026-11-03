# Screenshot-driven capability audit — pass 01 (2026-11-04)

**Scope:** FIRST SOURCE TRIAGE, **NOT CLOSED**. This is an evidence note under the existing acceptance folder, **not a new task tracker or a change to any canonical status**. The current owner-approved [legacy capability standard](../../planning/legacy-capability-parity-standard.md) supersedes pixel similarity. Screenshots are evidence for affordances; working FE → API → persisted result → correctly authorized consumer plus browser validation remains mandatory to close a surface.

**Screenshot oracle:** `42Students/lms-vnext@parity-baseline`, source package files `packages/{id}.md` (historical capture from 2026-11-03; old and vNext test users/data differ). **Historical vNext image SHA:** `7acef7ec` as recorded in reference README, *not* today's UI. The baseline image contents were not decoded in this GitHub-only pass; package descriptions, named interaction captures and route metadata were inspected. We therefore do **not** claim visual inspection of individual PNGs or a screenshot pixel-match.

**Fresh source references checked:** `42Students/lms2-fe@prod-2026` `9ca5206dc02fe5de89991d77655f2401934cc854`, `42Students/lms@prod-2026` `e18bc100f0a51e51163701da19135c240457f47f`, and vNext `main` checked at `6ea58ffed3a367f088b45dee20673f2f9033de1f` before this batch's edits. Legacy FE source of `/quiz` was read directly at `src/pages/quiz.js`. Other old FE/BE handlers still need exact-operation tracing before final closure.

## Package triage (24/783 manifests, 12 page families)

`VERIFY` means the named user-visible control has a plausible source implementation today; **no browser/DB/negative gate has been executed here**. A capture lacking a modal does **not** establish a missing action. Use the existing account specs and master matrix for final statuses, not this evidence note.

| Package IDs | Legacy interaction clues visible in package descriptions | Current vNext source and decision | Pending proof |
| --- | --- | --- | --- |
| `learner-001..002` (2) | All Assignments, course selector, View assignment, list and overlay states | **VERIFY**: `src/app/(authenticated)/learn/allAssignments/page.tsx` delegates authorized pagination to `learner-assignment-page-model.ts`, scoped read to `getLearnerAssessmentOverview`, and list/details to `learner-assessment-overview.tsx`. Actual failed-read retry repaired in this batch. | Browser course selection, assignment drawer, submission + file/grade result, 401/403 foreign/closed, load failure/retry, mobile |
| `learner-003..006` (4) | All Quizzes, expanded quiz rows, course/state filter and Submitted overlay | **VERIFY**: `src/app/(authenticated)/learn/allQuizzes/page.tsx` and shared `learner-assessment-overview.tsx` provide scoped course/quiz states; legacy numeric quiz links are joined only to IDs in the authorized overview. The many old-only expansions are **different capture coverage**, not 4 missing vNext pages. | Actual rendered/expanded rows and state filters with comparable fixture, attempt/result scope, retry and 375px checks |
| `faculty-001` (1) | `/quiz` blank old base, Preview Quiz, vNext base load-failed | **CAPTURE/ROLE CLASSIFICATION NEEDS REPAIR, not proof of missing Faculty preview.** The current legacy FE `src/pages/quiz.js` exports `StudentQuiz` and mounts `Quizpanel`: this is a learner attempt route, even if the capture was taken as Faculty. vNext `src/app/quiz/page.tsx` mounts `LearnerQuizAttempt` with `src/app/quiz/error.tsx`; Faculty learner-preview functionality is separately implemented in `faculty-quiz-learner-preview.tsx`. | Capture with an authenticated authorized quiz ID/review state, validate no-question/attempt errors; separately exercise actual Faculty preview; no visual closure from blank/load-failed pair |
| `faculty-002..004` (3) | All Assignments, Create Assignment, Edit assignment, View Submissions, course dropdown, details | **VERIFY**: `teacher/allAssignments/page.tsx` and `faculty-assessment-overview.tsx` contain create, edit, detail and submissions/report affordances; `faculty-assignments-retention.tsx` retains last scoped snapshot during failed reload. | Actually create/edit/publish/submit/review, file readiness, limited instructor/foreign delivery denials, responsive drawer |
| `mentor-001` (1) | Meetings with Upcoming, Past & Cancelled, Open project and notifications/account | **VERIFY**: `mentor/calendar/page.tsx` + `mentor-meetings-calendar.tsx` provide split status lists and project links, request/reschedule/cancel/outcome controls plus richer optional calendar tools. Historical compressed-grid screenshot is not valid current UI evidence. | Authenticated request/accept/reschedule/cancel outcome→project browser/PG run; no join links for pending/completed; mobile text wrap |
| `mentor-002` (1) | Mentor Notifications base | **VERIFY**: `mentor/notifications/page.tsx` reads `getMentorPersonalInbox`, validates via `mentorInboxQuerySchema`; screenshot has no comparison interactions to establish missing modal. | Personal/foreign notification scope, unread/open/read, pagination, empty and failure states |
| `mentor-003` (1) | Mentor Projects All statuses, All attention states | **VERIFY**: `mentor/projects/page.tsx` parses `mentorProjectListQuerySchema` and filters with `matchesMentorProjectAttention`; labels may be redesigned. | Open selectors in browser; status/attention filtering, deep-link and tenant negative |
| `tpo-001..002` (2) | Announcements From 42, +Add, optional form/link button, New announcement, Always and global shell overlays | **VERIFY/PARTIAL**: `tpo/announcements/page.tsx` has New/Edit modal, audience picker, optional HTTPS button, scheduling, sent/read and From 42 tabs; `api/placements/tpo/announcements/route.ts` checks same-origin and invokes real service. Captured vNext has **base only**. This pass fixes recovery/logging for list/unread/target failures, not delivery readiness. | Real create→recipient inbox→read, audience targeting, scheduled dispatch, undo, negative roles, provider-ready storage, browser modal |
| `tpo-003..004` (2) | Audit log Bulk actions, Shares and downloads, Drives, Recruiters, Who/What/When filters | **VERIFY**: `tpo/audit/page.tsx` + `tpo-audit-grid.tsx` and `tpo-audit-model.ts` cover categories, scoped actor/date filters, CSV and stale snapshot. This pass adds page-tagged failure logs. | Producer action→audited event→filter/export readback, cross-tenant denial, empty/stale and keyboard grid |
| `tpo-005..006` (2) | Batch status, decide eligibility, finished batches, Undo, decide who is in placements | **VERIFY**: `tpo/batches/page.tsx` reads persisted batch eligibility/journey, `TpoBatchUndoControl` performs a guarded POST with exact `actionId`, `requireTpoBatchActor` checks role. | Real eligibility change→learner outcome, undo race and no other college access, older batch navigation |
| `admin-001..003` (3) | College Assignments Export CSV (page), Create, Edit, Submissions, All courses | **VERIFY**: `college/assignments/page.tsx`, `college-assessment-aggregate.tsx`, `college-assignment-create.tsx` and `college-assignment-actions.tsx` provide export, create draft, edit and submission review. | Authorized course/section options, create→publish→learner→submit→admin review, filtered CSV and foreign college negative |
| `admin-004..005` (2) | Attendance previous/next month and Select class | **VERIFY**: `college/attendance/page.tsx` and `admin-attendance-workspace.tsx` contain URL-backed month shift, class/course selection, attendance grid and export. | Actual month boundary/back-forward, timezone, role/college denial, edit window and CSV/print browser |

## Additional unmatched-route spot checks (16 more manifests)

These are **route-mapping spot checks** prompted by the screenshot archive, not detailed modal/permission acceptance. In particular, old-only or vNext-only *images* cannot establish a missing or extra feature. Each row below was read from the package manifest; the indicated vNext route or alias source was separately checked. This raises the number of distinct **manifests inspected** in pass 01 to **40/783** (5.11%), while retaining only 24 in the initial interaction-level triage.

| Package | Screenshot route mismatch or capture state | Current code mapping / next decision |
| --- | --- | --- |
| `admin-020` | Old `/college-admin/companies`, new `/college/companies` | Same everyday company directory at `college/companies/page.tsx`; **VERIFY** actions/tenant |
| `admin-040` | Old lecture halls to `/college/lecture-halls`; new only base in part | `college/lecture-halls/page.tsx` exists; **VERIFY** editor and legacy form state |
| `admin-060` | Old project submissions to `/college/projects/submissions` | `college/projects/submissions/page.tsx` exists; **VERIFY** submission review |
| `admin-080` | Old students to `/college/students` | `college/students/page.tsx` exists; **VERIFY** role directory controls |
| `admin-100` | Old and new TPO batch detail, no new images in this package part | `tpo/batches/[batchId]/page.tsx` exists; **CAPTURE GAP**, not absent batch detail |
| `admin-125` | Old and new TPO verification | `tpo/verification/page.tsx` exists; **VERIFY** record-level actions |
| `admin-150` | Old `/college-admin/courses/[id]`, no paired vNext route | Multiple vNext course/offer routes exist; exact old course-ID→offering/deep-link resolution **NOT YET VERIFIED**; do not equate by name |
| `admin-175` | Old `/college-admin/jobs/[jobId]/settings`, no screenshot pair | `college/placements/jobs/[jobId]/settings/page.tsx` has guarded edit, close/reopen/archive; **VERIFY** persisted outcomes |
| `admin-200` | No old match, vNext `/college/placements/applications` | vNext-only capture. **Reconcile** whether a consolidated/improved application workspace, not automatically an extra feature |
| `admin-225` | No old match, vNext `/college/placements/retention` | vNext-only capture; read-only college retention report exists; **reconcile enhancement/privacy** |
| `admin-250` | Old `/college-admin/projects/workspaces/[workspaceId]/readiness` lacks paired vNext capture | Compatibility `college/projects/workspaces/[workspaceId]/[section]/page.tsx` redirects to `college/projects/[projectId]/readiness/page.tsx`; **VERIFY** deep-link state |
| `admin-275` | Old `/college-admin/projects/workspaces/deleted` no vNext capture | `college/projects/workspaces/deleted/page.tsx` redirects to real `college/projects/deleted` preserving bounded pagination; **VERIFY** restore action |
| `admin-300` | Old `/tpo/calendar` has no paired vNext capture | `tpo/calendar/page.tsx` exists; **CAPTURE GAP** |
| `admin-325` | Old `/tpo/drives/new` has no paired vNext capture | `tpo/drives/new/page.tsx` redirects via `legacyTpoNewDriveHref` to authorized `/tpo/placements/new`; **VERIFY** create/save |
| `admin-350` | Old `/tpo/recruiters/[recruiterLeadId]` lacks vNext screenshot pair | `tpo/recruiters/[leadId]/page.tsx` resolves legacy numeric lead IDs within persisted same-college TPO membership; **VERIFY** legacy-ID and cross-college negatives |
| `admin-375` | Old `/tpo/students` lacks paired new capture | `tpo/students/page.tsx` exists; **CAPTURE GAP**, not absent student list |

Do **not** create 16 new tasks based on the unpaired files. Add a missing feature to the existing account/page spec only after the legacy FE/BE handler and vNext behavior have been compared. The two vNext-only routes need intended-enhancement classification, not deletion.

### What changed in code in this pass

1. `src/app/(authenticated)/learn/allAssignments/page.tsx`: replace the fixed `?retry=1` link, which could become inert once already on that URL, with `CurrentPageRetry` (`router.refresh`) without altering selected route filters; log backend load failure but **never** swallow authorization/service errors.
2. `src/app/(authenticated)/tpo/announcements/page.tsx`: attribute failed notice list, unread and audience-target reads using the shared route-safe logger; keep permission denials fail-closed; replace link-based retry with real refresh.
3. `src/app/(authenticated)/tpo/audit/page.tsx`: add route-tagged read failure logging while preserving the existing scoped stale-snapshot/Retry and authorization exception behavior.
4. `tests/unit/screenshot-capability-pilot-20261104.test.ts`: 15 tests, including actual pure-model logic for bounded pagination, status filter vocabulary, safe link parsing and error-code allowlisting, alongside source-only discovery guards for the other candidate controls. Authored tests are **not executed tests**, and source checks cannot validate UI/API mutations.

### Numbers and confidence

- Reference archive: **3,169 image files** / **783 packages**; already inventory-verified in historical report.
- **24 package manifests triaged by named interaction and current source; plus 16 additional unmatched-route samples mapped to candidate routes/aliases (40/783 manifests inspected)** = **5.11% of manifests inspected overall**; this is **not** a 3.07% product-completion metric.
- **12 initial page families mapped** to current source; 16 additional route/capture samples checked.
- **0 of these 24 newly certified as fully browser/API/security closed** in this pass. Existing accepted evidence elsewhere is not invalidated; no statuses are flipped.
- At least **one misleading capture-role assignment** identified (`faculty-001` uses old learner `/quiz`).
- Recruiting/HR and Super Admin screenshot captures remain incomplete, Course Coordinator is old-only, and an image package may include many duplicate/invalid states. An unmatched route is not by itself a missing feature.
- No final global parity percentage until source-backed distinct user jobs and their verification outcomes are reconciled; no raw-pixel threshold.

### Follow-through / executable acceptance

Run at an exact commit in an approved test runner (not claimed here):

```bash
npm run typecheck
npx vitest run tests/unit/screenshot-capability-pilot-20261104.test.ts tests/unit/page-read-failure.test.ts
npm run parity:status
npm run parity:pages
npm run parity:clone-gate
```

Then run the existing seeded, actual PostgreSQL authenticated browser matrix. Start with **Learner assignment drawer/retry**, **TPO announcement creation→recipient inbox**, **TPO batch eligibility→undo**, and **College attendance month navigation**; include foreign-college, denied role, malformed inputs, no-data and mobile states. Record precise tested vNext SHA and current pinned old FE/BE oracle in the **existing** `docs/parity/*.md` page specs and family verification records. Only mark an existing canonical row DONE/CLOSED after those executed gates. If a required action is truly absent, implement it with its API/service/tenant/side effect before closing.
