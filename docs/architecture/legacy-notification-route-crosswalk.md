# Legacy notification endpoint crosswalk (vNext)

Source of truth: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java` (base `/api/v1/notification`).
This is a **retirement and migration contract**, not a compatibility router.
No legacy numeric ID, class ID, learner ID, creator ID, or faculty ID is accepted as a vNext UUID or trusted as a recipient selector.

| Legacy method and path (suffix to base) | vNext surface | Contract and state |
| --- | --- | --- |
| POST `/createNotification` | POST `/api/announcements/admin` **only for authorized college announcements** | Different audience and lifecycle; not a drop-in authored class/course notification. Old mutation is retired pending a separately authorized staff composer. |
| GET `/fetchAll?pageNo=&pageSize=` | GET `/api/notifications` for **own** recipient only | Super-admin global notification-list contract is retired. Never return everyone's notifications to a personal inbox. |
| GET `/fetch/{id}` | `/learn/notifications` or other authenticated role inbox | No arbitrary numeric-ID fetch alias. The server resolves only recipient-owned UUID rows and tenant-scoped notices. |
| GET `/getNotifications?classId=&courseSlug=&courseId=` | `/learn/notifications` with authorized class/course context; GET `/api/notifications?classId=` or `?courseId=` for recipient-owned reads | Old courseSlug preference is preserved by the learner page's scoped resolver. The generic JSON route accepts one UUID class or course selector, not both simultaneously. |
| GET `/getNotificationsByClassId?classId=&page=&size=` | Recipient-scoped GET `/api/notifications?classId=&limit=` and `/learn/notifications/history` | Old unbounded class/offset read is retired. Historic numeric classes require an explicit trusted import mapping. |
| GET `/getNotificationsForRecipient?recipientId=&page=&size=` | GET `/api/notifications` and the signed-in role's inbox | Recipient ID is always derived from the session; no other user may be chosen by query parameter. |
| PUT `/update/{id}` | No direct equivalent | Old editable HTML/class/course notification is retired; recipient acknowledgement is **not** an author edit. |
| DELETE `/delete/{id}` | No direct equivalent | Old author scoped soft delete is retired; recipient read/mark-all is **not** delete. |
| GET `/subscribe?classId=` (SSE) | Learner inbox foreground refresh, plus manual Refresh | No legacy EventSource endpoint. The learner UI has a bounded 45-second refresh while visible; not a claim of instantaneous SSE parity. |
| DELETE `/deleteNotification?notificationId=` | No direct equivalent | Retired legacy soft-delete alias; intentionally distinct from POST `/api/notifications/read-all`. |

## Rules that survive the route change

- Authenticate before reads. Only the current session's recipient notices and the currently authorized college's notices can appear. Class/course filters refine that authorization rather than grant access.
- Staff authoring must check both the original target and a replacement class/course target against persisted access. No impersonation through `creatorFacultyId` or request-supplied `recipientId`.
- Existing recipient acknowledgements use explicit same-origin POST endpoints. Read-all mutates only the authenticated recipient's read flags; college broadcasts do not acquire a fictional per-person unread count.
- Current in-app notifications and announcements have independent persistence, visibility and scheduling semantics. Do not map the old create/edit/delete endpoints onto unrelated announcements or suppress these differences from callers.
- Migration clients should navigate to the new role route and re-authenticate; a 404 on a retired `/api/v1/notification` path is not evidence that a matching vNext operation succeeded.

Implementation references: `src/app/api/notifications/route.ts`, `src/app/api/notifications/read-all/route.ts`, `src/app/api/announcements/admin/route.ts`, `src/app/(authenticated)/learn/notifications/page.tsx`, `src/components/activity/learner-notifications-inbox.tsx`, and `src/modules/activity/notification-service.ts`.
