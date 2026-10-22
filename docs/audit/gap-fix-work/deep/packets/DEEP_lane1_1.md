# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-13-031-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-016-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-016-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-016-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-016-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-016-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-016-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-026-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-4-028-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-004-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)

## Results

- OK G2-4-016-015 — `src/modules/notifications/exotel-sms.ts:119-126,143-157` keeps unscoped OTP attempts nullable while accepting verified college/organization context; `drizzle/0162_lane15_sms_attempt_audit.sql:3-7` permits NULL scope, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:51-52` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-229`.
- OK G2-4-016-046 — `src/modules/notifications/exotel-sms.ts:143-157` inserts one new attempt without upsert on each invocation; `drizzle/0162_lane15_sms_attempt_audit.sql:3-19` provides a generated unique attempt ID, matching append-on-send behavior `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-233`.
- OK G2-4-016-060 — `src/db/schema/messaging-receipts.ts:157-165` declares attempted-at and `(recipient_suffix,purpose,attempted_at)` indexes, registered in `drizzle/0162_lane15_sms_attempt_audit.sql:20-24`, matching `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:37-40`.
- OK G2-4-016-070 — `src/db/schema/messaging-receipts.ts:169-174,183-199` distinguishes PROVIDER_ACCEPTED from handset delivery and maps legacy SENT correctly; `src/modules/notifications/exotel-sms.ts:93-95` explicitly documents provider acceptance only, matching `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:26-30`.

- OK G2-4-026-045 — src/app/api/public/recruit-from-us/send-code/route.ts:7-25 and src/modules/placements/public-enquiry/send-service.ts:33-43 gate on resolved college, enabled published page, and eligibility; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:58-63.
- OK G2-4-016-048 — src/modules/notifications/exotel-sms.ts:100-110,235-250 records FAILED configuration attempts with safe reason; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:95-101,148-153.

- OK G2-13-031-089 — src/modules/placements/report-model.ts:1093-1117 keys company joining outcomes by membershipId, then counts one offer per learner, exposed through src/app/(authenticated)/tpo/reports/joining-status/page.tsx:37-80; matches distinct-per-company learner semantics in docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:638-644.

- FIXED G2-5-004-069 — commits 66b5855, e713a0a, ffa45f5; src/modules/projects/mentor-calendar-view.ts now admits validated REQUESTED and COMPLETED join URLs (except CANCELLED), and src/components/projects/mentor-meetings-calendar.tsx opens join links in the same tab; legacy docs/legacy-source/frontend/src/pages/mentor/calendar.js:85-86,120-125.

- OK G2-4-016-002 — shared appendSmsDeliveryAttempt in src/modules/notifications/exotel-sms.ts:116-159 is called for OTP at :160-166, for guardian attendance in src/modules/attendance/parent-sms-provider.ts:17-29, for job.update/notification in src/modules/notifications/legacy-sms-notice-provider.ts:39-58 and src/modules/messaging/providers.ts:264-273; matches sender purposes in docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-133,220-233.

- FIXED G2-4-028-004 — commit 8b23366, src/app/(authenticated)/tpo/team/page.tsx:28-45 now prioritizes people/members route (dropping all other query parameters), then forwards conversation parameters to the messages destination, matching docs/legacy-source/frontend/src/pages/tpo/team.js:8-9.
