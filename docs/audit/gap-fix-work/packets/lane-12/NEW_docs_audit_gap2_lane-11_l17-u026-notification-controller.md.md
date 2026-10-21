# Work packet: NEW / MISSING items from docs/audit/gap2/lane-11/l17-u026-notification-controller.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md

## G2-17-026-001  [P1] GAP  facet F01  effort M
- Legacy: Nine endpoints under `/api/v1/notification` including class/course and personal feeds; NotificationController.java:35,59,88,108,125,142,158,179,214,244,272
- vNext now: Role-specific web inboxes `/notifications`, `/learn/notifications`, `/teacher/notifications`; page.tsx (shared):13-20; page.tsx (learner):14-25; page.tsx (teacher):25-43
- Fix: Map each legacy operation to a role-specific vNext endpoint or explicitly record deprecated contract; do not claim old REST paths remain.
