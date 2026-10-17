# Mentor Projects / Meetings part 2 — chat-11 verification

DONE means source implemented and ID-named tests authored, not executed or certified.

| ID | Status | Evidence |
|---|---|---|
| MEN-projects-meetings-67 | DONE | src/app/(authenticated)/mentor/calendar/page.tsx, src/components/projects/mentor-meetings-calendar.tsx; tests/unit/mentor-meetings-round4.test.ts — `it("MEN-projects-meetings-67 matches meeting subtitle and join action")` |
| MEN-projects-meetings-68 | DONE | src/modules/projects/mentor-calendar-view.ts; tests/unit/mentor-meetings-round4.test.ts — `it("MEN-projects-meetings-68 marks same-day ended scheduled meeting MISSED")` |
| MEN-projects-meetings-69 | DONE | src/app/(authenticated)/mentor/calendar/error.tsx; tests/unit/mentor-meetings-round4.test.ts — `it("MEN-projects-meetings-69 presents friendly retry for meeting load failure")` |
| MEN-projects-meetings-70 | DONE | src/modules/projects/mentor-attention.ts, src/app/(authenticated)/mentor/notifications/page.tsx; tests/unit/mentor-meetings-round4.test.ts — `it("MEN-projects-meetings-70 restores legacy attention copy")` |
| MEN-projects-meetings-73 | DONE | src/modules/projects/mentor-attention.ts; tests/unit/mentor-meetings-round4.test.ts — `it("MEN-projects-meetings-73 flags idle planned projects, not blocked or completed")` |
| MEN-projects-meetings-54 | DONE | src/components/projects/project-resource-controls.tsx, src/components/projects/project-workspace.tsx; tests/unit/mentor-activity-round4.test.ts — `it("MEN-projects-meetings-54 offers mentor-only visibility and row tag")` |
| MEN-projects-meetings-59 | DONE | src/components/projects/project-activity-filtered-list.tsx; tests/unit/mentor-activity-round4.test.ts — `it("MEN-projects-meetings-59 supports activity source and bounded date range filters")` |
| MEN-projects-meetings-61 | DONE | src/modules/projects/mentor-activity-display-model.ts, src/components/projects/project-activity-filtered-list.tsx; tests/unit/mentor-activity-round4.test.ts — `it("MEN-projects-meetings-61 humanizes activity type, category and empties")` |
| MEN-projects-meetings-62 | DONE | src/modules/projects/mentor-activity-display-model.ts, src/components/projects/project-activity-filtered-list.tsx; tests/unit/mentor-activity-round4.test.ts — `it("MEN-projects-meetings-62 renders relative time with exact timestamp on hover")` |
| MEN-projects-meetings-71 | DONE | src/app/(authenticated)/mentor/notifications/page.tsx; tests/unit/mentor-meetings-round4-source-failure.test.ts — `it("MEN-projects-meetings-71 preserves other sources and shows Retry sources when a feed fails")` |


## Partial (still open)

- MEN-projects-meetings-57: The safe link and legacy action labels are implemented, but file metadata, resource statuses and updated-time tags still differ. Test: `it("MEN-projects-meetings-57 shows Open link and guards invalid or blocked resource windows")` in `tests/unit/college-mentor-round7-gap-verification.test.ts`.
- MEN-projects-meetings-65: Accept/request-change copy is improved, but the legacy separate decision dialogs and stale-state UX are not fully restored. Test: `it("MEN-projects-meetings-65 uses submission decision wording and exact feedback")` in `tests/unit/college-mentor-round7-gap-verification.test.ts`.

| MEN-projects-meetings-55 | PARTIAL | src/components/projects/project-resource-list.tsx; tests/unit/mentor-resource-list-round5.test.ts — `it("MEN-projects-meetings-55 searches resources, filters types and visibility with clear filters and stats")`. Sprint/task filters require corresponding resource associations and remain a separate data-model gap. |
| MEN-projects-meetings-57 | PARTIAL | src/components/projects/project-resource-list.tsx; project-resource-open-link.tsx; tests/unit/mentor-resource-list-round5.test.ts — `it("MEN-projects-meetings-57 lists human-facing resource labels, last update, state and safe links")`. |

| MEN-projects-meetings-74 | DONE | next.config.ts; tests/unit/mentor-navigation-confirmations-round5.test.ts — `it("MEN-projects-meetings-74 safely redirects retired mentor bookmarks")` |
| MEN-projects-meetings-76 | PARTIAL | src/components/projects/mentor-sprint-write.tsx, mentor-project-closeout-control.tsx; tests/unit/mentor-navigation-confirmations-round5.test.ts — `it("MEN-projects-meetings-76 uses styled mentor sprint and project completion confirmation")` |
| MEN-projects-meetings-77 | PARTIAL | src/components/projects/mentor-task-status-transition.tsx; tests/unit/mentor-navigation-confirmations-round5.test.ts — `it("MEN-projects-meetings-77 exposes task-scoped state and blocker field labels")` |

| MEN-projects-meetings-60 | DONE | src/app/api/projects/[projectId]/activity/route.ts, src/components/projects/project-activity-filtered-list.tsx; tests/unit/mentor-activity-pagination-round5.test.ts — `it("MEN-projects-meetings-60 pages real authorized project history with a stable microsecond cursor")` |

| MEN-projects-meetings-72 | PARTIAL | src/modules/projects/project-notification-service.ts, meeting-service.ts, task-comment-service.ts, task-assignment-service.ts, member-service.ts, resource-service.ts, mentor-final-delivery-decision-service.ts; tests/unit/mentor-notifications-round5.test.ts — `it("MEN-projects-meetings-72 persists transactional mentor project notices for meeting, comment, task, delivery, team and resource events")`. In-app delivery checks active same-college membership. |

## Partial editor recovery

- MEN-projects-meetings-75: Resource create/edit dialogs now confirm dirty discards and protect page unload; task, sprint, meeting, and delivery editors still need matching recovery. Test: `it("MEN-projects-meetings-75 keeps dirty project resource drafts on close or unload")` in `tests/unit/mentor-resource-dirty-round5.test.ts`.

## Remaining
MEN-projects-meetings-53/56/58/63/64/65/66/75. The notifications page still uses separate personal and project sections; unified priority order needs a follow-up audit. No tests executed here.


## Chat-11 mentor decision closure

| MEN-projects-meetings-65 | DONE | src/components/projects/project-final-delivery-controls.tsx, project-delivery-reopen-control.tsx; tests/unit/chat11-mentor-delivery-decision-round3.test.ts and tests/unit/chat11-attendance-delivery-recovery.test.ts — `it("MEN-projects-meetings-65 has separate accept, request-change, and revision-reopen confirmations")` |
| MEN-projects-meetings-66 | DONE | src/modules/projects/mentor-final-delivery-decision-service.ts and submission-service.ts; tests/unit/chat11-attendance-delivery-recovery.test.ts — `it("MEN-projects-meetings-66 persists mentor decisions and same-transaction learner notices")` |

| MEN-projects-meetings-64 | DONE | src/components/projects/project-workspace.tsx, project-delivery-evidence-download.tsx; tests/unit/chat11-mentor-final-evidence.test.ts — `it("MEN-projects-meetings-64 shows author, submitted time, learner notes, typed links, and all recorded version events")` and `it("MEN-projects-meetings-64 opens verified evidence through a same-origin short-lived grant")` |

## Chat-16 reassignment checkpoint — 2026-10-17 (source/test authored, tests not run)

The entries below supersede earlier PARTIAL/DONE claims for this 32-gap reassignment when their disposition differs. A test name is source-level evidence only until CI and browser/database acceptance execute.

| ID | Disposition | Evidence / remaining work |
|---|---|---|
| MEN-projects-meetings-53 | DONE (source authored) | `src/components/projects/project-resource-controls.tsx`, `src/modules/projects/resource-service.ts`, registered 0133 resource metadata; `tests/unit/chat16-reassigned-mentor-parity.test.ts` and `tests/unit/chat16-mentor-tracker-contract-round2.test.ts` — MEN-projects-meetings-53. Verify registered SQL on disposable PostgreSQL. |
| MEN-projects-meetings-55 | PARTIAL | Resource search, metadata/status/sprint/task filters and reset exist in `project-resource-list.tsx`; source test MEN-projects-meetings-55 in `chat16-mentor-tracker-contract-round2.test.ts`. Files tile and unified uploaded-file rows still differ from legacy. |
| MEN-projects-meetings-56 | DONE (source authored) | `resource-service.ts` validates owned active set and collision-safe sequence reorder, `project-resource-list.tsx` supports drag and accessible move; source tests MEN-projects-meetings-56 in `chat16-reassigned-mentor-parity.test.ts` and round2. |
| MEN-projects-meetings-57 | PARTIAL | Draft now labels Draft rather than Active; type, pinned, link and updated metadata displayed in `project-resource-list.tsx`; source test MEN-projects-meetings-57 in round2. File metadata and unified open-file row remain open. |
| MEN-projects-meetings-58 | OPEN | Attached files remain separate from resource records and their delete/archive semantics differ; do not claim unified file records. |
| MEN-projects-meetings-60 | DONE (source authored) | Cursor pagination and deduplication in `project-activity-filtered-list.tsx`; ID-named tests in `mentor-activity-pagination-round5.test.ts`. |
| MEN-projects-meetings-61 | DONE (source authored) | Humanized activities in `mentor-activity-display-model.ts`; ID-named tests in `mentor-activity-round4.test.ts`. |
| MEN-projects-meetings-65 | DONE (source authored) | Separate final-delivery decision confirms and stale-review guidance, `project-final-delivery-controls.tsx`, ID-named `chat11-mentor-delivery-decision-round3.test.ts`. |
| MEN-projects-meetings-67 | DONE (source authored) | Calendar copy and links, `mentor-meetings-round4.test.ts` and `chat16-reassigned-mentor-parity.test.ts`. |
| MEN-projects-meetings-69 | PARTIAL | Inline calendar Retry is implemented and ID-tested in `chat16-reassigned-mentor-parity.test.ts`, but RESCHEDULED and DRAFT meeting states are not fully represented. |
| MEN-projects-meetings-70 | DONE (source authored) | Legacy attention copy and notification labels in `mentor-meetings-round4.test.ts` and reassigned tests. |
| MEN-projects-meetings-72 | PARTIAL | Transactional mentor notices exist in `project-notification-service.ts`, meeting/comment/task/member/resource decision services, ID-named `mentor-notifications-round5.test.ts` and round2. Verify project-updated, member-removed and end-to-end recipient coverage on database. |
| MEN-projects-meetings-73 | PARTIAL | PLANNED idle project rule source-tested by MEN-projects-meetings-73 in round2, but the page still splits priority-ordered notice types into separate sections. |
| MEN-projects-meetings-74 | DONE (source authored) | Legacy mentor bookmark redirects in `next.config.ts` and redirect page shims; `mentor-navigation-confirmations-round5.test.ts`. |
| MEN-projects-meetings-75 | PARTIAL | Resources warn before discarding drafts, `mentor-resource-dirty-round5.test.ts`; analogous task/sprint/meeting/delivery leave protections remain incomplete. |
| MEN-projects-meetings-76 | PARTIAL | Closeout and sprint `ConfirmDialog` controls, closeout now displays customer-safe retry guidance (no internal exception text), `chat16-mentor-tracker-contract-round2.test.ts` — MEN-projects-meetings-76. Confirmations and recovery across the remaining mentor actions are incomplete. |
