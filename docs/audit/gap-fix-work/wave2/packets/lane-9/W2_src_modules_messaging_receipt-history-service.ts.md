# Work packet (wave 2): edit src/modules/messaging/receipt-history-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy controller returns JSON response only, with content and total/page metadata. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-83`)
- vNext now: New TPO aggregate receipt history returns page/total/rows and separate detail, not SMS attempts. (`src/modules/messaging/receipt-history-service.ts:43-82`)
- Fix: Create compatible response model for Super Admin read.

## G2-4-016-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy row shows purpose, suffix, status, providerMessageId, errorSummary, collegeId, createdAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:24-55`)
- vNext now: New TPO history shows purpose,total,queued,sent,failed,suppressed, timestamps, not attempt detail. (`src/modules/messaging/receipt-history-service.ts:66-81`)
- Fix: Expose seven thin attempt columns without body/full phone.

## G2-4-016-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy default page zero-based and size50; request size clamped 1..200. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:53-57`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:71-72`)
- vNext now: New TPO history page is 1-based, hard-coded 25. (`src/modules/messaging/receipt-history-service.ts:12-13`; `src/modules/messaging/receipt-history-service.ts:65-81`)
- Fix: Use original page/size API adapter or explicitly migrate client pagination.

## G2-4-016-019  [P2] GAP  facet F05  effort S
- Legacy: Legacy ordering createdAt descending then id descending. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`)
- vNext now: New history batches order createdAt desc then id desc; not per SMS attempt. (`src/modules/messaging/receipt-history-service.ts:76-80`)
- Fix: Maintain newest-first tie-break on dedicated attempt table.

## G2-4-016-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy query returns totalElements,totalPages,number,size. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:74-80`)
- vNext now: New history result names total,pages,page,pageSize. (`src/modules/messaging/receipt-history-service.ts:80-81`)
- Fix: Adapt metadata keys for existing callers.

## G2-4-016-021  [P2] MISSING  facet F05  effort M
- Legacy: Legacy suffix matching exact after normalizing last four digits. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-68`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-20`)
- vNext now: New TPO history has no suffix parameter. (`src/modules/messaging/receipt-history-service.ts:50-56`)
- Fix: Add normalized last-four search input with exact suffix predicate.

## G2-4-016-022  [P2] GAP  facet F05  effort S
- Legacy: Legacy purpose search equality not substring. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-21`)
- vNext now: New purpose filter also equality for batches, not attempts. (`src/modules/messaging/receipt-history-service.ts:52-56`)
- Fix: Carry exact filtering to SMS attempt collection.

## G2-4-016-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy controller inputs recipientSuffix,purpose,page,size; no POST form mutation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-57`)
- vNext now: New history accepts page/purpose, lacks recipientSuffix and size. (`src/modules/messaging/receipt-history-service.ts:43-56`)
- Fix: Expose exact filtering form/API params and read-only permissions.

## G2-4-016-024  [P2] MISSING  facet F06  effort S
- Legacy: Legacy non-digit suffix characters stripped; full number pasted uses final four digits. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-68`)
- vNext now: New no suffix search or automatic normalization. (`src/modules/messaging/receipt-history-service.ts:51-56`)
- Fix: Normalize pasted phone to suffix without storing full value in logs.

## G2-4-016-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy page negative coerced to zero; size <=0 becomes1, >200 becomes200. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:71-72`)
- vNext now: New page schema requires >=1 and <=10000, size fixed25. (`src/modules/messaging/receipt-history-model.ts:3-6`; `src/modules/messaging/receipt-history-service.ts:12-13`)
- Fix: Define explicit compatibility behavior for invalid page/size.

## G2-4-016-047  [P2] GAP  facet F13  effort S
- Legacy: Legacy no records returns empty content array and total count zero. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:71-83`)
- vNext now: New TPO history returns empty rows, but no global attempt listing. (`src/modules/messaging/receipt-history-service.ts:62-81`)
- Fix: Distinguish zero attempts, DB unavailable and unsupported pipeline.

## G2-4-016-061  [P2] GAP  facet F19  effort M
- Legacy: Legacy search server pages at most200 items ordered descending. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:71-79`)
- vNext now: New TPO history pages25 and scoped by college, no SMS attempt pagination. (`src/modules/messaging/receipt-history-service.ts:12-13`; `src/modules/messaging/receipt-history-service.ts:65-81`)
- Fix: Implement bounded keyset or offset paging, stable ordering, known totals.
