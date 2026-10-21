# Work packet (wave 2): edit src/modules/messaging/receipt-history-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy API includes explicit provider-acceptance cautionary note on every page. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:80-83`)
- vNext now: New TPO history model comments acceptance, but payload has no equivalent human-readable caution note. (`src/modules/messaging/receipt-history-model.ts:20-34`)
- Fix: Display acceptance-not-delivery caution in support UI/API.

## G2-4-016-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy page negative coerced to zero; size <=0 becomes1, >200 becomes200. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:71-72`)
- vNext now: New page schema requires >=1 and <=10000, size fixed25. (`src/modules/messaging/receipt-history-model.ts:3-6`; `src/modules/messaging/receipt-history-service.ts:12-13`)
- Fix: Define explicit compatibility behavior for invalid page/size.

## G2-4-016-058  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact note says SENT means operator accepted, handset delivery not reported. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:80-83`)
- vNext now: New batch model uses acceptedByProvider metric instead of SENT text. (`src/modules/messaging/receipt-history-model.ts:20-34`)
- Fix: Use clear Provider accepted status with tooltip/note and no false Delivered label.

## G2-4-016-025  [P3] GAP  facet F06  effort S
- Legacy: Legacy blank purpose trimmed to null (all purposes). (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:69-72`)
- vNext now: New history query optional trim of purpose up to160. (`src/modules/messaging/receipt-history-model.ts:3-6`)
- Fix: Match empty-purpose default and cap to purpose64.
