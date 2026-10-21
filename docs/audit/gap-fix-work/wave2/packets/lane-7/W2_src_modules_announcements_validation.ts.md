# Work packet (wave 2): edit src/modules/announcements/validation.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/announcement-controller.md, docs/audit/gap2/lane-3/l15-u021-announcement-model.md

## G2-14-014-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy getDisplayName returns title or empty string `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchDTO.java:20-25`
- vNext now: New title required trimmed nonempty max255 `src/modules/announcements/validation.ts:15-28`
- Fix: Handle migrated nullable title in search rendering

## G2-14-014-012  [P2] GAP  facet F05  effort S
- Legacy: Legacy search default limit15 and no pagination cursor `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:41-44` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:54-55`
- vNext now: New admin list default limit50 max100 and keyset cursor `src/modules/announcements/validation.ts:15-20` `src/modules/announcements/validation.ts:65-79`
- Fix: Create compact search limit15, keep admin cursor independently

## G2-14-014-017  [P2] GAP  facet F06  effort S
- Legacy: query is optional string default empty and limit default15 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:41-44`
- vNext now: q must have 1..120 characters if supplied, default list limit50 `src/modules/announcements/validation.ts:65-79`
- Fix: Convert empty query to absent for compatibility

## G2-14-014-018  [P2] GAP  facet F06  effort S
- Legacy: Legacy limit integer has no positive/max bound `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:41-44` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:54-55`
- vNext now: New limit 1..100 strict Zod `src/modules/announcements/validation.ts:65-79`
- Fix: Reject invalid limits with documented API error and clamp old query as needed

## G2-14-014-062  [P2] GAP  facet F22  effort M
- Legacy: Legacy announcement title/message no explicit entity max `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:30-34`
- vNext now: New title varchar255 and input message max10000 `src/db/schema/db10-announcements.ts:28-29` `src/modules/announcements/validation.ts:15-28`
- Fix: Audit oversized legacy messages and titles before import

## G2-2-025-013  [P2] GAP  facet F04  effort M
- Legacy: AnnouncementCreateRequest.java:12-35 receiverType/value, title max255,message max10000,scheduledAt,expiresAt,pin
- vNext now: src/modules/announcements/validation.ts:15-37 bounds match but uses UUID receiverId and explicit ISO
- Fix: Translate numeric receiverValue and India wall-clock schedule safely.

## G2-2-025-015  [P2] GAP  facet F05  effort M
- Legacy: AnnouncementController.java:82-103 admin list default page0 size20
- vNext now: src/modules/announcements/validation.ts:65-79 cursor limit50 default
- Fix: Restore page20 default or show deliberate cursor paging difference.

## G2-2-025-020  [P2] GAP  facet F06  effort M
- Legacy: AnnouncementCreateRequest.java:33-35 LocalDateTime schedule/expiry/pin optional
- vNext now: src/modules/announcements/validation.ts:22-31 offset ISO datetimes, pin defaultfalse
- Fix: Parse IST accurately; retain immediate/no-expiry defaults.

## G2-2-025-032  [P2] GAP  facet F10  effort M
- Legacy: AnnouncementController.java:58-79 sanitizer Jsoup.relaxed message, no tags in title
- vNext now: src/modules/announcements/validation.ts:27-28 plain trimmed text; no trusted HTML renderer
- Fix: Decide sanitized rich HTML parity versus deliberate plain text, do not render raw HTML.

## G2-2-025-056  [P2] GAP  facet F18  effort M
- Legacy: AnnouncementCreateRequest.java:18-24 exact Title/Message errors
- vNext now: src/modules/announcements/validation.ts:27-28 bounds but default Zod messages
- Fix: Restore exact validation language.

## G2-2-025-059  [P2] GAP  facet F19  effort M
- Legacy: AnnouncementController.java:82-103 paged20; learner/faculty paged10
- vNext now: src/modules/announcements/validation.ts:15-20 default50,max100
- Fix: Match per-role pagination and avoid querying unbounded recipient feeds.

## G2-2-025-063  [P2] GAP  facet F20  effort M
- Legacy: AnnouncementController.java:67-72 Jsoup relaxed ensures HTML safe
- vNext now: src/modules/announcements/validation.ts:27-28 text
- Fix: Enforce safe plain text or sanitized HTML consistently in web/notification.

## G2-2-025-070  [P2] GAP  facet F23  effort M
- Legacy: AnnouncementController.java:58-80 HTML sanitization and own sender
- vNext now: src/modules/announcements/validation.ts:24-37 plain strings; service.ts:156-170 server sender
- Fix: Explicitly disposition rich content vs plain text; preserve actor provenance.

## G2-15-021-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:30-34`
- vNext now: `src/modules/announcements/validation.ts:15-28`
- Fix: Legacy title/message unconstrained @Column, vNext trimmed required title<=255 and message<=10000.

## G2-15-021-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29`
- vNext now: `src/modules/announcements/validation.ts:7-11`
- Fix: Legacy receiver type enum, vNext enum values and UUID picker validation; map legacy faculty/class IDs.

## G2-15-021-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:52-68`
- vNext now: `src/modules/announcements/validation.ts:24-35`
- Fix: Legacy nullable timestamps no on-entity schedule order validation, vNext validator rejects expiry<=schedule.

## G2-15-021-034  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29`
- vNext now: `src/modules/announcements/validation.ts:24-31`
- Fix: User forms now must input UUID receiver scope with separately chosen type; fields/labels differ from numeric old consumer.

## G2-15-021-035  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:30-34`
- vNext now: `src/modules/announcements/validation.ts:24-35`
- Fix: Old field validation largely service-level; vNext Zod title/description/schedule errors need aria-describedby/field focus.

## G2-15-021-038  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:49-50`
- vNext now: `src/modules/announcements/validation.ts:65-71`
- Fix: Legacy `isDeleted` shown indirectly in lifecycle, vNext admin label DELETED with restored state and filter.
