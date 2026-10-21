# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-11/l17-u026-notification-controller.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md

## G2-17-026-004  [P2] GAP  facet F03  effort M
- Legacy: API returns ID, title, message, type/context/deep-link metadata; NotificationResponseDTO.java:16-39
- vNext now: NotificationListItem receives title/body, href, readAt, createdAt, module/importance; notifications/page.tsx:49-64
- Fix: Include legacy context labels, course title and job/interview/assessment CTA or document intentional schema replacement.

## G2-17-026-030  [P2] GAP  facet F13  effort M
- Legacy: SSE subscribe 401 unauth/403 access/400 malformed/429 cap; NotificationController.java:244-268
- vNext now: Page displays invalid cursor recovery alert and empty text; notifications/page.tsx:69-94
- Fix: Define transport/auth disconnection and retry UX distinct from empty success.

## G2-17-026-034  [P2] GAP  facet F15  effort M
- Legacy: Legacy has notification types and context labels + job/assessment/interview links; NotificationResponseDTO.java:26-39
- vNext now: vNext carries module/importance/actionHref; notifications/page.tsx:54-63
- Fix: Map type/context and placement actions to safe internal/external CTA semantics.
