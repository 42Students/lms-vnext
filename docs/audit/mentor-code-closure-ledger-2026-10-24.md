# Mentor functional code-closure ledger — 24 October 2026

**Purpose:** Source-code implementation status for the original **132** nonvisual Mentor prototype requirements. This is **not** the second adversarial prototype audit, and not the screen-by-screen end-to-end acceptance record. The original checklist remains unchanged and all tests/permissions/browser gates remain required separately.

**States:**
- **CODE_READY:** The primary requested functional workflow has a concrete source implementation and can enter integration/testing. This is NOT evidence that it compiles, runs, or matches the prototype completely; if tests expose a missing branch, return this item to coding.
- **IMPLEMENTATION_OR_TEST_PENDING:** Cannot yet claim the complete expected behavior solely from source; additional code, linked behavior, or test-led fixes remain.
- **EXTERNAL_INTEGRATION_MISSING:** Provider-backed functionality (OAuth/Calendar/Meet/email) is not present and cannot be replaced by static connected-state copy or a local .ics download.

**Current source-only classification:** 80/132 `CODE_READY`, 45/132 implementation or validation pending, 7/132 clearly missing provider-backed integration. **0/132 formally accepted** under the separate master checklist.

The IDs and descriptions remain authoritative in [mentor-functional-prototype-gap-analysis-2026-10-24.md](./mentor-functional-prototype-gap-analysis-2026-10-24.md). Source evidence names below are within `src/` (usually `modules/projects/` or `components/projects/`).

| ID | Code-first status | Source evidence or next step |
|---|---|---|
| X-01 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| X-02 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| X-03 | CODE_READY | mentor-sprint-signoff-snapshot-service.ts; lifecycle-service.ts; mentor-historical-plan-facts-model.ts |
| X-04 | CODE_READY | mentor-notification-source-receipts-service.ts; mentor-unified-notification-read-all-service.ts |
| X-05 | EXTERNAL_INTEGRATION_MISSING | Review the original acceptance item; implement missing behavior or prove existing source. |
| X-06 | IMPLEMENTATION_OR_TEST_PENDING | task-submission-service.ts now rechecks persisted Learner/Mentor grants inside the locked DB write transaction and requires an ACTIVE nondeleted same-college project for submission/review; two submission/review routes now use bounded strict-UTF8 JSON input. projects-p6a-task-submissions.test.ts adds revoked-role and terminal-state rollback cases; mentor-task-submission-route-body.test.ts adds malformed/oversize/origin route coverage. Sign-off NEXT/BACKLOG/DROP and DB/CI execution remain separate acceptance gates. |
| X-07 | CODE_READY | mentor-attention.ts; mentor-attention-service.ts |
| X-08 | CODE_READY | command-search.tsx; mentor-unified-search-service.ts |
| X-09 | EXTERNAL_INTEGRATION_MISSING | Review the original acceptance item; implement missing behavior or prove existing source. |
| X-10 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 45-01 | CODE_READY | mentor-attention.ts; mentor-prototype-home.tsx |
| 45-02 | CODE_READY | mentor-attention.ts; mentor-prototype-home.tsx; mentor-attention-prototype-classes.test.ts |
| 45-03 | CODE_READY | mentor-attention-later-service.ts; mentor-prototype-home.tsx; mentor/attention/later/route.ts |
| 45-04 | CODE_READY | Mentor Projects now exposes Current / Need you / At risk or blocked / Final submission stage / Archived segments. mentor-portfolio-segment-model.ts maps persisted attention, blocker, submitted drafts/reviews, and genuine signed-off/shipped plan facts; the server filters **before** pagination, soft-deleted release/delivery records are excluded, and search/sort/pagination retain the segment. Unit coverage added in mentor-portfolio-segment-model.test.ts. DB and authenticated browser acceptance pending. |
| 45-05 | CODE_READY | mentor-home-week-meetings-model.ts; mentor-prototype-home.tsx |
| 45-06 | CODE_READY | mentor-student-task-signals-model.ts; mentor-consecutive-carry-service.ts; mentor-consecutive-carry-model.ts; mentor-student-watch-service.ts |
| 45-07 | CODE_READY | mentor-project-team-size-service.ts now separately counts learner seats per project and distinct portfolio learners; mentor/projects/page.tsx uses learner seats for the Students column and full team sizes only for team sorting; faculty-mentor-positive-projects.test.ts covers both counts. PostgreSQL and browser acceptance pending. |
| 45-08 | CODE_READY | mentor-prototype-sprint-summary-service.ts joins persisted releases for project-wide sprint ordering, mentor-project-sprint-position-model.ts supplies chronological active-position and completed/total, project-list.tsx renders tracker and attention state, mentor-project-last-activity-service.ts renders last recorded event. Unit coverage added; DB/browser acceptance pending. |
| 45-09 | CODE_READY | mentor-prototype-home.tsx; mentor-home-greeting-model.ts; mentor-project-team-size-service.ts; mentor/projects/page.tsx (real signed-in greeting, full-portfolio team totals, unique course labels, archived teams, explicit no student-lead field) |
| 45-10 | IMPLEMENTATION_OR_TEST_PENDING | Mentor list navigation now preserves the canonical `page1` selector and imported `legacyPage` bookmarks through singleValueMentorFilters; mentor-project-pagination-filter-regression.test.ts covers page 3/4, zero-based bookmarks, duplicate parameter rejection and segment reset. Large PostgreSQL datasets, revoked roles, Later reopening and archived browser acceptance remain. |
| 46-01 | CODE_READY | mentor-historical-plan-facts-model.ts; mentor-estimated-finish-model.ts; mentor-prototype-project-summaries.tsx |
| 46-02 | CODE_READY | mentor-blocker-age-service.ts; mentor-blocker-age-model.ts; mentor-prototype-project-summaries.tsx |
| 46-03 | CODE_READY | mentor-project-focus-queue.tsx; mentor-attention-service.ts; mentor-attention-later-service.ts; mentor-prototype-project-summaries.tsx |
| 46-04 | CODE_READY | workspace-brief-editor.tsx; mentor-prototype-project-summaries.tsx; project-workspace.tsx |
| 46-05 | CODE_READY | mentor-prototype-project-summaries.tsx; mentor-prototype-performance-table.tsx |
| 46-06 | IMPLEMENTATION_OR_TEST_PENDING | Next meeting Overview shows true ceremony/status, agenda, duration, safe join and recorded participant names, with a direct meeting link. No persisted RSVP/invitation delivery record exists; do not claim invitations were sent or accepted. |
| 46-07 | CODE_READY | mentor-prototype-project-summaries.tsx; readiness-service.ts |
| 46-08 | CODE_READY | mentor-prototype-project-summaries.tsx; activity-service.ts |
| 46-09 | IMPLEMENTATION_OR_TEST_PENDING | mentor-overview-quick-actions.tsx now adds task, sprint, release and resource entry points with read-only gating and existing mutation APIs; authentic learner-view simulation and post-mutation authenticated checks still missing. |
| 46-10 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 47-01 | CODE_READY | mentor-lane-board.tsx; mentor-board-sprint-groups-model.ts; mentor-sprint-order-model.ts (release-local sprint scope with counts, URL-persisted selection and independently paged full-history groups) |
| 47-02 | CODE_READY | mentor-lane-board.tsx; mentor-board-lane-paging-model.ts |
| 47-03 | CODE_READY | mentor-lane-board.tsx; mentor-backlog-service.ts |
| 47-04 | CODE_READY | mentor-lane-board.tsx |
| 47-05 | CODE_READY | mentor-lane-board.tsx; mentor-task-criteria-checklist.tsx; mentor-task-history.tsx; mentor-blocker-age-service.ts |
| 47-06 | CODE_READY | mentor-lane-board.tsx; mentor-backlog-service.ts |
| 47-07 | CODE_READY | mentor-lane-board.tsx; project-task-comments.tsx |
| 47-08 | CODE_READY | mentor-lane-board.tsx; project-lifecycle-actions.tsx; mentor-review-next-focus-model.ts; task submission review route (required send-back feedback, version CAS, next visible review focus after success) |
| 47-09 | CODE_READY | mentor-lane-board.tsx; mentor-board-keyboard-focus-model.ts; mentor-board-keyboard-focus-model.test.ts |
| 47-10 | CODE_READY | mentor-lane-board.tsx; mentor-task-transition service and route; project-api.ts |
| 47-11 | CODE_READY | mentor-lane-board.tsx; mentor-board-lane-paging-model.ts; list Show 150 more |
| 47-12 | CODE_READY | mentor-lane-board.tsx; mentor-board-task-detail-dialog.tsx; mentor-transition and backlog authorization routes |
| 48-01 | CODE_READY | lifecycle-service.ts; mentor-sprint-signoff-snapshot-model.ts; mentor-sprint-signoff-snapshot-service.ts |
| 48-02 | CODE_READY | mentor-sprint-timeline-search.tsx; mentor-prototype-project-summaries.tsx |
| 48-03 | CODE_READY | mentor-prototype-project-summaries.tsx renders Add Release, per-release Edit and Add Sprint using existing authorized MentorReleaseEditor/MentorSprintCreate; mentor-sprint-write.tsx preselects the contextual release even with several releases. Runtime and permissions tests remain separate acceptance gates. |
| 48-04 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 48-05 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 48-06 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 48-07 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 48-08 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 48-09 | CODE_READY | mentor-sprint-write.tsx; mentor-sprint-planning-defaults-model.ts; mentor-sprint-backlog-pull.tsx; mentor-backlog-service.ts; mentor-sprint-write-service.ts (release-scoped sequence, seven-day editable plan, server date validation and explicit version-checked backlog pull) |
| 48-10 | CODE_READY | mentor-sprint-velocity-model.ts; mentor-historical-plan-facts-model.ts; mentor-prototype-project-summaries.tsx |
| 48-11 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 48-12 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 49-01 | IMPLEMENTATION_OR_TEST_PENDING | Team roster now uses mentor-team-recent-actor-service.ts for persisted action-by-person timestamps, not task owner updates, and the parallel canonical mentor-learner-academic-facts-service.ts resolves roll/registration, department/program/cohort for authorized active learners; integration coverage added in learner-project-activity-filters.test.ts. Still reconcile prototype student lead/year labels and execute real DB/browser gates. |
| 49-02 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 49-03 | IMPLEMENTATION_OR_TEST_PENDING | Team removal now atomically clears unfinished task owners, preserves DONE ownership and emits task audit events/mentor alert (member-service.ts; projects-p4-members.test.ts). But the prototype's Mentor-facing promote-lead/edit/removal workflow conflicts with current College Admin-only roster policy; authorization/product reconciliation and runtime tests remain. |
| 49-04 | CODE_READY | mentor-meetings-calendar.tsx; mentor-meeting-list-filter-model.ts (all/review/retro/planning/standup/other quick filters; coming, requested, past, notes missing; bounded earlier history expansion) |
| 49-05 | CODE_READY | mentor-calendar-service.ts; mentor-meetings-calendar.tsx; mentor-meeting-request-actions.tsx (persisted requester/task/suggested slot; Yes/Another time/No with exact version-checked project APIs) |
| 49-06 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 49-07 | CODE_READY | mentor-meeting-facilitation-quick-edit.tsx; mentor-meeting-notes-service.ts; mentor-meetings-calendar.tsx |
| 49-08 | EXTERNAL_INTEGRATION_MISSING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 49-09 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 49-10 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 49-11 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 50-01 | CODE_READY | mentor-prototype-performance-table.tsx now offers release range and individually picked sprints across releases; mentor-performance-range-model.ts validates the authorized sprint selection (unit tests authored). Historical sign-off snapshot requirement remains; DB/browser verification pending. |
| 50-02 | CODE_READY | mentor-sprint-signoff-snapshot-model.ts; mentor-prototype-performance-table.tsx |
| 50-03 | CODE_READY | mentor-point-stack-model.ts; mentor-prototype-performance-table.tsx; mentor-sprint-signoff-snapshot-model.ts |
| 50-04 | CODE_READY | mentor-member-points-sparkline-model.ts; mentor-performance-insights-model.ts; mentor-prototype-performance-table.tsx |
| 50-05 | CODE_READY | mentor-performance-insights-model.ts; mentor-prototype-performance-table.tsx |
| 50-06 | CODE_READY | mentor-task-allocation.tsx and mentor-auto-assign-service.ts use nextMentorAllocatableSprint for first available planned sprint in project-wide release order; next-release sequence resets no longer reject legitimate allocation. PostgreSQL denial/positive regression authored, not executed. |
| 50-07 | CODE_READY | mentor-next-sprint-assignment-model.ts and mentor-task-allocation.tsx; client allocation preview and server transaction share release-aware target selection, and preserve assignment point-balancing/recipient notification. |
| 50-08 | CODE_READY | task-assignment-service.ts; mentor-auto-assign-service.ts; project-notification-service.ts (single, all-project and next-sprint assignments notify current active learner in the transaction) |
| 50-09 | IMPLEMENTATION_OR_TEST_PENDING | Removed learners' unfinished tasks are now reassigned to the unassigned queue with CAS timestamp advances; DONE owners remain historical. Historical carried/review cases and full performance test matrix still pending. |
| 50-10 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 51-01 | CODE_READY | project-resource-list.tsx; mentor-resource-sharer-service.ts |
| 51-02 | CODE_READY | mentor-resource-groups-model.ts; project-resource-list.tsx (pinned, active/planned/earlier sprint, whole-project counts, show earlier; grouping off for reorder) |
| 51-03 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 51-04 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 51-05 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 51-06 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 51-07 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 51-08 | CODE_READY | project-resource-files-panel.tsx; project-resource-file-service.ts inline signed grants; mentor-private-resource-preview-model.ts (PDF/image preview, safe download fallback for spreadsheets/code) |
| 51-09 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 52-01 | CODE_READY | mentor-activity-category-model.ts; project-activity-filtered-list.tsx (seven prototype category pills, persisted event taxonomy, AND filters) |
| 52-02 | CODE_READY | ProjectActivityFilteredList now passes Sprint and person selections to a project-scoped server cursor; activity-service.ts applies Sprint metadata/subject matching before the row limit; route/model reject malformed Sprint IDs, and 101-event PostgreSQL coverage added. Runtime acceptance pending. |
| 52-03 | CODE_READY | activity-service.ts; learner-project-activity-filter-model.ts; project-activity-filtered-list.tsx; member-service.ts (full roster actor picker + SQL-scoped actor cursor pagination) |
| 52-04 | CODE_READY | mentor-activity-seen-service.ts; mentor-activity-since-last-visit.tsx |
| 52-05 | CODE_READY | project-activity-filtered-list.tsx |
| 52-06 | CODE_READY | mentor-week-activity-totals-service.ts aggregates full authorized IST-week Tasks moved, Comments, Resources shared in PostgreSQL; workspace-view-service.ts passes results, project-activity-filtered-list.tsx identifies loaded-page fallback, and mentor-week-contributor-service.ts counts all authorized learner activity. DB acceptance pending. |
| 52-07 | CODE_READY | mentor-project-update-service.ts now commits Mentor project activity and in-app notices to current active learner/Mentor recipients in one transaction, with role-appropriate links; only the source actor is omitted. learner-project-activity-filters.test.ts verifies learner delivery, actor exclusion, idempotency, scoped denial and archived projects. No email, Meet or external provider integration is claimed. PostgreSQL execution pending. |
| 52-08 | IMPLEMENTATION_OR_TEST_PENDING | activity-service.ts now pages via PostgreSQL microsecond cursor, filters actor+Sprint in SQL, retrieves authorized metadata-free/soft-deleted Sprint history through owned Sprint joins, and enforces college+organization+project; mentor-activity-date-filter-model.ts uses IST calendar dates and handles invalid timestamps. Unit/PG cases authored; need executed cursor/same-ms, imported-event and timezone acceptance. |
| 52-09 | CODE_READY | mentor-updates POST now enforces strict UTF-8, JSON MIME and a 4KB streamed request budget before buffering, using the shared bounded reader. mentor-project-update-service.ts holds an active project lock, rechecks persisted Mentor grant, serializes 3/min and 20/hour quotas, coalesces duplicate and concurrent retries, atomically persists event and active recipient notices, and maps quota to HTTP 429. Unit route and PostgreSQL tests authored; CI/DB not yet green. |
| 53-01 | CODE_READY | mentor-submission-attribution-model.ts; mentor-prototype-project-summaries.tsx; submission-service.ts (latest revision, persisted submitter, timestamp and saved notes) |
| 53-02 | CODE_READY | mentor-evidence-gallery.tsx; mentor-evidence-preview-model.ts |
| 53-03 | IMPLEMENTATION_OR_TEST_PENDING | mentor-evidence-preview-model.ts now classifies recognized README, text, CSV, JSON and source-code formats for sandboxed read-only iframe previews in mentor-evidence-gallery.tsx, alongside existing PDF page/zoom, images and videos. External provider frame restrictions and XLSX trial-summary parsing remain unresolved; fallback links are explicit. Unit MIME/URL safety coverage updated, runtime acceptance pending. |
| 53-04 | IMPLEMENTATION_OR_TEST_PENDING | mentor-delivery-prechecks-model.ts and MentorPrototypeDeliveryEvidence now show five real checks and the exact server readiness decision. Prototype depicts release-shipment/deadline as gates; old LMS policy treats these as advisory. Policy reconciliation and tests remain; do not fabricate hard gating. |
| 53-05 | CODE_READY | mentor-evidence-revision-model.ts; mentor-prototype-project-summaries.tsx |
| 53-06 | CODE_READY | project-final-delivery-controls.tsx; mentor-final-delivery-decision-model.ts; mentor-final-delivery-decision-service.ts (Accept / Request changes, four quick reason pills, required feedback, confirmation, stale-version reject, auditable server decision) |
| 53-07 | IMPLEMENTATION_OR_TEST_PENDING | mentor-final-delivery-decision-service.ts records terminal approval locks and immutable reviews in one transaction. mentor-final-delivery-reopen-r01.test.ts checks replay denial and exactly one review/learner notice; mentor-board-health.test.ts adds CHANGES_REQUESTED feedback, stale CAS, single notice and absence of lock. Browser, PostgreSQL execution and due-date/version acceptance remain open. |
| 53-08 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 53-09 | CODE_READY | mentor-delivery-history.tsx |
| 53-10 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 54-01 | CODE_READY | mentor-calendar-week-workload-model.ts; mentor-meetings-calendar.tsx |
| 54-02 | CODE_READY | mentor-calendar-filter-model.ts; mentor/calendar/page.tsx |
| 54-03 | CODE_READY | mentor-meeting-request-actions.tsx implements inline Yes / Another time / No using same-origin audited PATCH and mentor-decision routes, future IST time validation, actual join URL and CAS; mentor-meeting-form-model.ts records true alternative-window semantics. Integration/browser acceptance pending. |
| 54-04 | CODE_READY | mentor-meetings-calendar.tsx exposes an upcoming safe Join link plus inline Move via MentorMeetingReschedule and Cancel via mentor-meeting-cancel-inline.tsx, both reusing authorized stale-token/overlap/audit/notification transactions. Live acceptance pending. |
| 54-05 | CODE_READY | mentor-meeting-facilitation-quick-edit.tsx; mentor-meeting-facilitation-model.ts; mentor-meetings-calendar.tsx |
| 54-06 | EXTERNAL_INTEGRATION_MISSING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 54-07 | CODE_READY | mentor-calendar-quick-schedule.tsx; mentor-calendar-service.ts |
| 54-08 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 54-09 | CODE_READY | mentor-calendar-ics-model.ts; mentor-meetings-calendar.tsx |
| 54-10 | IMPLEMENTATION_OR_TEST_PENDING | meeting-service.ts serializes scheduling by project lock and organizer advisory lock, rechecks persisted Mentor membership/status, prevents interval overlaps and validates IST windows, CAS tokens and future times. projects-p7b-meetings.test.ts now adds competing same-Mentor bookings across two projects and an adjacent-boundary success case; database execution, revoked-in-flight rights and foreign-viewer confirmation remain. |
| 54-11 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 55-01 | CODE_READY | mentor-unified-notification-feed.tsx; mentor-notification-source-receipts-service.ts |
| 55-02 | CODE_READY | mentor-unified-notification-read-all-service.ts; mentor-unified-read-all.tsx |
| 55-03 | CODE_READY | mentor-unified-notification-feed.tsx; mentor-unified-notification-model.ts |
| 55-04 | CODE_READY | mentor-unified-notification-feed.tsx; mentor-unified-notification-model.ts; mentor-source-notification-read.tsx; mentor notification read routes |
| 55-05 | EXTERNAL_INTEGRATION_MISSING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 55-06 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 55-07 | IMPLEMENTATION_OR_TEST_PENDING | Personal notifications and announcements page independently; mentor-unified-notification-read-all-service.ts bulk-acknowledges all current recipient notices with an advisory lock, and a new PostgreSQL case spans 74+ personal receipts, verifies other recipients remain unread and checks idempotency/fresh notifications. CI execution, filter-specific badge totals and concurrent source refresh are still unverified. |
| 55-08 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 56-01 | CODE_READY | command-search.tsx includes grouped in-place Mentor results and keyboard navigation; mentor-unified-search-service.ts targets exact Board task and Performance student, plus newly anchors matching resource cards through project-resource-list.tsx. Authenticated browser/focus verification pending. |
| 56-02 | CODE_READY | mentor-unified-search-service.ts; mentor-search-ranking-model.ts; mentor/search/page.tsx (4 scoped categories, owner context, ranking, term highlighting, bounded pagination) |
| 56-03 | CODE_READY | mentor-notification-bell-preview.tsx; mentor/notifications/preview/route.ts; mentor-unified-notification-model.ts |
| 56-04 | CODE_READY | mentor-account-overview-service.ts; mentor-account-summary-model.ts; mentor/account/page.tsx; account-menu.tsx |
| 56-05 | EXTERNAL_INTEGRATION_MISSING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 56-06 | EXTERNAL_INTEGRATION_MISSING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 56-07 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 56-08 | CODE_READY | next.config.ts; mentor-retired-route-parity.test.ts |
| 56-09 | IMPLEMENTATION_OR_TEST_PENDING | Review the original acceptance item; implement missing behavior or prove existing source. |
| 56-10 | IMPLEMENTATION_OR_TEST_PENDING | mentor-unified-search-service.ts builds category results only from assigned projects, then rechecks persisted user, Mentor role, membership, project assignment, college and undeleted project before returning any student/task/resource match. learner-project-activity-filters.test.ts adds search revocation and foreign-college denial cases. Bell/source privacy and actual cross-tab timing/browser verification still pending. |

**Code-closure exit:** Every row reaches CODE_READY based on its exact behavior (not just an adjacent component); then run strict TypeScript, lint, unit, PostgreSQL integration, authorization, and browser interaction tests. Fix all failed paths. Only **then** execute the deliberately deferred second hostile prototype audit and, later, visual acceptance.
