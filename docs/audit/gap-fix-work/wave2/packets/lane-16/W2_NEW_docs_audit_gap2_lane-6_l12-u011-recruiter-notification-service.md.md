# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l12-u011-recruiter-notification-service.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l12-u011-recruiter-notification-service.md

## G2-12-011-001  [P2] GAP  facet F01  effort M
- Legacy: Recruiter bell attached to /recruiter/*, links /recruiter/drives/{jobId}?tab=... (RecruiterNotificationService.java:40-42).
- vNext now: New bell in /hr shell, links /hr/placements/jobs/{uuid} without action tab (hr-recruiter-bell-service.ts:10-19).
- Fix: Map legacy deep links to correct offer, applicants, rounds, requests and messages tabs.

## G2-12-011-008  [P2] GAP  facet F04  effort M
- Legacy: Applicant list shared links applicants tab, offer accepted/declined offers, slots rounds (RecruiterNotificationService.java:84-94).
- vNext now: All bell items link to job detail root (hr-recruiter-bell-service.ts:17).
- Fix: Preserve contextual subtab per event type.

## G2-12-011-011  [P2] GAP  facet F04  effort M
- Legacy: Notification body is drive job title (RecruiterNotificationService.java:98-103,115-119).
- vNext now: Bell items render item.label and time, no body title (hr-recruiter-bell.tsx:102-106).
- Fix: Show drive title second line.

## G2-12-011-013  [P2] GAP  facet F05  effort M
- Legacy: Unread first visit defaults last seven days (RecruiterNotificationService.java:28-30,161-167).
- vNext now: Per-row readAt null, no first-visit seven-day cutoff in service (hr-notifications-service.ts:29-34).
- Fix: Initialize read watermark or filter initial unread age to last7d per old behavior.

## G2-12-011-020  [P2] GAP  facet F09  effort M
- Legacy: Legacy 400px drawer titled Notifications with 4-row skeleton (RecruiterNotificationBell.jsx:104-121).
- vNext now: Desktop Popover and mobile Drawer titled Recruiter notifications with 3-row skeleton (hr-recruiter-bell.tsx:97-129).
- Fix: Clone 400px drawer desktop/mobile and title, skeleton 4 rows.

## G2-12-011-023  [P2] GAP  facet F10  effort M
- Legacy: unreadCount() returns unreadTotal and used by efficient count endpoint (RecruiterNotificationService.java:156-159).
- vNext now: GET bell fetches full listHrNotifications(ctx,{}) every 30s (hr-recruiter-bell.tsx:30-53; bell-service.ts:10-19).
- Fix: Add count-only efficient endpoint and polling path.

## G2-12-011-024  [P2] GAP  facet F10  effort M
- Legacy: markAllRead writes read_through via insert/upsert per recruiter and college (RecruiterNotificationService.java:169-174).
- vNext now: POST updates individual inAppNotifications.readAt after scoped activity join (hr-recruiter-bell-service.ts:22-41).
- Fix: Preserve atomic up-to-now boundary and no hidden-item auto-read.

## G2-12-011-027  [P2] GAP  facet F12  effort M
- Legacy: Unread is timestamp > readThrough; timestamps from same DB clock (RecruiterNotificationService.java:139-148,161-167).
- vNext now: Boolean from readAt null, counts by DB (hr-notifications-service.ts:29-34).
- Fix: Check semantics of event race on markAll and consistent DB clock.

## G2-12-011-030  [P2] GAP  facet F13  effort M
- Legacy: When no readThrough stored, defaults NOW()-7d; all feeds still last30d (RecruiterNotificationService.java:161-167).
- vNext now: If no grants returns status NO_ACCESS; if grants ambiguous CHOOSE_COLLEGE (hr-notifications-service.ts:17-19).
- Fix: Preserve first-visit unread default and distinguish grant selection.

## G2-12-011-031  [P2] GAP  facet F13  effort M
- Legacy: Feed errors handled in UI with Retry and cached last feed (RecruiterNotificationBell.jsx:55-74,113-133).
- vNext now: Failure invalidates state, no Retry button in ErrorState (hr-recruiter-bell.tsx:42-46,97-100).
- Fix: Restore retry and stale warning without leaking private data on revocation.

## G2-12-011-034  [P2] GAP  facet F16  effort M
- Legacy: Legacy always drawer width400px for all widths (RecruiterNotificationBell.jsx:109).
- vNext now: New responsive popover desktop, Drawer mobile breakpoint 767 (hr-recruiter-bell.tsx:55-60,117-126).
- Fix: Match width and position or document approved responsive deviation.

## G2-12-011-036  [P2] GAP  facet F17  effort S
- Legacy: Legacy new item includes sr-only 'New notification.' before title (RecruiterNotificationBell.jsx:149-160).
- vNext now: Unlabeled dot aria-hidden and text title only (hr-recruiter-bell.tsx:102-106).
- Fix: Add readable 'New notification' text for screen readers.

## G2-12-011-038  [P2] GAP  facet F19  effort M
- Legacy: Polling every30s only if document.visibilityState visible; count-only if supported (RecruiterNotificationBell.jsx:24-53).
- vNext now: Every30s regardless of visibility, entire feed via GET bell (hr-recruiter-bell.tsx:47-53).
- Fix: Throttle hidden tab and use lightweight count request.

## G2-12-011-040  [P2] GAP  facet F20  effort M
- Legacy: Mark unread when opening only if no older unread hidden; explicit Mark all read for hidden (RecruiterNotificationBell.jsx:76-103).
- vNext now: Explicit Mark all read available whenever unread>0, no auto read (hr-recruiter-bell.tsx:75-95).
- Fix: Guard against accidentally acknowledging unseen events, preserve action visibility.

## G2-12-011-043  [P2] GAP  facet F22  effort M
- Legacy: Reads recruiter_notification_read table keyed recruiter_id/college_id; read_through (RecruiterNotificationService.java:161-174).
- vNext now: Uses per-notification inAppNotifications.readAt keyed user/event (hr-recruiter-bell-service.ts:32-41).
- Fix: Specify migration/semantic mapping for existing read markers and unread-on-first-visit.

## G2-12-011-035  [P3] GAP  facet F17  effort S
- Legacy: Legacy notification button data-testid=recruiter.notification-bell, aria label 'Notifications, N new' (RecruiterNotificationBell.jsx:104-108).
- vNext now: Aria 'Notifications, N unread', no test-id (hr-recruiter-bell.tsx:109-115).
- Fix: Restore aria/test identifiers for automation without reducing descriptive wording.

## G2-12-011-037  [P3] GAP  facet F18  effort S
- Legacy: Legacy title Notifications, empty title Nothing yet, body Replies and drive decisions will show up here (RecruiterNotificationBell.jsx:109,140-146).
- vNext now: Empty copy matches but popover title Recruiter notifications, footer See all notifications (hr-recruiter-bell.tsx:90-105,117-126).
- Fix: Restore drawer title exact casing and preserve empty text.
