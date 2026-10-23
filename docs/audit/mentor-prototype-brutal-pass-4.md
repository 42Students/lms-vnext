# Mentor exact-prototype audit — brutal pass 4

**Date:** 2026-10-24 · **Owner branch:** `main` · **Source of truth:** actual 12 Mentor HTML prototypes #45–56 in the user's Library, original SHA-256 `80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`.

## Status

- **12/12 Mentor screens touched by real implementation, including page-body workflows.**
- **0/12 fully verified, 0/12 closed.**
- **0/56 total portal screens closed.**
- A connector-based source audit of 18 edited files checked **32 structural invariants; 32 passed**. This is **not** a code execution or TypeScript pass.
- This chat did **not** receive a passing `npm run typecheck`, `npx tsc -p tsconfig.strict.json --noEmit`, lint, unit, integration, Playwright or real vNext screenshot result.
- New source-contract tests are wired into `.github/workflows/ci.yml` on push to `main`. Their latest result has not been observed, so **do not equate being wired to passing**.

## Implementation inventory, screen by screen

| # | Screen | Actual implemented behavior | Remaining mismatch / verification blocker |
|---|---|---|---|
| 45 | Projects | Real team list, task and sprint metrics, priority attention, per-user/event Later, student-level blocked/review counts from active scoped learner memberships | Exact greeting, prototype example-specific attention rules, last-active, cross-team calendars, missing responsive reference |
| 46 | Overview | Persisted authored brief: goal, deliverables, done checks and personas; task health, sprint timeline, meeting, current approvals, latest persisted Mentor updates | Full data quality for sprint health, lead details, per-sprint deliverables, sprint sign-off CTA placement |
| 47 | Board | Six compact status lanes, task search, Board/List, assigned person and estimate, persistent selected task pane, comments, full dialog, task reassignment, move controls, **A/S guarded latest-submission reviews**, J/K navigation | All-sprint grouped list, drag between sprint scopes, approve return note as visible inline pane rather than existing modal; exact keyboard/mouse/browser verification |
| 48 | Sprints & releases | Real persisted sprint/release summary, task point estimates, backlog, start/complete/reopen sprint, ship/unship release through existing guarded lifecycle actions | Prototype sign-off note and unfinished-task carry-over decision UI not identical; missing first-party screenshot, state checks |
| 49 | Team & meetings | Role-scoped team roster and workload, existing membership/meeting editors; links to saved meeting notes and requests | Per-student last-active metric, meeting agenda/invitees, persistent attendance, action items and rich note sections not represented in current promoted DB model |
| 50 | Performance | Per-student completed/waiting/open/carried work and points from real tasks, existing autoassign and manual editor | Prototype sprint-range selector and per-student warning grouping; source actions not browser tested |
| 51 | Resources | Existing real type/visibility/status/pinned/sprint/task filters and create/upload/share operations; completed-sprint fold and hidden-row reorder guard | Pinned group and card layout, exact file preview, editing dialog states, browser parity |
| 52 | Activity | Recent typed events, existing feed filters; newly authorized `POST /api/projects/[projectId]/mentor-updates` creates project-scoped event; latest updates also appear on Overview | “New since you last looked” durable read cursor, actor/sprint filter UI, any push/email side effect (not claimed), exact timeline design |
| 53 | Final review | Source/demo URLs safe, recorded evidence attachments and review timeline, Accept/Request changes CAS, reversible issue reasons, existing lock/reopen actions | Previewing private uploaded files, review decision placement, exact gallery/modal rendering and concurrency/browser tests |
| 54 | Meetings | IST seven-day strip, future/past list and selected detail, safe Join, real .ics, meeting request/history and persisted outcome-note links | Calendar sync / Meet auto-create, recurring reminders, invitations, attendance, per-action-item persistence, full note sections; these require explicit backend provider and data models |
| 55 | Notifications | Six URL-backed category tabs, persisted unread query, personal notifications and mark-read actions, scoped project alerts and college announcements | Unified read state across heterogeneous alert sources, read badges, merged chronological feed and pixel parity |
| 56 | Everywhere | Real route-authorized Mentor shell, search query for active assigned project names/task titles/student names/resource titles via `/mentor/search`, existing bell and account menus | Search flyout parity (new search is a results page), keyboard selection, complete contextual facets and rendered header geometry |

## Brutal defects and stop-the-line acceptance gaps

1. **P0, NO VISUAL PARITY EVIDENCE:** No running vNext screenshot has been captured for all 12 states, matching original prototype viewport and fixtures. The user expressly requires pixel-accurate parity; source audit cannot certify it.
2. **P0, CI/TYPECHECK UNCONFIRMED:** Changes were written directly to `main` as directed. `npm run typecheck`, strict TypeScript, lint, unit, integration and CI source contracts must be checked before any screen is considered releasable. GitHub connector does not expose push workflow statuses reliably in this session.
3. **P0, MEETING DATA GAP:** The promoted schema stores one meeting outcome; attendance, retro sections, action-item ownership, recurrence and calendar OAuth aren't registered as first-class fields. Do not fake them by overloading other notes.
4. **P0, BOARD+SPRINT APPROVAL:** A/S review now calls original CAS API with the latest submission's updatedAt; must test stale version, observer denies, project archival and confirmation. The prototype's unfinished-task carry-over with written sign-off note is not implemented as a distinct interaction.
5. **P1, LEARNER-FACING UPDATE DELIVERY:** Mentor activity posts are persisted and shown in Overview. Notification push/email delivery to all team members isn't implemented or implied by the event insert alone; must test and design separately.
6. **P1, STUDENT WATCH IS EVIDENCE-BASED:** It reports blocked and waiting-review tasks, not an inferred personal risk or last-active score. Counts are scoped to active learner members in assigned Mentor projects, but query performance and page-scoped vs all-team semantics still require verification.
7. **P1, UNIFIED SEARCH QUERY COSTS:** Bounded to 15 rows per category and assignment-scoped. Requires performance, tenant-isolation, and no-cross-role tests. A results page is not the same UI as the prototype's contextual search overlay.
8. **P1, FINAL SUBMISSION ARTIFACT PREVIEW:** Only HTTP(S) links passing safe URL validation can open. Private file storage / protected previews require signed URL delegation and must not expose raw keys.
9. **P1, NOTIFICATION READ STATE:** The Unread tab uses the personal inbox's persisted read field only. Project attention and announcement rows have separate semantics; can't claim a unified unread counter without a new state model.
10. **P1, ACCESSIBILITY AND MOBILE:** A/S and J/K avoid editable fields and dialogs. Need actual browser keyboard, focus, scroll, small viewport and reduced-motion checks. Uploaded prototype contains desktop visual oracle only.

## Mandatory next steps before closure

- Check **latest `main` CI**, not an older successful run. Correct all strict typing/lint/source guard errors.
- Run an isolated role/tenant database fixture for Mentor and check actual authorization boundaries with blocked, pending, completed, archived and observer variants.
- Capture real vNext screen screenshots against the decomposed prototype #45–56 at each original 1440px viewport, including opened menus and dialogs. Produce difference heatmaps/overlays.
- For remaining product-model gaps (meeting attendance/recurrence/action items, all-sprint drag/carryover, notification state, contextual search modal), implement approved storage/API semantics rather than mock data or fake success messages.
- Iterate each page until source, runtime, accessibility, interaction and visual gates pass; only then mark that page `VERIFIED`/`CLOSED` in the ledger.

**Audit conclusion:** Substantive implementation has advanced on all 12 Mentor screens and their shared subfeatures. **Exact prototype parity is not yet proven nor complete.** This document must not be used as release sign-off.
