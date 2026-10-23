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
1. Work in dedicated branches and reviewed PRs, **not directly on `main`**.
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
| 45 | Mentor | Mentor › Projects (home: what needs you, your teams) | NOT STARTED |
| 46 | Mentor | Mentor › Project › Overview | NOT STARTED |
| 47 | Mentor | Mentor › Project › Board (sprint picker, 6 lanes, list view, task detail) | NOT STARTED |
| 48 | Mentor | Mentor › Project › Sprints & releases (16 sprints: sign off, carry over, ship) | NOT STARTED |
| 49 | Mentor | Mentor › Project › Team & meetings | NOT STARTED |
| 50 | Mentor | Mentor › Project › Performance (who did what, unassigned work) | NOT STARTED |
| 51 | Mentor | Mentor › Project › Resources | NOT STARTED |
| 52 | Mentor | Mentor › Project › Activity | NOT STARTED |
| 53 | Mentor | Mentor › Review a final submission (accept, request changes, lock, reopen) | NOT STARTED |
| 54 | Mentor | Mentor › Meetings (all teams: requests, coming up, notes) | NOT STARTED |
| 55 | Mentor | Mentor › Notifications | NOT STARTED |
| 56 | Mentor | Mentor › Everywhere: search, bell, your details | NOT STARTED |

## First visual pilot
Compare **#01 TPO Companies › Today**, **#31 Recruiter › Today**, and **#45 Mentor › Projects** to equivalent live vNext screens, identify shell-level fixes, then complete one workflow at a time. Treat unverified changes on `main` as needing re-review.

**Status:** reference saved and indexed; no screens have been accepted or marked visually verified by this document.
