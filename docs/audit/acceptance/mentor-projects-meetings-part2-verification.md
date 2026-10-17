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


## Chat-11 mentor decision closure

| MEN-projects-meetings-65 | DONE | src/components/projects/project-final-delivery-controls.tsx, project-delivery-reopen-control.tsx; tests/unit/chat11-mentor-delivery-decision-round3.test.ts and tests/unit/chat11-attendance-delivery-recovery.test.ts — `it("MEN-projects-meetings-65 has separate accept, request-change, and revision-reopen confirmations")` |
| MEN-projects-meetings-66 | DONE | src/modules/projects/mentor-final-delivery-decision-service.ts and submission-service.ts; tests/unit/chat11-attendance-delivery-recovery.test.ts — `it("MEN-projects-meetings-66 persists mentor decisions and same-transaction learner notices")` |

| MEN-projects-meetings-64 | DONE | src/components/projects/project-workspace.tsx, project-delivery-evidence-download.tsx; tests/unit/chat11-mentor-final-evidence.test.ts — `it("MEN-projects-meetings-64 shows author, submitted time, learner notes, typed links, and all recorded version events")` and `it("MEN-projects-meetings-64 opens verified evidence through a same-origin short-lived grant")` |

| MEN-projects-meetings-75 | PARTIAL — task and sprint creation guards | src/components/projects/project-editor-discard-guard.ts, mentor-task-create.tsx, mentor-sprint-write.tsx; tests/unit/chat11-mentor-draft-guard-round8.test.ts — `it("MEN-projects-meetings-75 protects task and sprint drafts against dialog dismiss and page unload")`. Resource guards were already in place. Meeting, task edit, and delivery review editors still need complete unsaved-state coverage. |

| MEN-projects-meetings-75 | PARTIAL — meeting editor guards | project-meeting-controls.tsx; tests/unit/chat11-mentor-meeting-draft-round8.test.ts — `it("MEN-projects-meetings-75 protects meeting requests, scheduling and decision notes")`. Task edit and delivery feedback remain to reconcile. |

| MEN-projects-meetings-75 | PARTIAL — task edit and delivery reopen drafts | src/components/projects/mentor-task-details-edit.tsx and project-delivery-reopen-control.tsx; tests/unit/chat11-mentor-edit-draft-round8.test.ts — `it("MEN-projects-meetings-75 keeps task edit and delivery reopen drafts until confirmed")`. Final delivery feedback editors still to reconcile. |

| MEN-projects-meetings-75 | PARTIAL — final delivery review + rubric guards | project-final-delivery-controls.tsx; tests/unit/chat11-mentor-final-feedback-guard-round8.test.ts — `it("MEN-projects-meetings-75 protects final delivery and evaluation feedback on discard")`. Additional mentor editors and route change guard remain subject to audit. |
