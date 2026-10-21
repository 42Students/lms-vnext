# Work packet (wave 2): edit src/app/(authenticated)/mentor/notifications/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u026-mentor-notifications.md

## G2-7-026-001  [P2] GAP  facet F01  effort M
- Legacy: notifications.js:348-355 /mentor/notifications renders Notifications heading with subtitle and one unified feed
- vNext now: mentor/notifications/page.tsx:93-95 same title/subtitle, three grouped sections
- Fix: Preserve unified feed landing structure or document approved separation

## G2-7-026-006  [P2] GAP  facet F02  effort M
- Legacy: notifications.js:348-400 one canvas with CourseSectionHeader then one notification list
- vNext now: mentor/notifications/page.tsx:93-193 PageHeader, warning, Personal notifications, Project attention, College announcements
- Fix: Match unified content hierarchy and avoid repeated section cards

## G2-7-026-008  [P2] GAP  facet F02  effort S
- Legacy: notifications.js:350-356 CourseSectionHeader in ln-module-card
- vNext now: mentor/notifications/page.tsx:93-95 shared PageHeader in div
- Fix: Match legacy page-head title/subtitle geometry inside canvas

## G2-7-026-009  [P2] GAP  facet F03  effort M
- Legacy: notifications.js:94-100 tone maps Bell/Warning/Clock icons and color
- vNext now: mentor/notifications/page.tsx:174-181 StatusBadge without leading kind icon
- Fix: Restore type icons and correct color mapping

## G2-7-026-011  [P2] GAP  facet F03  effort S
- Legacy: notifications.js:385-389 green CheckCircle empty graphic
- vNext now: mentor/notifications/page.tsx:167-170 plain empty paragraph; notification-list.tsx:87-101 text only
- Fix: Restore green success graphic for empty unified feed

## G2-7-026-027  [P2] GAP  facet F05  effort M
- Legacy: notifications.js:392-394 renders all matched items in one list, no group pagination
- vNext now: mentor/notifications/page.tsx:91-127 personal nextCursor Older, attention all
- Fix: Preserve complete browse access with explicit pagination

## G2-7-026-029  [P2] GAP  facet F06  effort S
- Legacy: notifications.js:250-282 retryCount increment loads all sources
- vNext now: mentor/notifications/page.tsx:101-103 Link to /mentor/notifications reloads server data
- Fix: Retain current filter state or visibly reset when retrying

## G2-7-026-042  [P2] GAP  facet F10  effort L
- Legacy: notificationService.js:12-13 GET fetchAllTypesAnnouncement for college/dept/faculty pages
- vNext now: mentor/notifications/page.tsx:62-70 listVisibleAnnouncementsForMembership service query
- Fix: Map recipient audience parity for announcements

## G2-7-026-058  [P2] GAP  facet F13  effort M
- Legacy: notifications.js:357-362 three row skeletons during loading
- vNext now: mentor/notifications/page.tsx:53-93 server data fetched before render
- Fix: Add loading.tsx skeleton with matched row shapes

## G2-7-026-067  [P2] GAP  facet F16  effort M
- Legacy: notifications.js:348-400 one module-card scroll-container with rows
- vNext now: mentor/notifications/page.tsx:93-193 main div + three sections
- Fix: Restore continuous surface, avoid extra stacking on mobile

## G2-7-026-069  [P2] GAP  facet F17  effort S
- Legacy: notifications.js:136-148 skeleton marked aria-hidden
- vNext now: mentor/notifications/page.tsx:93-193 no row skeleton in source
- Fix: If loading placeholder exists, hide decorative skeleton from accessibility tree

## G2-7-026-076  [P2] GAP  facet F18  effort S
- Legacy: notifications.js:383-389 Nothing needs your attention right now.
- vNext now: mentor/notifications/page.tsx:167-170 exact only on project attention section
- Fix: Use phrase for whole feed when all sections empty

## G2-7-026-079  [P2] GAP  facet F19  effort S
- Legacy: notifications.js:250-282 re-fetch on user/college/projectsOn/retryCount
- vNext now: mentor/notifications/page.tsx:22 force-dynamic per request and Link Retry
- Fix: Compare update cadence and unread freshness after mutations

## G2-7-026-084  [P2] GAP  facet F21  effort L
- Legacy: notifications.js:10-13 getProjects, notificationService and recipient API integrations
- vNext now: mentor/notifications/page.tsx:53-79 inAppNotifications, announcements and DB project attention services
- Fix: Document complete endpoint/service mapping for migration

## G2-7-026-090  [P2] GAP  facet F23  effort M
- Legacy: notifications.js:383-389 one all-sources empty state
- vNext now: mentor/notifications/page.tsx:119-121,167-170 and announcement-feed.tsx:79-82 three separate empties
- Fix: Show unified no-attention state only when all sources empty
