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

| MEN-projects-meetings-72 | DONE | src/modules/projects/project-notification-service.ts, member-service.ts, meeting-service.ts, task-comment-service.ts, task-assignment-service.ts; tests/unit/chat11-project-notice-persistence-round8.test.ts — `it("MEN-projects-meetings-72 records scoped persistent project event notifications atomically")`; tests/integration/project-notification-r01.test.ts checks real PostgreSQL notices for assigned mentor and learner, comments, meeting requests, changes and archive with duplicate rejection. Test execution pending. |

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

| MEN-projects-meetings-64 | DONE | src/components/projects/project-workspace.tsx, project-delivery-evidence-download.tsx; tests/unit/chat11-mentor-final-evidence.test.ts — `it("MEN-projects-meetings-64 shows author, submitted time, learner notes, typed links, and all recorded version events")` and `it("MEN-projects-meetings-64 opens verified evidence through a same-origin short-lived grant")` |

| MEN-projects-meetings-75 | PARTIAL — task and sprint creation guards | src/components/projects/project-editor-discard-guard.ts, mentor-task-create.tsx, mentor-sprint-write.tsx; tests/unit/chat11-mentor-draft-guard-round8.test.ts — `it("MEN-projects-meetings-75 protects task and sprint drafts against dialog dismiss and page unload")`. Resource guards were already in place. Meeting, task edit, and delivery review editors still need complete unsaved-state coverage. |

| MEN-projects-meetings-75 | PARTIAL — meeting editor guards | project-meeting-controls.tsx; tests/unit/chat11-mentor-meeting-draft-round8.test.ts — `it("MEN-projects-meetings-75 protects meeting requests, scheduling and decision notes")`. Task edit and delivery feedback remain to reconcile. |

| MEN-projects-meetings-75 | PARTIAL — task edit and delivery reopen drafts | src/components/projects/mentor-task-details-edit.tsx and project-delivery-reopen-control.tsx; tests/unit/chat11-mentor-edit-draft-round8.test.ts — `it("MEN-projects-meetings-75 keeps task edit and delivery reopen drafts until confirmed")`. Final delivery feedback editors still to reconcile. |

| MEN-projects-meetings-75 | PARTIAL — final delivery review + rubric guards | project-final-delivery-controls.tsx; tests/unit/chat11-mentor-final-feedback-guard-round8.test.ts — `it("MEN-projects-meetings-75 protects final delivery and evaluation feedback on discard")`. Additional mentor editors and route change guard remain subject to audit. |

### Chat-16 follow-up: project brief notices and final draft recovery (authored, not tested)

| MEN-projects-meetings-72 | PARTIAL | `workspace-brief-service.ts` now sends role-scoped mentor and learner notifications using the same audit activity event and DB transaction; `tests/unit/chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-72. Remaining producer/recipient coverage requires database testing. |
| MEN-projects-meetings-75 | PARTIAL | Additional unsaved release edits, meeting outcomes and delivery feedback now prompt to discard and warn on unload; `mentor-release-editor.tsx`, `project-meeting-controls.tsx`; `chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-75. Navigation-route guards and all editor variants remain pending. |
| MEN-projects-meetings-76 | PARTIAL | Native release deletion confirmation replaced by `ConfirmDialog`; task transition and meeting outcome failures present static retry guidance; `chat16-mentor-draft-recovery-round3.test.ts` — MEN-projects-meetings-76. |

## Chat-16 latest reconciliation — authored source, tests not executed

| ID | Status | Evidence |
|---|---|---|
| MEN-projects-meetings-27 | PARTIAL (typecheck repaired) | `src/components/projects/project-meeting-controls.tsx` — learner request form no longer renders mentor-only facilitation state, while schedule form retains it; `tests/unit/chat16-mentor-editor-guard-r5.test.ts` → `MEN-projects-meetings-27 keeps learner meeting requests free of mentor-only facilitation fields`. Remaining status transition parity is separately tracked. |
| MEN-projects-meetings-R09 | DONE (typecheck repaired) | `src/components/projects/mentor-sprint-details-edit.tsx`, `project-workspace.tsx`; `tests/unit/chat16-mentor-editor-guard-r5.test.ts` → `MEN-projects-meetings-R09 preserves the project estimation unit on the sprint editor`. |
| MEN-projects-meetings-69 | DONE (source; runtime pending) | `src/modules/projects/mentor-calendar-view.ts`, `src/components/projects/mentor-meetings-calendar.tsx`, existing inline `mentor-calendar-load-failure.tsx`; `tests/unit/chat16-mentor-calendar-status-r5.test.ts` → `MEN-projects-meetings-69 shows DRAFT and RESCHEDULED without guessing missing states`, `MEN-projects-meetings-69 does not allow a past rescheduled or cancelled meeting join`. |
| MEN-projects-meetings-75 | PARTIAL | `src/components/projects/mentor-sprint-details-edit.tsx`, `project-editor-discard-guard.ts`; `tests/unit/chat16-mentor-editor-guard-r5.test.ts` → `MEN-projects-meetings-75 guards sprint details across edit and confirmation dialogs`. Client-side navigation and remaining edit surfaces need audit. |
| MEN-projects-meetings-58 | PARTIAL | `src/components/projects/project-resource-files-panel.tsx`; `tests/unit/chat16-mentor-editor-guard-r5.test.ts` → `MEN-projects-meetings-58 MEN-projects-meetings-76 confirms permanent file deletion without window.confirm`. Private files and typed resource rows remain separate. |
| MEN-projects-meetings-76 | PARTIAL | `src/components/projects/project-resource-files-panel.tsx` and the same ID-named test; destructive file deletion has typed ConfirmDialog and explicit permanence warning. Remaining mentor workflows still require confirmation and error-state consistency review. |
| MEN-projects-meetings-57 | PARTIAL | `src/components/projects/project-resource-files-panel.tsx` now shows private upload original filename, status, and last updated/completed time in IST; `tests/unit/chat16-mentor-editor-guard-r5.test.ts` → `MEN-projects-meetings-57 renders private file timestamps in IST beside status`. Full parity with typed resource row/upload integration remains open. |

## Chat-16 safer attention and client-navigation acceptance

| MEN-projects-meetings-73 | DONE (source, browser pending) | `src/modules/projects/mentor-attention.ts` flags PLANNED and ACTIVE idle >=7 days, excludes BLOCKED/COMPLETED/ARCHIVED, and respects later real activity. `src/modules/projects/mentor-attention-kind-model.ts` keeps explicit review-first sorting. `tests/unit/chat16-mentor-attention-stalled-r6.test.ts` names MEN-projects-meetings-73 in three tests. Decision: retain separate personal notifications, announcements and project-attention sections so unread state and source failures remain truthful; do not merge unlike records into a fabricated global timeline. |
| MEN-projects-meetings-75 | PARTIAL (expanded) | `src/components/projects/project-editor-discard-guard.ts` now captures same-tab in-app link navigation before Next's delegated handler, offers discard confirmation, and preserves hard-navigation beforeunload protection. `tests/unit/chat16-mentor-editor-guard-r5.test.ts` → `MEN-projects-meetings-75 intercepts in-app links until the mentor confirms draft discard`. Browser navigation tests and unguarded editor inventory remain release gates. |

## Chat-16 linked resource lifecycle and confirmation decisions

| MEN-projects-meetings-57 | DONE (source; browser/provider pending) | `src/components/projects/project-resource-list.tsx` shows typed status/pin/updated time, `project-resource-open-link.tsx` handles unsafe and popup-blocked links; `project-resource-files-panel.tsx` shows actual private upload status and IST update time. `tests/unit/chat16-reassigned-mentor-parity.test.ts` and `chat16-mentor-editor-guard-r5.test.ts` name MEN-projects-meetings-57. Intentional deviation: private storage downloads use a scoped signed download action and are not disguised as ordinary public URLs. |
| MEN-projects-meetings-58 | NOT-A-GAP (safer linked file design) | `project-resource-files-section.tsx`, `project-resource-files-panel.tsx` and `project-workspace.tsx` permit a file to be associated with an ACTIVE typed resource in its own project, and only TEAM-visible resources may be selected by learners. `project-resource-file-service.ts` independently authorizes signed downloads, scans and uploader scope. `tests/unit/chat16-mentor-resource-link-r6.test.ts` has two MEN-projects-meetings-58 tests. Decision: keep private-file lifecycle distinct from link/note rows, so hard deletion, quarantine and expiration cannot be conflated with the non-destructive archive of a resource. The UI retains an Attached subsection rather than a single mixed row; this is an intentional change, not exact legacy layout parity. |
| MEN-projects-meetings-75 | DONE (source; browser validation pending) | Main task/sprint/resource/meeting/delivery/brief editor forms use `project-editor-discard-guard.ts`: dirty dialogs block dismiss, hard navigations use beforeunload and in-app Links intercept until confirmed discard. `tests/unit/chat16-mentor-editor-guard-r5.test.ts` contains MEN-projects-meetings-75 regression names. Decision: preserve unsaved forms rather than forcing legacy `window.confirm` everywhere. |
| MEN-projects-meetings-76 | DONE (source; browser validation pending) | `mentor-sprint-write.tsx`, `mentor-project-closeout-control.tsx`, `project-lifecycle-actions.tsx` and `project-resource-files-panel.tsx` use typed confirmation for irreversible updates; `mentor-task-details-edit.tsx` and `mentor-sprint-details-edit.tsx` show friendly API errors and suppress raw exception content. `tests/unit/chat16-mentor-friendly-errors-r6.test.ts` has MEN-projects-meetings-76 tests. Decision: scoped confirmation + actionable safe toast/inline error is preferable to an unbounded legacy error modal. |

## Chat-16 verified review-action and upload-draft follow-up

| MEN-projects-meetings-65 | DONE (source; runtime pending) | `src/components/projects/project-final-delivery-controls.tsx` now renders both the decision editor and a real explicit approval/request-change confirmation with `onConfirm` bound to the submission mutation. The admin decision picker is preserved, stale 409 keeps feedback, and unexpected exceptions use customer-safe messages. `tests/unit/chat16-mentor-final-review-r6.test.ts` has two MEN-projects-meetings-65 tests; the previously failing `chat11-mentor-delivery-decision-round3.test.ts` expectation for the admin picker is now present. |
| MEN-projects-meetings-75 | DONE (source; browser pending) | `project-resource-files-panel.tsx` now also guards selected uploads, upload metadata and inline file edits against in-app navigation, hard reload and silent Cancel. `tests/unit/chat16-mentor-editor-guard-r5.test.ts` names MEN-projects-meetings-75 for uploaded-file draft protection. |
