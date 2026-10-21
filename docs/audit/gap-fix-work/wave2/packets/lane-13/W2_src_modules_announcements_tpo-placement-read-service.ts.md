# Work packet (wave 2): edit src/modules/announcements/tpo-placement-read-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-19-031-032  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:112-116` — Notices order unexpired pinned first then sent/sendAt/createdAt desc.
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:39-54` — New sorts raw isPinned, createdAt, id; ended pin remains ahead.
- Fix: Sort active pin then COALESCE(sentAt, scheduledAt, createdAt).

## G2-12-023-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:74-96`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:77-106`
- Fix: Legacy GET /from-42 and GET /from-42/unread; vNext list and unread SQL via server render, no same direct endpoint.

## G2-12-023-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:111-125`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:31-73`
- Fix: Legacy notice row contains recipientCount/readCount/audienceLabel, vNext rows include sender, audienceKind and readAt, receipt totals on demand.

## G2-12-023-017  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:111-125`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:39-53`
- Fix: Legacy list sorts active pinned first then newest send/scheduled time; vNext read service sorts by its server query, must check pinned and scheduled precedence.

## G2-12-023-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:93-96`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:78-106`
- Fix: Legacy per-FACULTY unreadFrom42 regardless other TPO readers; vNext per-college receipt aggregation counts one acknowledgment for the cell.

## G2-12-023-038  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:28-35`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:15-26`
- Fix: Legacy p() uses faculty principal college ID, vNext requires TPO role, active selected membership, persisted permission and organization/college scope.

## G2-12-023-046  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:33-42`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:22-25`
- Fix: Legacy audiences always fetched, vNext when announcements or targeted tables unregistered shows availability warning, not false empty.

## G2-12-023-061  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:111-125`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:39-55`
- Fix: Legacy unpaginated pinned-first list, vNext sorted first100 with paging, good scaling but search/navigation semantics differ.

## G2-12-023-067  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:19-95`
- vNext now: `src/modules/announcements/tpo-placement-read-service.ts:15-25`
- Fix: Legacy Spring controller+JDBC queries/notification outbox, vNext Drizzle/Next route+PostgreSQL with staged-table readiness checks.
