# Brutal prototype parity audit — pass 1 (source and actual HTML reference)

Date: 2026-10-23. Target: `main`. Visual oracle: original user-uploaded
`42LMS pages prototype.html` (SHA-256
`80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`),
also stored in ChatGPT Library at `/LMS Prototype References/`.

**Audit truth:** This is a brutal **source/HTML audit**, not a visual verification
of the running vNext application. We rendered prototype screens #01, #31, #45
from their unpacked HTML. No side-by-side vNext browser screenshots, role-based
test sessions, end-to-end test runs, or pixel differences have been obtained.
**Screens closed: 0 / 56.**

## Source files inspected
- Prototype #01 TPO Companies › Today, `01-tpo.html`:
  stable 200px text-only sidebar; Today / Recruiters / Companies / Emails /
  Messages tabs; 340–420px focus queue with 7-day strip; detail/reply pane;
  actual action buttons. Page padding 20px 28px.
- Prototype #31 Recruiter › Today, `31-recruiter.html`:
  stable 200px text-only sidebar, context text, bottom Request a drive CTA,
  greeting, 3-row focused priority list, two right-hand summary cards,
  white surfaces; page padding 28px 34px.
- Prototype #45 Mentor › Projects, `45-mentor.html`:
  sidebar Projects / Meetings / Notifications, personalized greeting, focus
  queue, right-hand meetings/watch panels, six-column Your teams table with
  segmented sprint progress and attention states.
- Shared `src/components/shell/app-shell.tsx`,
  `src/components/shell/sidebar-legacy.css`,
  `src/components/shell/topbar/legacy-topbar.tsx`,
  `src/components/projects/project-list.tsx`,
  `src/app/(authenticated)/hr/home/page.tsx`,
  `src/app/(authenticated)/mentor/projects/page.tsx`,
  `src/app/(authenticated)/tpo/recruiters/page.tsx`.

## Brutal findings — no optimistic closure

| Finding | Scope | Severity | Evidence and required follow-up | Status |
|---|---|---|---|---|
| PB-001 | All 56 | P0 | No running vNext screenshot comparison at identical viewport/data. Cannot claim exact visual match. | BLOCKED: no runtime captures |
| PB-002 | TPO #01 | P0 | Prototype has split focus queue + reply detail panel. VNext `/tpo/recruiters` primarily mounts `RecruiterLeadsWorkspace`, not the prototype stateful Companies/Today workspace. Build route/UI with real scoped follow-ups, linked email reply, next action and keyboard flow. | OPEN |
| PB-003 | Recruiter #31 | P0 | Prototype has a concise 3-item needs queue and two right cards. `/hr/home` renders many separately headed sections and summary widgets. Consolidate hierarchy without dropping authorization/alerts. | OPEN |
| PB-004 | Mentor #45 | P0 | Prototype includes attention queue, this-week meetings, student watch list. `/mentor/projects` retains controls and projects list, but the full triage layout is not reproduced. | OPEN |
| PB-005 | TPO shared nav | P1 | Prototype sidebar has Home, Students, Drives, Companies, Calendar, Team, Reports, Settings; vNext retains other legacy items/grouping and Engage label. Preserve links via the appropriate prototype sub-pages when consolidating the sidebar. | OPEN |
| PB-006 | Three portals | P1 | vNext topbar remains visible and carries search, notification, college switching and account actions; original prototypes place them elsewhere or omit them in these screens. Move them to equivalent visible accessible locations *before* removing. | OPEN |
| PB-007 | Three portals | P1 | Shell CSS is now prototype-scoped, but exact browser geometry and Lato loading through remote Google Fonts are not verified in deployment. | PARTIAL / UNVERIFIED |
| PB-008 | Mentor #45 | P1 | `ProjectList` now uses six-column team table with real member count/progress/phase/updatedAt. Exact sprint-segment visualization requires real sprint roll-up; never fake 16 segments. Filter/count chips and row-level statuses remain to reconcile. | PARTIAL / UNVERIFIED |
| PB-009 | Other 53 screens | P0 | Interactive tabs/dialogs/messages, their data/permissions, and screen-by-screen implementation comparison have not yet been independently checked. | OPEN |
| PB-010 | Public #43–44 | P1 | Public share and invitation flows need separate unauthenticated, expired, revoked and forbidden states; avoid exposing recruiter-college data outside scoped grants. | OPEN |
| PB-011 | Mobile all | P2 | Uploaded HTML is desktop-first. No canonical mobile mockups were supplied; preserve working vNext responsive behavior and distinguish derived design from exact-reference signoff. | OPEN |
| PB-012 | Regression | P1 | Source-only guard added; no TypeScript, React runtime, accessibility E2E or screenshot tests executed for latest main commits. | NOT VERIFIED |

## Implementation made on main in this pass
1. `app-shell.tsx`: choose role-scoped visual shell for single-workspace accounts and make the Recruiter new-drive action a real link.
2. `prototype-portals.css` imported by `globals.css`: prototype-derived colors, Lato, fixed open desktop sidebar, plain background, white cards, selection/badges, responsive fallback. Other roles retain existing shell.
3. `project-list.tsx`: Mentor-only table branch matching the screen #45 information columns; Learner project cards unchanged.
4. `tests/prototype-parity-shell-contract.test.mjs`: static regression assertions; does **not** substitute for rendered verification.
5. `docs/prototypes/tpo-recruiter-mentor-parity.md`: complete 56-screen scope and evidence gate.

## Required independent verification pass
- Gate A: `npm run typecheck`, `npx tsc -p tsconfig.strict.json --noEmit`,
  `npm run lint`, and `node --test tests/prototype-parity-shell-contract.test.mjs`.
- Gate B: authenticated TPO/Recruiter/Mentor browser walkthroughs of 56 prototype
  states with equivalent authorized fixtures. Preserve real URL, auth, button actions,
  counts, server responses and role access.
- Gate C: captured vNext screenshots alongside exact prototype screenshots at
  matching desktop viewport. Pixel diff plus human review for text/data
  variations. Record matching navigation/action states, not just default renders.
- Gate D: brutal audit of every screen (missing section, extra section, wrong data,
  misaligned design, inaccessible controls, 403 leakage, stale/error/empty states)
  and re-run A–C after each fix.

**Hard gate:** no screen becomes VERIFIED or CLOSED until B–D have real results.
