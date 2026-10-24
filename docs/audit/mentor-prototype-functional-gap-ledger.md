# Mentor prototype #45–56 — exhaustive functional-gap ledger (pass 8)

**Audit date:** 2026-10-24. **Target:** 42Students/lms-vnext@main, baseline 507862ef4e17e62e69de0e3dc9ed4fa8b9454002. **Oracle:** user's original 42LMS pages prototype.html (SHA-256 80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8), extracted files 45-mentor.html through 56-mentor.html from the saved 56-screen ZIP in /LMS Prototype References/.

**Scope and decision rule:** This pass is **functionality and data-flow first**. It separately identifies genuinely missing functionality (GAP), a concrete source defect (DEFECT), behavior implemented but needing live permission/data/stale-state verification (TEST), and a mismatch dependent on product semantics/provider setup (DECISION). The original prototype is a sample-state/interaction oracle, not a source of permission to hardcode demo values or claim Google provider success. A source-inspected component is not an executed test. No screenshots were compared. **12/12 screens have implementation; 0/12 are verified or closed.** Current GitHub commit-status and PR-triggered workflow-run lookups for this baseline both returned empty arrays, which is **not** green CI.

## Verified source capabilities — do not redo these as missing

- #45: assigned Mentor portfolio, persisted attention, event-keyed browser-local Later, active-learner blocked/review watch, real project activity times and sprint segments. Main source: src/components/projects/mentor-prototype-home.tsx and src/app/(authenticated)/mentor/projects/page.tsx.
- #46: seven project tabs, source-backed brief/goals/deliverables, actual sprint and release counts, latest posted updates.
- #47: six-lane Board, per-sprint/backlog List, task search, selected task pane, J/K and guarded A/S, review mutation, comments and assignment. Source: src/components/projects/mentor-lane-board.tsx.
- #48: per-unfinished-task NEXT/BACKLOG/DROP with task updatedAt compare-and-swap, transactional completion/note, subsequent optional next-sprint start; release ship/unship. Source: src/components/projects/mentor-sprint-sign-off.tsx and completeProjectSprint service. **Older pass-5 statements that these choices were missing are stale.**
- #49: real current-sprint task counts and last-four workload, actual persisted meeting facilitation attendance, notes, action rows, retrospective and follow-up; authorized editing elsewhere. **Older reports saying facilitation storage is missing are stale.**
- #50: all/current/last-four/specific sprint selector and real student task/point counts; authorized assignment editor.
- #51: pinned grouping, existing resource filters, links/uploads/share/edit, earlier-sprint folding and reorder guard.
- #52: actor filtering, paginated event history, persisted Mentor update post, seven-day event breakdown, browser-local since-seen count.
- #53: submission details, safe URLs, attachment evidence, sandboxed image/PDF Zoom where embeddable, version-checked Accept/Request changes, history, lock/reopen.
- #54: per-team request decisions Yes/Another time/No, cross-team real meeting scheduling (DRAFT or safe supplied link), read-only facilitation detail, existing authorized editor and single/all scheduled .ics export.
- #55: six category filters, personal notification unread/read controls, separate project attention and college announcements.
- #56: assigned-workspace cross-project/task/student/resource search, command flyout and role-authorized shell, existing bell/profile affordances.

## Screen #45 — Projects / focus home

| ID | State | Requirement / exact missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M45-01 | DEFECT | Prototype THIS WEEK panel covers multiple weekday meetings and requests; implementation builds it from MEETING_SOON attention only and explicitly says next 48 hours when empty. Validate the true source window; show a complete, scoped seven-day meeting projection rather than representing near-term attention as a week. | Seven-day data fixture with today, later weekday, requested and cancelled meetings; panel equals authorized calendar subset. |
| M45-02 | GAP | Prototype students-to-watch includes inactivity in days, repeated sprint carry-over and load concentration (6 of 9 tasks). Current panel only shows blocked and awaiting-review counts. Requires recorded timestamp/carry/assignment policies before warning claims. | Adversarial 3-sprint fixtures for no movement, multiple carry-overs, work concentration and no false positives. |
| M45-03 | TEST | Needs-you source order says attention first rather than the prototype oldest-first; event-keyed Later is localStorage only. Confirm chronological ordering, read-after-mutation reappearance, cross-device expectation and archived-project suppression. | Sorted multi-kind events, stale versions, account isolation, reload and storage-unavailable tests. |
| M45-04 | TEST | Six-column teams table, archived read-only drilldown, active sprint segmentation, pagination/filter/sort and accurate last recorded event need end-to-end verification at scale. | Multi-project same/foreign-college fixtures and zero-task/archived cases. |

## Screen #46 — Project overview

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M46-01 | GAP | Prototype gives grounded completion trend/forecast, points per sprint and predicted finish date. Code deliberately avoids fabricating these. Define sufficient historical samples, confidence, deadline/tz and incomplete-sprint handling; otherwise show insufficient data rather than invented reassurance. | Calculations tested on stable, accelerating, delayed, zero-estimate and cancelled sprints. |
| M46-02 | TEST | Prototype Next for you links review-then-sign-off directly, along with precise task, blocked, release and final-submission readiness breakdowns. Verify all CTAs navigate to the exact actionable item and refuse invalid state. | Review pending, unsigned sprint, shipped release, final review, archived observer cases. |
| M46-03 | TEST | Student-visible authored brief, goal, deliverables, done checks, personas, dates and next step must round-trip to persisted data; role restrictions for Edit must be checked. | Edit/save/reload, unauthorized field injection, read-only observer and learner comparison. |
| M46-04 | TEST | Seven shared tabs + shell header, next meeting, team and activity summaries must use one authoritative project, sprint and membership scope, not duplicate/count stale hidden records. | Data cross-check across tab and filtered project activity. |

## Screen #47 — Board and task details

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M47-01 | GAP | Prototype supports moving a task to another sprint by List drag/drop; Board provides lane drag. Current Board/List source has sprint grouping and mutation controls but no confirmed accessible cross-sprint drag target/drop ordering and rollback behavior. | Pointer and keyboard moving across sprint/backlog, rejected shipped/completed sprint, concurrent writes. |
| M47-02 | GAP | Prototype selected-task pane places Approve/Send back and required return-note flow inline; vNext uses guarded review confirmation and supplementary full task dialog. Preserve server CAS but match the focus, error, feedback and action-in-pane states. | A/S only for latest IN_REVIEW version, return-note requirement, stale 409 and focus restored. |
| M47-03 | TEST | Scope picker, person/type/priority/search filters and grouped all-sprints List must combine without silently losing tasks or exposing other projects. | 16-sprint fixture, unassigned backlog, collapsed groups, filter intersections and keyboard J/K. |
| M47-04 | TEST | Assignee, blocker response/unblock, edit, delete, comments, status moves and drag are distinct permissions; verify learner/mentor/observer and archived denial per mutation. | Browser and HTTP authorization/CSRF/stale-token tests, no duplicate activity event. |
| M47-05 | TEST | Persistent pane and full dialog must not create conflicting selected-task states after paging, filtering, deletion or server refresh. | Focus/escape/tab, stale selected task, mobile narrow viewport and reduced-motion tests. |

## Screen #48 — Sprints and releases

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M48-01 | TEST | **Implemented, not missing:** NEXT/BACKLOG/DROP per task, optional sign-off note and decision CAS. Validate rollback when one task changed, foreign task, review pending, shipped release, invalid future sprint, duplicate decision or DROP unacknowledged. | Disposable PostgreSQL transaction suite checking every task/activity mutation and rollback. |
| M48-02 | DECISION | Prototype 'Start Sprint 13 now' appears in sign-off; current completion and start-next are separate HTTP transactions, with truthful partial-success. Decide if atomic start-next is required; do not mark as single atomic operation. | Explicit product acceptance or atomic service design, duplicate replay/error cases. |
| M48-03 | DECISION | Prototype 'Drop it' appears lightweight; implementation soft-archives tasks with retained provenance. Confirm archive visibility, permissions, audit and restore implications. | Owner-approved state semantics and archived-task history tests. |
| M48-04 | TEST | Plan/edit sprint, start/reopen, release ship/unship and derived points/backlog chart must respect release gates, race checks and learner vs Mentor authority. | 16-sprint and 3-release fixture; lifecycle HTTP and conflict checks; no hardcoded sample data. |
| M48-05 | TEST | Final sprint-sign-off UI must list only live unfinished tasks, surface review blockers and persisted note, and show state after reloading. | Browser sign-off/reopen with partially completed and IN_REVIEW tasks. |

## Screen #49 — Team and project meetings

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M49-01 | DEFECT | TeamOverview's lastFour takes highest 4 sprint sequence numbers irrespective of lifecycle state. For a project with four future PLANNED sprints, LAST 4 SPRINTS displays future rather than recently worked sprints. Exclude future-only periods; clarify completed/current inclusion. | Fixture with 12 completed + four future planned sprints; expected last four observable sprints. |
| M49-02 | GAP | Prototype LAST ACTIVE is a person-presence signal; code accurately labels LAST TASK CHANGE based on task updatedAt, which is not user login/online presence. Need privacy-approved real activity source or an approved wording difference. | Persisted/authorized user activity model, including inactive/no-consent users, or owner-approved divergence. |
| M49-03 | GAP | Calendar/provider-backed invitations, shared team calendar write, reminder, 'every sprint' recurrence and Meet link creation are not implemented. Scheduling requires user-provided join URL or saves DRAFT. | Real OAuth/configured provider sandbox, token refresh/revoke, invitation, recurrence, timezone and partial failure. |
| M49-04 | TEST | Existing team member role/lead/removal editor must fully match prototype '⋯' action intent and unassign a removed member's tasks according to authorized transactional rule. | Role grant, reassign, group membership, team-lead uniqueness, foreign-college, last-Mentor denial and affected-task tests. |
| M49-05 | TEST | Meeting request answer, agenda, invitees, attendance, action owners, retro notes and follow-up persist but are reached through an editor instead of a one-screen inline flow. | Edit/save/reload, viewer/read-only and request conflict cases; inline-parity decision. |

## Screen #50 — Performance

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M50-01 | DEFECT | PerformanceTable selects last four by sprints.slice(-4), including future PLANNED entries and excluding actual recently worked sprints in the supplied 16-sprint prototype state. Define the last-four completed/active window and fix both #49 and #50 consistently. | 16-sprint fixture with 12 ended, 13–16 future, active-sprint edge cases. |
| M50-02 | GAP | Prototype's per-student WORTH A LOOK explanations (quiet/stuck/concentrated work) are not composed from event/task history in the current numerical summary. | Auditable reason codes and threshold tests; no speculative individual risk labels. |
| M50-03 | TEST | Existing assignment editor/auto-assign must show actual persisted result, load rebalance and communication state; prototype claims students 'were told' but current implementation must not claim delivered notifications without an actual producer. | POST response/transaction, failed delivery, constraints, reload and unequal-workload cases. |
| M50-04 | TEST | All/Current/Last-four/picked-sprint views correctly count Done/Waiting/Open/Carried and points with deleted/archived/tasks carrying across sprints. | Table vs Board/sprint source count reconciliation, zero estimated points, empty team. |

## Screen #51 — Resources

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M51-01 | TEST | Pinned references, Other resources, earlier-sprint disclosure and active/draft/archived filters exist; verify mixed pin/edit permissions and ordering after hidden-row filtering. | Fixture with several release/sprint scopes, hidden drafts and mixed shared visibility. |
| M51-02 | TEST | Share something, upload, URL/link, attach task/sprint, Required, Pin, visibility incl. 'Mentors only', and Save as draft are separate state changes. Confirm every modal field persists and forbidden types/scopes fail. | Same-user edit/reload, learner vs Mentor, file-size/type reject, malicious URL/XSS/CSRF. |
| M51-03 | GAP / TEST | Private stored file preview requires authorized signed read URL, expiration and viewer policy; source support does not establish a complete protected preview flow for every artifact type. | Same/foreign-college browser and HTTP access, expired/revoked link and iframe restrictions. |
| M51-04 | TEST | Counts, resource grouping, pagination/search and completed-sprint fold must remain consistent when a new resource is created or hidden resource filters are active. | 46-resource fixture and mutation/paging checks. |

## Screen #52 — Activity

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M52-01 | GAP | Prototype has durable 'new since you last looked'; current marker is browser-local, counts only currently loaded events, and first load establishes a new cursor. Implement a per-user/per-project server cursor if cross-device semantics are required. | Device A/B, pagination, delete, clock skew, read-after-write and tenancy authorization. |
| M52-02 | GAP | Prototype 'In any sprint' filter is separate from actor filter; existing filtering does not prove persisted exact-sprint scoping of event history. | Sprint-aware event data with legacy untagged event behavior, actor+kind+time intersection. |
| M52-03 | GAP | Prototype shows this-week Comments, Tasks moved, Things shared and Quietest. Current generic activity breakdown counts task/meeting/resource/other event kinds, not actual persisted comment counts or quiet-person insight. | Registered producer taxonomy, exact comment count, assignment-aware quietest rationale. |
| M52-04 | GAP | 'Post an update' creates scoped activity and appears on Overview, but student notification/email fan-out is not persisted/delivered. Define recipients, retry, preference and idempotency policy. | Outbox/event fixtures, subscription preferences, duplicate suppression, negative permission tests. |
| M52-05 | TEST | Event timeline loaded pages, actor filter, time period group, Show the week before and activity link permissions require live coverage; avoid counting only first page as full 1,240-event history. | Multi-page/event-shard fixtures, late-arriving events and inaccessible entity links. |

## Screen #53 — Final submission review

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M53-01 | TEST | Evidence summary, revisions, previous requested changes, repo/demo links and attachments must reflect the latest valid persisted submission rather than unsafe client HTML. | Revision 1/2, failed upload, rejected URL, private signed file and tenant isolation. |
| M53-02 | TEST | Accept/Request changes, issue chips, mandatory feedback, lock/reopen/revision and audit log are present in source but need full CAS and mutation history checks. | Two reviewers racing, stale attempt, archived/observer denial, duplicate POST and lock transition. |
| M53-03 | GAP / TEST | Zoom currently sandbox-embeds safe image/PDF HTTP(S) evidence. Private artifacts need signed URLs; third-party X-Frame-Options may block previews. Provide explicit fallback that remains authorized and no key leaks. | Image/PDF/video/external link matrix with blocked framing and expired signatures. |
| M53-04 | TEST | Exact review dialog action order, decision feedback, 2nd-try history and ready-for-review checklist may differ from prototype. | Browser open/change/accept/reopen histories and data parity; no fake 'all tasks done'. |

## Screen #54 — All-team Meetings

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M54-01 | GAP | Calendar/Meet API OAuth, automatic join link, actual event writes, sync, RSVP, attendee invitations, recurrence and 1-hour reminder are missing; existing .ics is manual export only. | Provider sandbox create/update/cancel, 401/revoke, offset/IST DST cases, partial delivery and idempotency. |
| M54-02 | TEST | Requested meeting Yes (actual time and supplied link), Another time (opens editor), No (audited note) are present. Verify requested->scheduled/rejected state machine and optimistic version race; Another time is not itself saved. | Multi-Mentor competing responses, archived project, hidden project, invalid/unsafe join link. |
| M54-03 | GAP / TEST | Selected meeting displays persisted facilitation but changes to WHO CAME / NOTES / ACTION ITEMS / Follow up require navigating to project meeting editor, not inline controls shown in prototype. | Decide shared inline edit design; same persisted fields, error recovery, authorizations. |
| M54-04 | TEST | Seven-day strip and project/type filters, upcoming/past/requested grouping, cancelled rows and current local-day rollover must be verified on real clock/IST fixture. | Midnight crossover, no meetings, past meetings, recurring group label and per-project filter. |
| M54-05 | TEST | Scheduled-only all-team .ics export uses safe RFC 5545 content. Validate actual Google/Apple/Outlook import, escaping, line-folding, UID stability and cancelled-event handling. | Export/import roundtrip, timezone, special characters and Unicode. |

## Screen #55 — Notifications

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M55-01 | GAP | Six category pills mix personal persisted notifications, transient project attention and announcements, but only the personal source has per-recipient read state. Prototype bell '5 unread' and Mark all read imply a unified view; design recipient read model first. | Cross-source unread 0/1/N, mark one/all, two devices, newly changed attention item reappearing. |
| M55-02 | GAP / TEST | Prototype email policy says only final submissions and meeting requests email; source presence of those producers and user preferences is not established by listing inbox rows. | Email producer/outbox, opt-out, retries, duplicate delivery, permission and privacy audits. |
| M55-03 | TEST | Chronology, action links and cursor-based personal pagination must coexist with scoped attention and college announcements without misleading total/unread counts. | Mixed timestamps and source ordering, boundary/malformed cursor, deleted records. |
| M55-04 | TEST | Archived/removed Mentor project membership must withdraw sensitive notifications and deep links while keeping allowable personal historical notices. | Cross-tenant, removed member, stale link, announcements-disabled cases. |

## Screen #56 — Everywhere: shell/search/bell/profile

| ID | State | Requirement / missing or uncertain behavior | Required closure evidence |
|---|---|---|---|
| M56-01 | GAP | Prototype Ctrl+K is an inline grouped suggestion popup, with keyboard selection/Enter and category context. Current source has command flyout plus full results page; exact popup information hierarchy/result action state has not been reproduced/verified. | Interactive keyboard screen-reader test for open/search/arrows/Enter/Escape/focus restore. |
| M56-02 | TEST | Cross-project search now includes projects, tasks, students and resources; test exact project-permission and active-assignment grant after role switching/removal, query limits and safe href. | Foreign college/task/resource, archived project, missing grant and injection tests. |
| M56-03 | GAP / DECISION | Prototype account detail card includes editable contact details, email notification settings and Google Calendar Connected state. Cannot render Connected without OAuth; edit/prefs may require another authorized profile API. | Source-backed actual profile mutation and preference save; connected/disconnected provider states. |
| M56-04 | TEST | Bell last few notifications, unread count, Mark all read, role-specific menu, legacy retired redirects and multiple-role shell require consistency with #55 and no cross-role skin leakage. | Mentor+Faculty and Admin+TPO accounts, malformed routes, keyboard and logged-out path tests. |

## Shared stop-the-line acceptance queue (not visual defects)

1. **P0 / ACT-01** Fix both #49/#50 last-four-sprint source logic; freeze a single documented definition and add unit + integration fixtures for future PLANNED sprints.
2. **P0 / ACT-02** Verify #48 transactional Next/Backlog/Drop, stale CAS, rollback and release/archive boundaries with disposable PostgreSQL.
3. **P0 / ACT-03** Verify #47 review A/S send-back feedback, task mutation authorization, cross-project isolation and keyboard state; build accessible sprint cross-list drag if required.
4. **P0 / ACT-04** Establish latest main CI evidence: npm run typecheck; npx tsc -p tsconfig.strict.json --noEmit; npm run lint; source contract + unit; PostgreSQL integration; Playwright logged-in Mentor tests. **No command or CI result was observed in this pass.**
5. **P0 / ACT-05** Define provider OAuth/consent/configuration before enabling the prototype's Google Calendar connected, Meet auto-create, invitations, recurrence and reminders. Keep manual URL/.ics features truthful in the meantime.
6. **P1 / ACT-06** Design persisted per-recipient read cursor/state for heterogeneous #55 notifications and #52 cross-device Activity new-since-seen.
7. **P1 / ACT-07** Derive student inactivity/carry/concentration and sprint forecasting from recorded data; expose explicit insufficient-data states, not simulated prototype claims.
8. **P1 / ACT-08** Verify private uploads/evidence/resource signed URLs, revocation, preview fallback and role scope.
9. **P1 / ACT-09** Reconcile #49/#54 inline meeting edits to existing facilitation storage and #56 inline command/profile menus without duplicate, unaudited mutation routes.
10. **P1 / ACT-10** Verify all submitted state transitions with real authored data: scheduled/cancelled meetings, observer/archived views, sprint lifecycle, release ship, final-delivery review.
11. **P1 / ACT-11** Add exact screen-specific tests for main portfolio and seven project tabs, plus Meetings, Notifications and Everywhere; record routes, permissions, browser actions and evidence links per ID above.

## Separate visual gate (do NOT count as function implemented)

After functional gaps and real-data workflows: launch disposable authenticated Mentor fixture, capture running vNext #45–56 at the same 1440px reference viewport and all prototype dialog/keyboard states, compare each original extracted HTML rendering by overlay/diff, then repair shell/body geometry, typography, spacing, mobile focus/overflow and accessibility. Repeat test suites and visual captures after fixes.

**Closure rule:** Individual screen status remains IMPLEMENTED / UNVERIFIED, never VERIFIED or CLOSED, until both that screen's source-backed functional acceptance and actual rendered/browser comparison have proof. This ledger corrects outdated assertions in passes 4–6; do not re-open already implemented carry decisions or meeting facilitation storage on the basis of stale notes.
