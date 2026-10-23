# Exact prototype parity — TPO, Recruiter and Mentor

**Owner directive, 2026-10-23:** Freeze all other UI portals for now. Reproduce the **uploaded 42LMS prototype exactly** across TPO, Recruiter and Mentor. Do not substitute the look of the old LMS dev branch or an internally invented redesign.

## Immutable prototype reference
- Uploaded file: `42LMS pages prototype.html`, **56 screens** (30 TPO, 12 Recruiter, 2 related Public, 12 Mentor).
- SHA-256 of original: `80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`
- Permanent ChatGPT Library folder: `/LMS Prototype References/`.
- Files there: `42LMS pages prototype.html` (canonical original), `42LMS-prototype-56-screens.zip` (unpacked 56 standalone HTML sub-bundles, index and individual hashes), `42LMS-prototype-role-parity-index.md` (screen ledger).
- In future chat sessions, retrieve that *actual file* from Library rather than relying on chat memory. The Library file is separate from this GitHub repo and is not automatically present in CI.
- Use `42Students/lms2-fe@lms-dev-2026` and matching old backend only for behavior/permissions the visual prototype does not specify. Preserve vNext tenant isolation and real API behavior.

## Implementation policy
1. Owner override on 2026-10-24: commit implementation directly to **`main`**, with source regression checks and explicit acceptance evidence. Do not label work visually verified without actual browser comparison.
2. Analyze every full HTML screen, including its embedded CSS, structure and visible modal/interaction states. The prototype's 1440px frame is the desktop layout oracle; no mobile designs are explicitly supplied.
3. Match sidebar/topbar, active states, layout geometry, fonts, palette, spacing, density, labels, forms, chips, grids/tables, dialogs and navigation. Shared shell and primitives should be aligned first.
4. Map prototype screen to actual vNext route/component; retain authorized live functionality. Any deliberate difference requires a documented reason.
5. Do not mark a screen **VERIFIED** until it is rendered in browser against the prototype at equivalent viewport and interaction states. Source review and committed code only warrant **IMPLEMENTED / UNVERIFIED**.
6. The 56 rows are individual *prototype screens*, not necessarily 56 unique routes; some are workflows, tabs, modals or public entry points.

## Screen ledger
| # | Portal | Prototype title | State |
|---:|---|---|---|
| 01 | TPO | Companies › Today | NOT STARTED |
| 02 | TPO | Companies › Recruiters | NOT STARTED |
| 03 | TPO | Companies › Companies | NOT STARTED |
| 04 | TPO | Companies › Emails (a sent email open) | NOT STARTED |
| 05 | TPO | Companies › Emails (writing a new email) | NOT STARTED |
| 06 | TPO | Companies › Messages | NOT STARTED |
| 07 | TPO | Students › All students | NOT STARTED |
| 08 | TPO | Students › Who’s in placements | NOT STARTED |
| 09 | TPO | Students › To verify | NOT STARTED |
| 10 | TPO | Students › Requests | NOT STARTED |
| 11 | TPO | Students › Announcements | NOT STARTED |
| 12 | TPO | Drives | NOT STARTED |
| 13 | TPO | Drives › A recruiter’s drive request | NOT STARTED |
| 14 | TPO | Drives › New drive (and edit) | NOT STARTED |
| 15 | TPO | Drive › Students (review one by one, share with company) | NOT STARTED |
| 16 | TPO | Drive › Rounds (results, slots) | NOT STARTED |
| 17 | TPO | Drive › Offers | NOT STARTED |
| 18 | TPO | Drive day (at the gate) | NOT STARTED |
| 19 | TPO | Drive › Talk (recruiter, change requests, team) | NOT STARTED |
| 20 | TPO | Drive › About | NOT STARTED |
| 21 | TPO | Home | NOT STARTED |
| 22 | TPO | Calendar | NOT STARTED |
| 23 | TPO | Team › Chat | NOT STARTED |
| 24 | TPO | Team › People | NOT STARTED |
| 25 | TPO | Reports | NOT STARTED |
| 26 | TPO | Reports › One report | NOT STARTED |
| 27 | TPO | Settings | NOT STARTED |
| 28 | TPO | Settings › Audit log | NOT STARTED |
| 29 | TPO | Everywhere: search, bell, notifications, profile | NOT STARTED |
| 30 | TPO | Companies › One recruiter (full page) | NOT STARTED |
| 31 | Recruiter | Recruiter › Today | NOT STARTED |
| 32 | Recruiter | Recruiter › Drives | NOT STARTED |
| 33 | Recruiter | Recruiter › Request a drive (and hire again, edit) | NOT STARTED |
| 34 | Recruiter | Recruiter › Drive overview | NOT STARTED |
| 35 | Recruiter | Recruiter › Drive › Applicants (focused review) | NOT STARTED |
| 36 | Recruiter | Recruiter › Drive › Rounds (slots, send results) | NOT STARTED |
| 37 | Recruiter | Recruiter › Drive › Offers and joining | NOT STARTED |
| 38 | Recruiter | Recruiter › Drive › Talk (asks, change requests) | NOT STARTED |
| 39 | Recruiter | Recruiter › Calendar | NOT STARTED |
| 40 | Recruiter | Recruiter › Messages | NOT STARTED |
| 41 | Recruiter | Recruiter › Company & Team | NOT STARTED |
| 42 | Recruiter | Recruiter › Bell, search, your details, college picker | NOT STARTED |
| 43 | Recruiter/Public | Public › Invitation, public link, sign in | NOT STARTED |
| 44 | Recruiter/Public | Public › Shared applicant list (no account) | NOT STARTED |
| 45 | Mentor | Mentor › Projects (home: what needs you, your teams) | IN PROGRESS — real focus queue, Later, task/sprint team table |
| 46 | Mentor | Mentor › Project › Overview | IN PROGRESS — data-backed overview health and decisions |
| 47 | Mentor | Mentor › Project › Board (sprint picker, 6 lanes, list view, task detail) | IN PROGRESS — six compact lanes, search, list and selected-task pane |
| 48 | Mentor | Mentor › Project › Sprints & releases (16 sprints: sign off, carry over, ship) | IN PROGRESS — real sprint/release bars and existing lifecycle controls |
| 49 | Mentor | Mentor › Project › Team & meetings | IN PROGRESS — student roster/workload plus meeting controls |
| 50 | Mentor | Mentor › Project › Performance (who did what, unassigned work) | IN PROGRESS — per-student workload and existing allocation editor |
| 51 | Mentor | Mentor › Project › Resources | IN PROGRESS — source-backed resource filters and earlier-sprint fold |
| 52 | Mentor | Mentor › Project › Activity | IN PROGRESS — recent-event metrics plus filterable history |
| 53 | Mentor | Mentor › Review a final submission (accept, request changes, lock, reopen) | IN PROGRESS — review evidence, reversible reason chips and guarded decisions |
| 54 | Mentor | Mentor › Meetings (all teams: requests, coming up, notes) | IN PROGRESS — week/list/detail, .ics export and meeting actions |
| 55 | Mentor | Mentor › Notifications | IN PROGRESS — six URL-backed category pills, feed and guidance |
| 56 | Mentor | Mentor › Everywhere: search, bell, your details | IN PROGRESS — route-aware role shell, search, bell/account preserved |

## Implementation commits on main (2026-10-23)
- `20ceda3`: role-scoped prototype shell switch and Recruiter action link.
- `4bcdaf8`: prototype source-derived portal styling (sidebar, typography, palette, white-card page, responsive fallback).
- `9069f9c`: register the stylesheet in authenticated global CSS.
- Scope: shared shell foundation for all 56 screens. **None of the 56 screens are closed or browser-verified.**
- Known gaps: inner screen structure, TPO's eight-link navigation, original per-screen state/interaction contracts, first-party screenshots of running vNext, and mobile designs.
- Current source audit: `src/components/shell/sidebar-legacy.css` still provides an older hover rail; role-scoped rules override it for prototype accounts. Topbar actions and other links deliberately remain functional pending prototype relocation.

## Mentor implementation pass (2026-10-24)
- Changes committed **directly to `main`**, per owner direction.
- Prototype screens **45–56 (all 12)** now have at least a source-level implementation change touching their shared or dedicated UI. This is **not** 12 finished pages.
- **0/12 verified, 0/12 closed.** The source has not been typechecked or visually compared against running vNext at the recorded 1440px viewports.
- Screen 45: real scoped focus events, `Later` per user/event, sidebar panels, six-column table; still missing actual student watch list and 16-sprint segments per project.
- 46–52: exact seven-tab order and labels, project heading and actual-sprint ribbon, scoped section card anatomy; each inner section remains short of the prototype's exact visual/interaction contract.
- 53: Accept/Request changes aligned without removing review CAS and confirmation workflows. Review detail still differs structurally.
- 54: weekly IST strip, selectable meeting list/detail, live Join/Open Project actions; actions for scheduling, attendance and notes need comparison.
- 55: notification main feed and guidance aside; filters and action locations need comparison.
- 56: shell search sends queries to authorized project and meeting filters; cross-team student/task/resource full-text search remains missing and is **not claimed**.
- Full brutal audit: `docs/audit/mentor-prototype-brutal-pass-2.md`.

## Mentor implementation continuation and source audit (2026-10-24)
- Mentor Board #47: compact six-lane layout from `47-mentor-template.html`, working Board/List toggle, live title/type/description/assignee search, persistent selected-task pane, comments, retained full task dialog and mutation controls.
- Mentor #46/48/49/50/52/53: dedicated source-backed overview, planning, roster, workload, recent activity and delivery evidence components; existing project editors and server permissions retained, but exact prototype dialogs/flow are **not yet signed off**.
- Mentor Resources #51: earlier-completed-sprint disclosure; disabled reordering while hidden resource rows could otherwise be omitted. Real source status and sprint data; no synthetic statuses.
- Mentor Meetings #54: selected meeting details, Join/Open links, authorized scheduler link, downloadable RFC 5545 .ics for recorded scheduled meetings only.
- Mentor Notifications #55: six category-pill filters; unread requests query persisted unread records and pagination preserves the category.
- Mentor shell #56: active-route presentation now also requires an actual Mentor/TPO/Recruiter permission grant; other routes retain their skin, including College Admin's TPO shortcut.
- Regression source contracts now run in `.github/workflows/ci.yml`; these **are not** image parity tests. The latest main TypeScript / Playwright / rendered screenshot results remain unconfirmed.
- **0/12 Mentor screens VERIFIED; 0/56 total screens CLOSED.** Next mandatory steps: actual CI results; browser visual diff; functional permissions, stale review, and full interaction states. Brutal audit pass 3: `docs/audit/mentor-prototype-brutal-pass-3.md`.

## First visual pilot
Compare **#01 TPO Companies › Today**, **#31 Recruiter › Today**, and **#45 Mentor › Projects** to equivalent live vNext screens, identify shell-level fixes, then complete one workflow at a time. Treat unverified changes on `main` as needing re-review.

**Status:** reference saved and indexed; no screens have been accepted or marked visually verified by this document.
