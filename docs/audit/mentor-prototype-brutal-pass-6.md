# Mentor prototype — brutal audit, pass 6

**Date:** 2026-10-24 · **Repository/branch:** `42Students/lms-vnext@main` · **Prototype source:** uploaded `42LMS pages prototype.html`, original SHA-256 `80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`. This pass specifically inspected the extracted actual templates `48-mentor-template.html` and `54-mentor-template.html`, not imagined stock UI.

**Verdict:** all 12 Mentor screens have implementation, **0 of 12 visually verified or closed**.

## P0 implementation changed in this pass

1. **Sprint #48: user-authored task carry decisions now persist transactionally.** The prototype explicitly offers, per unfinished task, **Sprint 13 / Backlog / Drop it** and a sign-off note with Start Sprint 13 checkbox. New `MentorSprintSignOff` radio options submit each task's ID, destination and persisted `updatedAt` CAS token. The `completeProjectSprint` project/sprint-locked transaction checks all live unfinished tasks and original timestamps, rejects missing/duplicate/stale decisions or IN_REVIEW tasks, verifies target sprint is later PLANNED and not in SHIPPED release, and moves each task to the selected destination. NEXT preserves `carriedFromSprintId`, orders task after the target sprint's existing sequence maximum, and records carry timestamp. BACKLOG clears sprint and records carry provenance. DROP **soft archives** the task with `deletedAt` and preserved historical references; the UI requires separate acknowledgement. One scoped activity record records the exact choices and counts. All 3 choices either commit with sign-off or roll back together.
2. **Backward compatibility:** callers of the existing sprint completion endpoint without `decisions` still carry all unfinished work to backlog as before, and keep the existing sign-off transaction. API accepts bounded 250-row decisions and 1000-character note, rejects malformed JSON and requires same-origin.
3. **Next sprint:** an optional separate start request follows successful sign-off. If it fails, the UI explicitly says the just-signed-off sprint remains completed, avoiding false claims of atomic next-sprint start.
4. **Meeting #54:** real `project_meetings.facilitation` fields were already persisted and editable; earlier audits calling them missing were incorrect. Mentor calendar selected detail now reads real agendas, attendance, notes, structured action rows, retrospective and follow-up fields, and deep-links to the authorized project editor. The Meetings page now has the prototype's cross-team **Schedule a meeting** control. It allows the active Mentor to choose an assigned project, enter real IST dates/title/agenda, save SCHEDULED with supplied safe HTTP(S) join link or save DRAFT without a link. Server's existing permissions, project CAS, overlap checks and validation remain authoritative. No Google provider write is invented.
5. **Security:** new Mentor Activity posting endpoint now enforces same-origin protection, in addition to existing actor, membership, project and input validation.
6. **Source contracts:** two stale expectations reflecting prior search/Board designs were corrected. Each of the 27 current `tests/prototype-parity-shell-contract.test.mjs` test bodies was executed against freshly fetched current GitHub source using an isolated V8 runner with equivalent assertion helpers, in batches of 8, 10, 6 and 3: **27/27 passed**. This is a source-contract dry-run only, not a GitHub Actions or Node test invocation.

## Remaining stop-the-line issues

- **P0, CI not observed:** no confirmed latest `npm run typecheck`, strict `tsconfig.strict.json`, ESLint, all unit/integration tests, DB migration and Playwright authenticated run. In particular, DB transaction integration tests must exercise per-task NEXT/BACKLOG/DROP, stale task tokens, review-pending blockers, wrong-tenant task IDs, shipped release destinations and rollback after invalid choice.
- **P0, visual parity not observed:** actual running vNext screenshot overlays for prototype #45–56 and open dialog states are still absent. No claim of pixel-perfect match.
- **P0, provider integration:** Google Calendar/Meet OAuth, automatic meeting creation, sync, invitation delivery and recurrence are not implemented. The UI openly requires a real join URL to schedule and supports drafts.
- **P1, task disposition UX:** DROP is implemented as archival, retaining provenance and historical references; the prototype uses the lighter phrase “Drop it.” Acceptance needs explicit confirmation that soft-archive semantics match product intent.
- **P1, Board #47:** list sprint grouping and keyboard A/S/J/K are source-backed, but sprint-to-sprint drag placement and exact detail panel/modal geometry have not been verified.
- **P1, Meetings #54:** requests are linked to the existing authorized scheduler, not yet presented as full inline Yes / Another time / No notes on the calendar screen.
- **P1, Notifications #55:** inbox unread is persisted only for personal notifications, not a merged read-state for transient project attention and announcements.
- **P1, Activity #52:** explicit post updates persist and appear on Overview, but an individualized durable “new since you looked” cursor and student notification delivery are not yet implemented.
- **P1, global #56:** route-authorized universal search covers projects, tasks, students, resources, with keyboard command flyout, but exact prototype context-menu/result overlay and profile-edit visual states are unverified.
- **P1, Resources #51 and Review #53:** private artifact previews, full modal states and cross-role permissions need authenticated live validation.
- **P1, Performance #50 and Overview #46:** precise source-derived risk narratives and every variant of the 16-sprint fixture remain unverified.

## Release gate

No Mentor page can change to `VERIFIED` or `CLOSED` until latest TypeScript/lint/CI and authenticated end-to-end interaction tests pass and a side-by-side 1440px rendering of its actual states matches the **user-uploaded** prototype. The HTML source remains immutable; demo/example data must not be hardcoded as live project data.
