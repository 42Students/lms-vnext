# Legacy NotificationController endpoint crosswalk — lane chat-18

Scope: legacy `/api/v1/notification` versus role-scoped vNext notifications. This is **not** a routing shim. No numeric ID, class ID, creator ID, or arbitrary recipient is accepted as vNext authorization. The old endpoints are deprecated; only real vNext endpoints below are asserted.

| Legacy method/path | vNext operation / state | Migration and authorization note |
|---|---|---|
| POST /createNotification | No generic public CRUD equivalent; restricted server `deliverInAppNotification` producer | Staff/class composer must enforce faculty or admin plus persisted college/course audience before write; no caller-supplied recipients |
| GET /fetchAll | Deprecated; no global vNext personal inbox read | Old admin-wide paging cannot be mapped to personal user-owned GET; create a separately authorized scoped admin reader if required |
| GET /fetch/{id} | Deprecated arbitrary notification detail | Resolve legacy integer ID server-side only after recipient/creator authorization; no ID guessing |
| GET /getNotifications | GET `/api/notifications` for signed-in user's own inbox | Uses current user identity and bounded limit, not unscoped class or admin records |
| GET /getNotificationsByClassId | Deprecated | Resolve class/course to active membership and authorized recipient notification records; never trust classId alone |
| GET /getNotificationsForRecipient | GET `/api/notifications` only for current authenticated user | Supplied legacy recipientType / integer recipient ID cannot select another user |
| PUT /update/{id} | Deprecated | Needs dedicated staff edit with old and new class/course permission checks and actor ownership |
| DELETE /delete/{id} | Deprecated | Historical staff delete with exact `Notification deleted successfully` message is not a vNext personal read action |
| GET /subscribe | Deprecated SSE | vNext role inbox is server-read; no unauthenticated subscription or false claim of live updates |
| DELETE /deleteNotification?notificationId=... | Deprecated | Historical delete query used `Deleted notification successfully`; must not be aliased to mark-read |

The supported per-recipient acknowledgement is POST `/api/notifications/[notificationId]/read` (same-origin, caller-owned). It is **not** a delete/edit/create endpoint. Role UIs: `/notifications`, `/learn/notifications`, `/teacher/notifications`. Old class/course notice metadata, scheduling, drafts, and staff edits require independent service/schema authorization review rather than a blind wrapper. vNext user identity is UUID-based and read state remains per-recipient.
