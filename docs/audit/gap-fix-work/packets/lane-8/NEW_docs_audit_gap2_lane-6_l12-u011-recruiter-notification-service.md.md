# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l12-u011-recruiter-notification-service.md

13 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l12-u011-recruiter-notification-service.md

## G2-12-011-003  [P1] GAP  facet F02  effort M
- Legacy: Feed max40 items 30 days, newest-first (RecruiterNotificationService.java:65-70,136-137).
- vNext now: Bell 10 most recent inbox rows, not 40 (hr-recruiter-bell-service.ts:10-19).
- Fix: Show 40 items or provide equivalent immediate reachability to all entries.

## G2-12-011-004  [P1] GAP  facet F02  effort M
- Legacy: Feed uses up to 40 audit,40 changes, unread messages then top40 sorted (RecruiterNotificationService.java:75-137).
- vNext now: Filters persisted placement_job activity notifications only (hr-notifications-service.ts:20-45).
- Fix: Union recruiter message threads and change-request events into same feed.

## G2-12-011-006  [P1] GAP  facet F03  effort M
- Legacy: Read markers isNew per event after readThrough, separate hiddenUnread count (RecruiterNotificationService.java:139-153).
- vNext now: Each item.unread boolean, no hidden unread banner (hr-recruiter-bell.tsx:101-106).
- Fix: Show older hidden unread count and defer auto-read for hidden entries.

## G2-12-011-009  [P1] MISSING  facet F04  effort M
- Legacy: Message thread body and subject shown as 'New message: <subject>' plus lastBody (RecruiterNotificationService.java:122-132).
- vNext now: No message items; bell list has label and timestamp only (hr-recruiter-bell.tsx:102-106).
- Fix: Include unread messages with subject and snippet, safely truncated.

## G2-12-011-010  [P1] MISSING  facet F04  effort M
- Legacy: Change request variants exact Asked for a change/Declined your request/Accepted/Answered (RecruiterNotificationService.java:107-116).
- vNext now: Only HR_NOTIFICATION_EVENTS activity subset, not change request relation (hr-notifications-service.ts:20-28).
- Fix: Map company requests statuses including REPLIED as declined.

## G2-12-011-019  [P1] GAP  facet F08  effort M
- Legacy: Legacy refresh failure keeps last feed + PanelPartial 'Showing the last notifications we loaded.' (RecruiterNotificationBell.jsx:76-81,123-133).
- vNext now: New load failure sets state(null), loses feed on all failure (hr-recruiter-bell.tsx:30-47).
- Fix: Preserve last-good private feed on recoverable network errors, but clear on 401/403.

## G2-12-011-021  [P1] GAP  facet F09  effort M
- Legacy: On opening drawer auto-mark read if all unread visible; hiddenUnread prevents (RecruiterNotificationBell.jsx:76-91).
- vNext now: Opening bell never marks read; manual Mark all read footer (hr-recruiter-bell.tsx:90-129).
- Fix: Restore conditional auto-read only when all unread loaded and no hidden count.

## G2-12-011-022  [P1] GAP  facet F10  effort M
- Legacy: feed(recruiterId,collegeId) derives audit, requests, messages from SQL and returns {feed,unread,unreadTotal} (RecruiterNotificationService.java:70-153).
- vNext now: GET bell {status,unread,items} from persisted notifications (hr-recruiter-bell-service.ts:10-19).
- Fix: Implement compatibility projection with feed/unread/unreadTotal and action links.

## G2-12-011-028  [P1] MISSING  facet F12  effort M
- Legacy: REPLIED change_request represents declined, ACCEPTED accepted, ANSWERED answered (RecruiterNotificationService.java:109-115).
- vNext now: No query for drive_change_request in bell services (hr-recruiter-bell-service.ts:10-43).
- Fix: Map all three status-specific notifications safely.

## G2-12-011-029  [P1] MISSING  facet F12  effort M
- Legacy: Recruiter messages only if unread>0 and within 30d (RecruiterNotificationService.java:122-134).
- vNext now: No messaging threads union (hr-notifications-service.ts:20-45).
- Fix: Add unread thread fetch with 30d and tenant scope.

## G2-12-011-042  [P1] MISSING  facet F21  effort M
- Legacy: Integrates tpo_audit_log, job, job_round, job_offer, job_application, drive_change_request, TpoMessagesService (RecruiterNotificationService.java:44-63,122-134).
- vNext now: Integrates activityEvents+inAppNotifications+recruiter jobs only (hr-notifications-service.ts:2-8,20-45).
- Fix: Wire equivalent producers/queries for omitted audit and message sources.

## G2-12-011-044  [P1] MISSING  facet F23  effort M
- Legacy: Old event taxonomy has 12 audit actions, changes, unread messages (RecruiterNotificationService.java:45-54,106-134).
- vNext now: New only fixed HR_NOTIFICATION_EVENTS; no message/change union (hr-notifications-service.ts:24-28).
- Fix: Write complete event producer parity list before fix, preserve tenant boundaries.

## G2-12-011-018  [P2] GAP  facet F08  effort M
- Legacy: Legacy bell 'Notifications loaded, but read status could not be saved' warning and Retry (RecruiterNotificationBell.jsx:104-119).
- vNext now: On read failure clears feed and shows 'Read status could not be confirmed. Reload notifications before retrying.' (hr-recruiter-bell.tsx:75-88).
- Fix: Preserve feed and exact warning with Retry action.
