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


| MEN-projects-meetings-53 | DONE | Resource form and persisted optional metadata/sprint-task associations: src/components/projects/project-resource-controls.tsx; src/modules/projects/resource-service.ts; tests/unit/chat11-mentor-resources-round8-verification.test.ts — `it("MEN-projects-meetings-53 persists resource metadata and associated sprint/task IDs")` |
| MEN-projects-meetings-55 | DONE | Mentor resource directory with type/status/sprint/task filters: src/components/projects/project-resource-list.tsx; tests/unit/chat11-mentor-resources-round8-verification.test.ts — `it("MEN-projects-meetings-55 defaults to active and exposes all legacy resource filters")` |
| MEN-projects-meetings-56 | DONE | Active resource drag/keyboard reorder and scoped server mutation: src/components/projects/project-resource-list.tsx; src/modules/projects/resource-service.ts; tests/unit/chat11-mentor-resources-round8-verification.test.ts — `it("MEN-projects-meetings-56 reorders active resources and keeps a safe error fallback")` |
| MEN-projects-meetings-63 | DONE | Mentor lock action, origin-guarded route and atomic delivery history/notice: src/components/projects/mentor-delivery-lock-control.tsx; src/app/api/projects/[projectId]/submissions/[submissionId]/mentor-lock/route.ts; src/modules/projects/mentor-delivery-lock-service.ts; tests/unit/chat11-mentor-resources-round8-verification.test.ts — `it("MEN-projects-meetings-63 protects mentor delivery locking and persists history")` |
| MEN-projects-meetings-77 | DONE | Task scoped select and blocker controls: src/components/projects/mentor-task-status-transition.tsx; tests/unit/mentor-navigation-confirmations-round5.test.ts — `it("MEN-projects-meetings-77 exposes task-scoped state and blocker field labels")` |

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
MEN-projects-meetings-58/75 and partial editor/document integration (57/72/76). The notifications page still uses separate personal and project sections; unified priority order needs a follow-up audit. No tests executed here.

## Chat-16 reassignment verification (source-inspected; tests NOT executed)

| ID | Status | Evidence |
| --- | --- | --- |
| MEN-projects-meetings-60 | DONE (authored; unrun) | `src/components/projects/project-activity-filtered-list.tsx` cursor/duplicate-safe Load more; `tests/unit/chat16-reassigned-mentor-parity.test.ts` `MEN-projects-meetings-60 pages beyond 100 without dropping or duplicating activity` |
| MEN-projects-meetings-61 | DONE (authored; unrun) | `src/modules/projects/mentor-activity-display-model.ts` labels/category and `project-activity-filtered-list.tsx` empty states; `tests/unit/chat16-reassigned-mentor-parity.test.ts` `MEN-projects-meetings-61 shows human-readable labels, category, and legacy empty states` |
| MEN-projects-meetings-67 | DONE (authored; unrun) | `mentor/calendar/page.tsx`, `mentor-meetings-calendar.tsx` legacy heading, action and removal of nonlegacy requested-meeting helper; `tests/unit/chat16-reassigned-mentor-parity.test.ts` `MEN-projects-meetings-67 retains legacy Meetings text and action wording` |
| MEN-projects-meetings-70 | DONE (authored; unrun) | `src/modules/projects/mentor-attention.ts`, `mentor/notifications/page.tsx`; `tests/unit/chat16-reassigned-mentor-parity.test.ts` `MEN-projects-meetings-70 renders legacy notification heading and persisted attention labels` |
| MEN-projects-meetings-74 | DONE (authored; unrun) | Legacy redirect-only routes under `src/app/(authenticated)/mentor/{profile,allQuizzes,fileExplorer,contacts,courses}/`; `tests/unit/chat16-reassigned-mentor-parity.test.ts` `MEN-projects-meetings-74 preserves redirect-only legacy Mentor URLs` |
| MEN-projects-meetings-69 | PARTIAL | `mentor-calendar-load-failure.tsx` inline retry + `mentor/calendar/page.tsx`; `tests/unit/chat16-reassigned-mentor-parity.test.ts` `MEN-projects-meetings-69 keeps meeting load failure inline with a Retry action`. No persisted RESCHEDULED/DRAFT statuses in vNext; do not misreport full parity. |

Remaining reassigned mentor OPEN items require data-model or full UI workflows: MEN-53,55,56,57,58,65,69(status),72,73,75,76. These have not been relabeled DONE merely for partial code. Tests are authored, not run by this lane.

## Chat-16 follow-on mentor editor recovery — source and ID tests authored, not executed

| MEN-projects-meetings-55 | DONE (source authored) | `project-resource-list.tsx` has legacy separate Files / Links / Other counters and required status, type, sprint and task facets; `tests/unit/chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-55 separate tile test. |
| MEN-projects-meetings-57 | PARTIAL | Draft resources display Draft rather than Active; file metadata and uploaded-file row parity still missing; `tests/unit/chat16-mentor-tracker-contract-round2.test.ts` — MEN-projects-meetings-57. |
| MEN-projects-meetings-75 | PARTIAL | `mentor-task-create.tsx`, `mentor-sprint-write.tsx`, `project-meeting-controls.tsx`, `project-delivery-reopen-control.tsx` warn about unsaved draft / feedback before dismissal or unload. Additional mentor editor variants remain to audit. `chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-75. |
| MEN-projects-meetings-76 | PARTIAL | Consistent confirmations for sprint/closeout, safe static failure copy for task, sprint, meeting scheduling, reopen feedback and closeout. Not all mentor mutations covered. `chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-76. |

### Chat-16 follow-up: project brief notices and final draft recovery (authored, not tested)

| MEN-projects-meetings-72 | PARTIAL | `workspace-brief-service.ts` now sends role-scoped mentor and learner notifications using the same audit activity event and DB transaction; `tests/unit/chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-72. Remaining producer/recipient coverage requires database testing. |
| MEN-projects-meetings-75 | PARTIAL | Additional unsaved release edits, meeting outcomes and delivery feedback now prompt to discard and warn on unload; `mentor-release-editor.tsx`, `project-meeting-controls.tsx`; `chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-75. Navigation-route guards and all editor variants remain pending. |
| MEN-projects-meetings-76 | PARTIAL | Native release deletion confirmation replaced by `ConfirmDialog`; task transition and meeting outcome failures present static retry guidance; `chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-76. |
