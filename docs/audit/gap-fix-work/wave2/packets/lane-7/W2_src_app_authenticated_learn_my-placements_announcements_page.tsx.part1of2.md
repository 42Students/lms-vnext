# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/announcements/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-announcements.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-13-006-001  [P2] GAP  facet F01  effort M
- Legacy: Page route /learn/my-placements/announcements under PlacementsTabsLayout (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:80-80`)
- vNext now: Same route, standalone PageHeader with back link (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:80-85`)
- Fix: Restore placement tab strip and shell around announcements.

## G2-13-006-002  [P2] GAP  facet F01  effort M
- Legacy: Segmented two tabs Announcements and Updates about you with ?show=updates (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:22-23`)
- vNext now: Two anchor shortcuts to same page sections, no show filter support (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-91`)
- Fix: Implement toggle/view routing preserving ?show=updates and selected tab.

## G2-13-006-004  [P2] GAP  facet F02  effort M
- Legacy: Only selected tab content rendered in one sp-panel Card (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:52-75`)
- vNext now: Both college notice list and personal alerts appear on page separated by long filters (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-260`)
- Fix: Default Announcements-only pane; allow Updates toggle rather than stacked scroll.

## G2-13-006-005  [P2] GAP  facet F02  effort S
- Legacy: Tab toggle appears before alert and panel, no page-specific PageHeader (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:45-53`)
- vNext now: New PageHeader and Back to My Placements appear ahead of shortcuts (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:81-92`)
- Fix: Match order and preserve parent navigation.

## G2-13-006-006  [P2] GAP  facet F02  effort M
- Legacy: Announcement cards inside sp-panel container (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:52-56`)
- vNext now: New list bordered divide-y no enclosing sp-panel (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:189-225`)
- Fix: Match panel border/background/card spacing.

## G2-13-006-007  [P2] GAP  facet F03  effort S
- Legacy: AntD segmented button uses aria-pressed (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:47-50`)
- vNext now: Anchor href #college-notices / #personal-updates (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-91`)
- Fix: Restore selected visual state and button semantics.

## G2-13-006-008  [P2] GAP  facet F03  effort S
- Legacy: Updates count tab shows total updates.length, including read (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:48-50`)
- vNext now: New tab shows unreadCount only, with unread qualifier (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-90`)
- Fix: Show total update count or clearly label intentional unread-only metric.

## G2-13-006-009  [P2] GAP  facet F03  effort S
- Legacy: Announcement pinned icon PushpinFilled at title start (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:63-70`)
- vNext now: New Pinned Badge above headline (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:191-198`)
- Fix: Restore icon placement and pin density.

## G2-13-006-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy meta line combines authorName, sentAt, showUntil date (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:72-76`)
- vNext now: New separate Issued by senderLabel and For audience, date below, no showUntil (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:198-221`)
- Fix: Reproduce author/time/expiration metadata or document dropped fields.

## G2-13-006-013  [P2] GAP  facet F03  effort M
- Legacy: Announcement body HTTPS URL text auto-linkifies (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:14-20`)
- vNext now: New renders announcement.message as plain paragraph text (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:203-203`)
- Fix: Render safe https linkified body preserving exact text/target.

## G2-13-006-014  [P2] GAP  facet F03  effort S
- Legacy: External link button uses linkLabel or Open, new-tab icon (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:79-83`)
- vNext now: New ThirdPartyLink buttonUrl/buttonLabel strictly validated HTTPS (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:204-207`)
- Fix: Preserve valid https buttons and Open fallback; reject unsafe origins as security enhancement.

## G2-13-006-017  [P2] GAP  facet F04  effort S
- Legacy: Date format D MMM, h:mm A (year only when previous year) (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:7-12`)
- vNext now: New dateStyle medium only, no time; fixed Asia/Kolkata (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:216-220`)
- Fix: Restore exact date/time and conditional year; test timezone.

## G2-13-006-024  [P2] GAP  facet F06  effort S
- Legacy: Legacy toggle updates by shallow router.replace ?show=updates (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:22-23`)
- vNext now: New views use same-page hash anchors and multiple GET filter forms (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-108`)
- Fix: Preserve URL show parameter and back/forward tab semantics.

## G2-13-006-034  [P2] GAP  facet F09  effort S
- Legacy: Clicking notice body HTTPS opens new tab, not dialog (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:14-20`)
- vNext now: Body is text; explicit action button via ThirdPartyLink (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:203-207`)
- Fix: Restore inline URL click target with security-safe link.

## G2-13-006-035  [P2] GAP  facet F10  effort M
- Legacy: GET learner/placement/announcements returns college notices (`docs/legacy-source/frontend/src/api/Services/TpoHubService.js:213-215`)
- vNext now: Server calls listVisibleAnnouncementsForMembership and maps targeted feed (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:60-66`)
- Fix: Reconcile endpoint response fields and delivery targeting.

## G2-13-006-037  [P2] GAP  facet F10  effort M
- Legacy: Two independent requests load concurrently and failure doesn't block other view (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:27-41`)
- vNext now: New sequential server section queries optional sources, fallback partial warning (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:60-79`)
- Fix: Run independent sources in parallel where allowed, avoid latency cascade.

## G2-13-006-038  [P2] GAP  facet F10  effort M
- Legacy: No local POST for announcements page; read event emitted to client (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-42`)
- vNext now: New TpoNoticeAcknowledge component performs explicit read side effect (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:209-209`)
- Fix: Map read-event to durable per-user acknowledgment and bell count.

## G2-13-006-045  [P2] GAP  facet F12  effort M
- Legacy: Old highlights selected notice ID and scrolls it into center (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:43-48`)
- vNext now: New anchor focus page and recovery link (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:161-169`)
- Fix: Preserve scrollIntoView center/highlight styling for target item.

## G2-13-006-051  [P2] GAP  facet F14  effort S
- Legacy: Legacy student notice may include direct HTTPS action button and drive link (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:79-83`)
- vNext now: New uses validated external button; no saved job link (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:204-208`)
- Fix: Restore authorized job links; keep safe URL validation.

## G2-13-006-055  [P2] GAP  facet F16  effort M
- Legacy: Old segmented tab row and sp-panel with compact list cards (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:46-75`)
- vNext now: New vertically long stacked sections, horizontal shortcut pills and advanced filters (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:80-151`)
- Fix: Compare 375/768/1280 hierarchy and horizontal overflow; restore tab switch.

## G2-13-006-056  [P2] GAP  facet F16  effort S
- Legacy: AnnouncementList body and actions wrap within announcement-card (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:62-83`)
- vNext now: New list li and ThirdPartyLink may wrap underneath metadata (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:189-222`)
- Fix: Match card padding/density at mobile and desktop.

## G2-13-006-057  [P2] GAP  facet F17  effort S
- Legacy: Legacy tabs are buttons with aria-pressed inside role group (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:47-50`)
- vNext now: New anchor shortcuts have no active aria-pressed/selected state (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-91`)
- Fix: Use accessible tablist/button or segmented control with selected state.

## G2-13-006-058  [P2] GAP  facet F17  effort S
- Legacy: Old highlightId scrollIntoView smooth block center (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:43-48`)
- vNext now: New notice IDs anchor + missing-focus recovery; no automatic smooth scroll (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:161-191`)
- Fix: Restore focused item scroll and style without motion for reduced-motion.

## G2-13-006-061  [P2] GAP  facet F18  effort S
- Legacy: Old segment label Updates about you (N) for total updates (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:48-50`)
- vNext now: New Updates about you (N unread) (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-90`)
- Fix: Restore exact label and count type.

## G2-13-006-062  [P2] GAP  facet F18  effort S
- Legacy: Old main error Couldn't load everything, Retry (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:51-51`)
- vNext now: New College notices temporarily unavailable and Retry college notices (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:174-181`)
- Fix: Preserve shared error text or source-specific error copy with same recoverability.

## G2-13-006-066  [P2] GAP  facet F20  effort S
- Legacy: Unknown ?show defaults announcements; recognized updates is exact lowercase (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:22-23`)
- vNext now: New ignores show entirely, renders both (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:39-43`)
- Fix: Handle `show=updates`, invalid value fallback.

## G2-13-006-069  [P2] GAP  facet F21  effort L
- Legacy: Old getPlacementOverview plus getStudentAnnouncements Axios calls (`docs/legacy-source/frontend/src/api/Services/TpoHubService.js:169-215`)
- vNext now: New direct announcement DB10 and activity notifications services (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:58-79`)
- Fix: Verify event source/targeting parity across schemas/migrations.

## G2-13-006-070  [P2] GAP  facet F21  effort S
- Legacy: Legacy custom placement-announcements-read event syncs bell state (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-36`)
- vNext now: New explicit read mutation component, no custom DOM event (`src/app/(authenticated)/learn/my-placements/announcements/page.tsx:209-209`)
- Fix: Ensure global bell revalidates promptly without manual refresh.

## G2-19-023-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:14-18`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:39-59`
- Fix: Legacy /api/v1/learner/placement/announcements list/unread headless endpoints, vNext SSR /learn/my-placements/announcements and explicit notice-read API.

## G2-19-023-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:232-236`
- Fix: Legacy /unread counts unread TPO announcements; vNext unread filter/count on page reflects *personal alerts* only, not college notice count.

## G2-19-023-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:82-92`
- Fix: Legacy GET controller no direct layout; consuming learner announcements tab lists notices, new PageHeader with two anchors Announcements/Updates about you.

## G2-19-023-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:286-301`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:189-225`
- Fix: Legacy pinned-first notices read on open, vNext cards with pinned/updated/new badges and explicit Mark notice read.

## G2-19-023-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-300`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:192-220`
- Fix: Legacy authorName Placement cell, `forYou`, pinned flag and unread boolean; vNext senderLabel, audienceLabel, new seven-day badge.

## G2-19-023-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:88-91`
- Fix: Legacy unread count appears on Announcements tab; new top anchor shows Updates about you (N unread), a different population.

## G2-19-023-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-300`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:192-220`
- Fix: Legacy per-notice unread boolean directly from receipt table, vNext seven-day New means age not unread receipt.

## G2-19-023-015  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:70-75`
- Fix: Legacy unread count a standalone GET over full targeted feed; new local feed capped100 and no corresponding total unread for college notices.

## G2-19-023-024  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-301`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:189-224`
- Fix: Legacy rows can have job deep link, vNext safe external CTA and notice anchor; legacy link action not mirrored as jobId.

## G2-19-023-034  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:27-29`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:170-179`
- Fix: Legacy missing learner role returns empty []/0, vNext denies page before rendering.

## G2-19-023-035  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:282-301`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:161-178`
- Fix: Legacy absent/expired notice simply disappears, vNext focused stale notice recovery link, explicit missing state.

## G2-19-023-036  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/app/(authenticated)/learn/my-placements/announcements/page.tsx:182-187`
- Fix: Legacy no notices empty [] response, vNext dedicated no matching/filtered message.
