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

## Remaining
MEN-projects-meetings-53/55/56/57/58/60/63/64/65/66/72/74/75/76/77. The notifications page still uses separate personal and project sections; unified priority order needs a follow-up audit. No tests executed here.
