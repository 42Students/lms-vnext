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

| MEN-projects-meetings-55 | DONE | src/components/projects/project-resource-list.tsx; tests/unit/mentor-resource-list-round5.test.ts — `it("MEN-projects-meetings-55 searches resources, filters types and visibility with clear filters and stats")`. Sprint/task filters require corresponding resource associations and remain a separate data-model gap. |
| MEN-projects-meetings-57 | DONE | src/components/projects/project-resource-list.tsx; project-resource-open-link.tsx; tests/unit/mentor-resource-list-round5.test.ts — `it("MEN-projects-meetings-57 lists human-facing resource labels, last update, state and safe links")`. |

| MEN-projects-meetings-74 | DONE | next.config.ts; tests/unit/mentor-navigation-confirmations-round5.test.ts — `it("MEN-projects-meetings-74 safely redirects retired mentor bookmarks")` |
| MEN-projects-meetings-76 | DONE | src/components/projects/mentor-sprint-write.tsx, mentor-project-closeout-control.tsx; tests/unit/mentor-navigation-confirmations-round5.test.ts — `it("MEN-projects-meetings-76 uses styled mentor sprint and project completion confirmation")` |
| MEN-projects-meetings-77 | DONE | src/components/projects/mentor-task-status-transition.tsx; tests/unit/mentor-navigation-confirmations-round5.test.ts — `it("MEN-projects-meetings-77 exposes task-scoped state and blocker field labels")` |

| MEN-projects-meetings-60 | DONE | src/app/api/projects/[projectId]/activity/route.ts, src/components/projects/project-activity-filtered-list.tsx; tests/unit/mentor-activity-pagination-round5.test.ts — `it("MEN-projects-meetings-60 pages real authorized project history with a stable microsecond cursor")` |

## Remaining
MEN-projects-meetings-53/56/58/63/64/65/66/72/75. The notifications page still uses separate personal and project sections; unified priority order needs a follow-up audit. No tests executed here.
