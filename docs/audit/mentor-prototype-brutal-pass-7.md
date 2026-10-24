# Mentor prototype — brutal audit, pass 7

**Date:** 2026-10-24 · **Branch:** `main` (explicit owner instruction) · **Reference:** user's saved `42LMS pages prototype.html`; Mentor screens #45–56. The source HTML has been inspected for controls and page copy and is not replaced by external stock imagery.

## Verdict

- All **12/12 Mentor page routes and their shared workflows** have substantive code on `main`.
- **0/12 fully verified or closed.** No captured authenticated running-vNext screenshot matched to its specific original prototype screen was available in this pass.
- GitHub returned **zero commit status entries** for the current `main` head. This does *not* prove any job succeeded or failed. `npm run typecheck`, strict TS, lint, database integration and visual/browser acceptance **remain unconfirmed**.
- The new source-contract checks for request handling, last activity, evidence Zoom, actor filtering, pinned grouping, calendar export and Activity since-seen were exercised against the latest GitHub source and passed individually. These are source assertions, **not executable product tests**.

## Latest implementation changes

| Screen | Added or corrected | Acceptance gaps |
|---|---|---|
| 45 Projects | Last activity now queries actual college-scoped project activity events instead of using a project row's modified timestamp. Student watch still uses real blocked/review tasks from active assigned learner memberships. | Browser, sample fixture equivalence; last-activity activity subgroups may differ for legacy imported events |
| 46 Overview | Persisted authored brief, sprint health, real actionable work and latest posted updates remain. | Exact prototype's trend forecasts aren't fabricated; visible acceptance unverified |
| 47 Board | Six lanes, sprint-grouped List, persistent task pane, task search, J/K, guarded A/S and status controls remain. | Cross-sprint drag, keyboard/focus and dialogs require actual browser verification |
| 48 Sprints | Per-task Next / Backlog / Drop choices, transactional sign-off, task CAS, optional sign-off note, start-next and release validation remain. | DB rollbacks and stale concurrent versions not integration-tested |
| 49 Team & meetings | Roster now displays current active sprint done/waiting/blocked, last four actual sprints' done points and carried tasks, plus latest **task modification**, accurately distinguished from online presence. Existing team editor stays. | Actual last online state not stored/represented, exact role menus and member management modal visual parity unverified |
| 50 Performance | All/current/last-four/per-sprint selector, work counts and authorized assignment controls remain. | Browser correctness at scale, outcome feedback visual parity |
| 51 Resources | Resource list has Pinned references / Other resources group headings ordered by actual pinned status, plus existing filters, upload/share editing, completed-sprint fold and reorder safeguards. | Precise card/modal layout, private provider previews not verified |
| 52 Activity | Added a real by-person actor filter over the loaded activity timeline. Added an honest **device-local** new-since-last-seen indicator and Mark as seen action keyed by user+project; it never claims cross-device persistence or counts events outside loaded history. Existing POST update and paging remain. | Durable cross-device read cursor, sprint filter and notification fan-out not implemented; browser parity unverified |
| 53 Final review | Evidence links for image/PDF support a sandboxed read-only Zoom with full-size fallback; no raw storage key exposed. Existing history, CAS review/revision and lock/reopen maintained. | Third-party X-Frame policies may block embedded previews; private evidence requires existing authorized signed URLs; modal visual parity not verified |
| 54 Meetings | REQUESTED detail now offers **Yes, this time** (requires actual future IST time and safe join link via authorized PATCH), **Another time** (opens existing editor without claiming saved changes) and **No, answer in a note** (existing audited Mentor decision API with CAS). Added scheduled-only multi-project `.ics` export plus existing single-meeting export. Meeting attendance/actions/retro/follow-up from persisted schema remain visible; cross-project creation/draft stays. | OAuth calendar connection, Meet link generation, recurring invite sync and external provider success are not implemented |
| 55 Notifications | Existing six real-source category pills, persisted personal unread and mark-all-read flow preserved; no duplicate button created. | Fully merged read tracking for project attention/college announcements lacks a shared recipient read model |
| 56 Everywhere | Assigned-workspace global search, keyboard command flyout, route-qualified shell and existing bell/account controls preserved. | Fully inline popup/profile preference design and connected-provider status require live verification / a real calendar integration |

## Structural & safety notes

1. Mentor activity updates now require same-origin checks plus role, active membership, project state and bounded body validation.
2. Calendar request acceptance/decline reuse the original project APIs, version token and server permissions. **No false Google Meet creation success.**
3. The `PROJECTS` last-activity query reads group keys belonging to assigned project IDs, isolated by college; it covers `project:<id>` and project subtype groups without leaking other project IDs.
4. Pinned resource grouping is purely visual and leaves persisted reorder/edit permissions untouched.
5. Supported final evidence previews are sandboxed and do not enable scripts, forms, same-origin privileges or referer transmission.
6. Activity since-seen is explicitly local to a browser. It is not a substitute for a persisted user-specific cursor.
7. Read-only Mentor observers still rely on existing project access checks for mutations. Full cross-role/archived/observer tests are needed on real fixtures.

## Remaining P0 release gates

- **TypeScript/build/CI:** run latest code typecheck, strict TS, lint, Node tests and real DB integration. No green status was returned by the GitHub connector at the current main commit.
- **Visual acceptance:** capture all #45–56 running vNext screens, plus opened task/review/meeting/filter/dialog states, at equivalent viewport and data states. Compare with the original unpacked HTML images; fix deviations, responsive breaks, accessibility and focus.
- **Provider features:** Google Calendar/Meet OAuth, meeting creation, invite/recurrence sync. These require configured application OAuth credentials and must not be simulated by a generic link.
- **Product read-state gap:** unified read/unread for mixed notifications and cross-device Activity seen state need authenticated persistence policy.
- **Data/flow tests:** sign-off Next/Backlog/Drop transaction, stale data, archived project, pending review and permission denial must be exercised against the database.

**Closure policy:** work can be IMPLEMENTED, but no Mentor screen is marked VERIFIED or CLOSED until these gates pass. No fabricated metrics, screenshots or validation results are used in this audit.
